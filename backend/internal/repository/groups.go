package repository

import (
	"context"
	"fmt"
	"strings"

	"github.com/Nerzal/gocloak/v13"
	"github.com/jmoiron/sqlx"
	"go.uber.org/zap"

	"github.com/IA-Generative/keycloak-comu-new/backend/internal/groups/domain"
	"github.com/IA-Generative/keycloak-comu-new/backend/internal/groups/ports"
)

// ══════════════════════════════════════════════════════════════════════════
// DB row types used by sqlx scanning
// ══════════════════════════════════════════════════════════════════════════

type groupRow struct {
	ID   string `db:"id"`
	Name string `db:"name"`
}

type attributeRow struct {
	Name  string `db:"name"`
	Value string `db:"value"`
}

type memberRow struct {
	ID        string `db:"id"`
	Username  string `db:"username"`
	Email     string `db:"email"`
	FirstName string `db:"first_name"`
	LastName  string `db:"last_name"`
}

type globalRequestRow struct {
	GroupID       string `db:"groupId"`
	GroupName     string `db:"groupName"`
	UserID        string `db:"userId"`
	UserEmail     string `db:"userEmail"`
	UserFirstName string `db:"userFirstName"`
	UserLastName  string `db:"userLastName"`
}

// ══════════════════════════════════════════════════════════════════════════
// Bootstrap: find root group (uses KC API at startup only)
// ══════════════════════════════════════════════════════════════════════════

func (r *KeycloakRepository) FindRootGroupID(ctx context.Context, token string, realm string, path string) (string, error) {
	if path == "/" {
		return " ", nil
	}
	groups, err := r.kc.Client.GetGroups(ctx, token, realm, gocloak.GetGroupsParams{})
	if err != nil {
		return "", err
	}
	for _, g := range groups {
		if deref(g.Path) == path {
			return deref(g.ID), nil
		}
	}
	return "", fmt.Errorf("root group with path '%s' not found", path)
}

// ══════════════════════════════════════════════════════════════════════════
// READS – PostgreSQL
// ══════════════════════════════════════════════════════════════════════════

func (r *KeycloakRepository) GetGroupDetails(ctx context.Context, groupID string, _ string) (*domain.Group, error) {
	// 1. Fetch group row
	var g groupRow
	err := r.db.GetContext(ctx, &g, `
		SELECT g.id, g.name
		FROM keycloak_group g
		WHERE g.id = $1 AND g.realm_id = $2 AND g.parent_group = $3`,
		groupID, r.realmID, deref(r.rootGroupID))
	if err != nil {
		return nil, fmt.Errorf("get group: %w", err)
	}

	// 2. Fetch attributes
	var attrs []attributeRow
	if err := r.db.SelectContext(ctx, &attrs, `
		SELECT ga.name, ga.value
		FROM group_attribute ga
		WHERE ga.group_id = $1`, groupID); err != nil {
		return nil, fmt.Errorf("get group attributes: %w", err)
	}
	merged := mergeAttributes(attrs)

	// 3. Fetch members
	var members []memberRow
	if err := r.db.SelectContext(ctx, &members, `
		SELECT u.id, u.username, u.email,
			COALESCE(u.first_name, '') AS first_name,
			COALESCE(u.last_name, '') AS last_name
		FROM user_group_membership ugm
		JOIN user_entity u ON u.id = ugm.user_id
		WHERE ugm.group_id = $1`, groupID); err != nil {
		return nil, fmt.Errorf("get group members: %w", err)
	}

	// 4. Fetch invitees
	invites, err := r.getPendingUsersForGroup(ctx, groupID, "invite")
	if err != nil {
		return nil, err
	}

	// 5. Fetch requesters
	requests, err := r.getPendingUsersForGroup(ctx, groupID, "request")
	if err != nil {
		return nil, err
	}

	// 6. Fetch teams (child groups + their members)
	teams, err := r.getTeamsFromDB(ctx, groupID)
	if err != nil {
		return nil, err
	}

	// Build domain members with levels
	groupMembers := make([]domain.GroupMember, 0, len(members))
	for _, m := range members {
		level := domain.LevelMember
		if contains(merged.owners, m.ID) {
			level = domain.LevelOwner
		} else if contains(merged.admins, m.ID) {
			level = domain.LevelAdmin
		}
		groupMembers = append(groupMembers, domain.GroupMember{
			User: domain.User{
				ID: m.ID, Username: m.Username, Email: m.Email,
				FirstName: m.FirstName, LastName: m.LastName,
			},
			MembershipLevel: level,
		})
	}

	return &domain.Group{
		ID:          g.ID,
		Name:        g.Name,
		Description: merged.description,
		TOS:         merged.tos,
		Links:       merged.links,
		Settings: domain.GroupSettings{
			AutoAcceptRequests: &merged.autoAcceptRequests,
			SearchVisibility:   &merged.searchVisible,
		},
		Members:  nonNil(groupMembers),
		Invites:  nonNil(invites),
		Requests: nonNil(requests),
		Teams:    nonNil(teams),
	}, nil
}

func (r *KeycloakRepository) ListGroupsForUser(ctx context.Context, userID string) (*domain.ListGroups, error) {
	// Joined groups via user_group_membership
	var joined []groupRow
	if err := r.db.SelectContext(ctx, &joined, `
		SELECT g.id, g.name
		FROM keycloak_group g
		JOIN user_group_membership ugm ON g.id = ugm.group_id
		WHERE ugm.user_id = $1 AND g.realm_id = $2 AND g.parent_group = $3`,
		userID, r.realmID, deref(r.rootGroupID)); err != nil {
		return nil, fmt.Errorf("list joined groups: %w", err)
	}

	// Requested groups via group_attribute
	var requested []groupRow
	if err := r.db.SelectContext(ctx, &requested, `
		SELECT g.id, g.name
		FROM keycloak_group g
		JOIN group_attribute ga ON g.id = ga.group_id
		WHERE ga.name = 'request' AND ga.value = $1 AND g.realm_id = $2`,
		userID, r.realmID); err != nil {
		return nil, fmt.Errorf("list requested groups: %w", err)
	}

	result := &domain.ListGroups{
		Joined:    make([]domain.GroupSummary, 0, len(joined)),
		Requested: make([]domain.GroupSummary, 0, len(requested)),
	}
	for _, g := range joined {
		result.Joined = append(result.Joined, domain.GroupSummary{ID: g.ID, Name: g.Name})
	}
	for _, g := range requested {
		result.Requested = append(result.Requested, domain.GroupSummary{ID: g.ID, Name: g.Name})
	}
	return result, nil
}

func (r *KeycloakRepository) SearchGroups(ctx context.Context, input ports.SearchGroupsInput) (*domain.PaginatedResult[domain.SearchGroupResult], error) {
	likePattern := "%" + input.Search + "%"
	rootID := deref(r.rootGroupID)
	offset := input.Page * input.PageSize
	useTrgm := r.flags != nil && r.flags.IsEnabled("trgmSearch") && !input.Exact

	baseCTE := `
		WITH filtered AS (
			SELECT g.id, g.name
			FROM keycloak_group g
			WHERE g.realm_id = $1
				AND g.parent_group = $2
				AND (
					g.name ILIKE $3
					OR NOT EXISTS (
						SELECT 1
						FROM group_attribute ga
						WHERE ga.group_id = g.id
							AND ga.name = 'keycloak-comu.settings.searchVisible'
							AND ga.value = 'false'
					)
				)
				AND %s
		)
	`

	var searchCondition string
	var searchArgs []any
	orderBy := ""

	if useTrgm {
		searchCondition = "(g.name ILIKE $4 OR word_similarity($5, g.name) > 0.2)"
		searchArgs = []any{likePattern, input.Search}
		orderBy = "ORDER BY (name ILIKE $4)::int DESC, word_similarity($5, name) DESC"
	} else if input.Exact {
		searchCondition = "g.name ILIKE $4"
		searchArgs = []any{input.Search}
	} else {
		searchCondition = "g.name ILIKE $4"
		searchArgs = []any{likePattern}
	}

	cte := fmt.Sprintf(baseCTE, searchCondition)
	countQuery := cte + `SELECT count(*) FROM filtered`
	baseArgs := []any{r.realmID, rootID, input.Search}
	countArgs := append(baseArgs, searchArgs...)

	// Count total matches
	var total int
	if err := r.db.GetContext(ctx, &total, countQuery, countArgs...); err != nil {
		return nil, fmt.Errorf("count groups: %w", err)
	}

	// Fetch page
	limitPos := len(baseArgs) + len(searchArgs) + 1
	offsetPos := limitPos + 1
	selectQuery := cte + "SELECT id, name FROM filtered"
	if orderBy != "" {
		selectQuery += "\n" + orderBy
	}
	selectQuery += fmt.Sprintf("\nLIMIT $%d OFFSET $%d", limitPos, offsetPos)

	selectArgs := append(baseArgs, searchArgs...)
	selectArgs = append(selectArgs, input.PageSize, offset)

	var groups []groupRow
	if err := r.db.SelectContext(ctx, &groups, selectQuery, selectArgs...); err != nil {
		return nil, err
	}

	// Fetch owners for all returned groups
	groupIDs := make([]string, len(groups))
	for i, g := range groups {
		groupIDs[i] = g.ID
	}

	type ownerRow struct {
		GroupID string `db:"group_id"`
		UserID  string `db:"value"`
	}
	var owners []ownerRow
	if len(groupIDs) > 0 {
		query, args, err := sqlx.In(`
			SELECT ga.group_id, ga.value
			FROM group_attribute ga
			WHERE ga.name = 'owner' AND ga.group_id IN (?)`, groupIDs)
		if err == nil {
			query = r.db.Rebind(query)
			_ = r.db.SelectContext(ctx, &owners, query, args...)
		}
	}

	ownerMap := make(map[string][]string)
	for _, o := range owners {
		ownerMap[o.GroupID] = append(ownerMap[o.GroupID], o.UserID)
	}

	results := make([]domain.SearchGroupResult, 0, len(groups))
	for _, g := range groups {
		results = append(results, domain.SearchGroupResult{
			ID:     g.ID,
			Name:   g.Name,
			Owners: ownerMap[g.ID],
		})
	}

	return &domain.PaginatedResult[domain.SearchGroupResult]{
		Results:  results,
		Total:    total,
		Page:     input.Page,
		PageSize: input.PageSize,
		Next:     offset+input.PageSize < total,
	}, nil
}

func (r *KeycloakRepository) GetNotifications(ctx context.Context, userID string) (*domain.Notifications, error) {
	notifs := &domain.Notifications{
		Invites:  []domain.GroupSummary{},
		Requests: []domain.GlobalRequest{},
	}

	// Invites: groups where user is in 'invite' attribute
	var inviteGroups []groupRow
	if err := r.db.SelectContext(ctx, &inviteGroups, `
		SELECT g.id, g.name
		FROM group_attribute ga
		JOIN keycloak_group g ON ga.group_id = g.id
		WHERE ga.name = 'invite' AND ga.value = $1 AND g.realm_id = $2`,
		userID, r.realmID); err != nil {
		return notifs, nil
	}
	for _, g := range inviteGroups {
		notifs.Invites = append(notifs.Invites, domain.GroupSummary{ID: g.ID, Name: g.Name})
	}

	// Requests: pending join requests in groups where user is admin/owner
	var reqs []globalRequestRow
	if err := r.db.SelectContext(ctx, &reqs, `
		SELECT g.id AS "groupId", g.name AS "groupName",
			ue.email AS "userEmail", COALESCE(ue.first_name, '') AS "userFirstName",
			COALESCE(ue.last_name, '') AS "userLastName", ue.id AS "userId"
		FROM group_attribute ga
			JOIN keycloak_group g ON ga.group_id = g.id
			JOIN user_entity ue ON ga.value = ue.id
		WHERE ga.name = 'request'
			AND ga.group_id IN (
				SELECT ga2.group_id
				FROM group_attribute ga2
				JOIN keycloak_group g2 ON ga2.group_id = g2.id
				WHERE g2.realm_id = $1
					AND g2.parent_group = $2
					AND ga2.name IN ('admin', 'owner')
					AND ga2.value = $3
			)`,
		r.realmID, deref(r.rootGroupID), userID); err != nil {
		return notifs, nil
	}
	for _, req := range reqs {
		notifs.Requests = append(notifs.Requests, domain.GlobalRequest{
			GroupID:       req.GroupID,
			GroupName:     req.GroupName,
			UserID:        req.UserID,
			UserEmail:     req.UserEmail,
			UserFirstName: req.UserFirstName,
			UserLastName:  req.UserLastName,
		})
	}

	return notifs, nil
}

// ── DB read helpers ────────────────────────────────────────────────────────

func (r *KeycloakRepository) getPendingUsersForGroup(ctx context.Context, groupID string, attrName string) ([]domain.User, error) {
	var users []domain.User
	err := r.db.SelectContext(ctx, &users, `
		SELECT u.id, u.email, u.username,
			COALESCE(u.first_name, '') AS first_name,
			COALESCE(u.last_name, '') AS last_name
		FROM user_entity u
		JOIN group_attribute ga ON ga.value = u.id
		WHERE ga.group_id = $1 AND ga.name = $2`,
		groupID, attrName)
	return users, err
}

func (r *KeycloakRepository) getTeamsFromDB(ctx context.Context, parentGroupID string) ([]domain.Team, error) {
	type teamMemberRow struct {
		ID     string  `db:"id"`
		Name   string  `db:"name"`
		UserID *string `db:"user_id"`
	}

	var rows []teamMemberRow
	if err := r.db.SelectContext(ctx, &rows, `
		SELECT g.id, g.name, ugm.user_id
		FROM keycloak_group g
		LEFT JOIN user_group_membership ugm ON g.id = ugm.group_id
		WHERE g.parent_group = $1 AND g.realm_id = $2`,
		parentGroupID, r.realmID); err != nil {
		return nil, err
	}

	teamMap := make(map[string]*domain.Team)
	var order []string
	for _, row := range rows {
		t, ok := teamMap[row.Name]
		if !ok {
			t = &domain.Team{ID: row.ID, Name: row.Name, Members: []string{}}
			teamMap[row.Name] = t
			order = append(order, row.Name)
		}
		if row.UserID != nil && *row.UserID != "" && !contains(t.Members, *row.UserID) {
			t.Members = append(t.Members, *row.UserID)
		}
	}

	teams := make([]domain.Team, 0, len(order))
	for _, name := range order {
		teams = append(teams, *teamMap[name])
	}
	return teams, nil
}

// ══════════════════════════════════════════════════════════════════════════
// WRITES – Keycloak Admin API
// ══════════════════════════════════════════════════════════════════════════

func (r *KeycloakRepository) CreateGroup(ctx context.Context, input ports.CreateGroupInput) (*domain.Group, error) {
	attrs := map[string][]string{
		"owner":       {input.OwnerID},
		"description": {input.Description},
	}

	parentID := deref(r.rootGroupID)
	r.logger.Info("creating group", zap.String("name", input.Name), zap.String("owner", input.OwnerID), zap.String("parentID", parentID))

	var groupID string
	var err error
	if parentID == " " {
		groupID, err = r.kc.Client.CreateGroup(ctx, r.kc.GetToken(), r.realm, gocloak.Group{
			Name:       gocloak.StringP(input.Name),
			Attributes: &attrs,
		})
	} else {
		groupID, err = r.kc.Client.CreateChildGroup(ctx, r.kc.GetToken(), r.realm, parentID, gocloak.Group{
			Name:       gocloak.StringP(input.Name),
			Attributes: &attrs,
		})
	}
	if err != nil {
		return nil, fmt.Errorf("create group: %w", err)
	}

	// Add creator as member
	if err := r.kc.Client.AddUserToGroup(ctx, r.kc.GetToken(), r.realm, input.OwnerID, groupID); err != nil {
		return nil, fmt.Errorf("add owner to group: %w", err)
	}

	return r.GetGroupDetails(ctx, groupID, input.OwnerID)
}

func (r *KeycloakRepository) EditGroup(ctx context.Context, input ports.EditGroupInput) error {
	kcGroup, err := r.kc.Client.GetGroup(ctx, r.kc.GetToken(), r.realm, input.GroupID)
	if err != nil {
		return fmt.Errorf("get group: %w", err)
	}
	attrs := safeAttrs(kcGroup.Attributes)
	attrs["description"] = []string{input.Description}
	kcGroup.Attributes = &attrs
	return r.kc.Client.UpdateGroup(ctx, r.kc.GetToken(), r.realm, *kcGroup)
}

func (r *KeycloakRepository) DeleteGroup(ctx context.Context, groupID string) error {
	return r.kc.Client.DeleteGroup(ctx, r.kc.GetToken(), r.realm, groupID)
}

// ── Membership (writes via KC) ─────────────────────────────────────────────

func (r *KeycloakRepository) AddMemberToGroup(ctx context.Context, groupID string, userID string) error {
	return r.kc.Client.AddUserToGroup(ctx, r.kc.GetToken(), r.realm, userID, groupID)
}

func (r *KeycloakRepository) KickMemberFromGroup(ctx context.Context, groupID string, userID string) error {
	// Remove from child teams first (read teams from DB, delete via KC)
	type teamRow struct {
		ID string `db:"id"`
	}
	var involvedTeams []teamRow
	_ = r.db.SelectContext(ctx, &involvedTeams, `
		SELECT g.id
		FROM keycloak_group g
		JOIN user_group_membership ugm ON g.id = ugm.group_id
		WHERE ugm.user_id = $1 AND g.parent_group = $2`, userID, groupID)

	for _, t := range involvedTeams {
		_ = r.kc.Client.DeleteUserFromGroup(ctx, r.kc.GetToken(), r.realm, userID, t.ID)
	}

	// Remove from role attributes
	if err := r.setUserLevelViaKC(ctx, groupID, userID, domain.LevelGuest); err != nil {
		return err
	}

	return r.kc.Client.DeleteUserFromGroup(ctx, r.kc.GetToken(), r.realm, userID, groupID)
}

func (r *KeycloakRepository) SetUserLevelInGroup(ctx context.Context, groupID string, userID string, level int) error {
	return r.setUserLevelViaKC(ctx, groupID, userID, level)
}

func (r *KeycloakRepository) setUserLevelViaKC(ctx context.Context, groupID string, userID string, level int) error {
	kcGroup, err := r.kc.Client.GetGroup(ctx, r.kc.GetToken(), r.realm, groupID)
	if err != nil {
		return err
	}
	attrs := safeAttrs(kcGroup.Attributes)

	// Remove from all role lists
	attrs["owner"] = removeString(attrs["owner"], userID)
	attrs["admin"] = removeString(attrs["admin"], userID)

	// Add to the appropriate role list
	switch level {
	case domain.LevelOwner:
		attrs["owner"] = appendUnique(attrs["owner"], userID)
	case domain.LevelAdmin:
		attrs["admin"] = appendUnique(attrs["admin"], userID)
	case domain.LevelMember, domain.LevelGuest:
		// no attribute needed
	}

	kcGroup.Attributes = &attrs
	return r.kc.Client.UpdateGroup(ctx, r.kc.GetToken(), r.realm, *kcGroup)
}

// ── Invites (writes via KC) ────────────────────────────────────────────────

func (r *KeycloakRepository) InviteMemberToGroup(ctx context.Context, groupID string, userID string) error {
	return r.addToGroupAttribute(ctx, groupID, "invite", userID)
}

func (r *KeycloakRepository) UninviteMemberFromGroup(ctx context.Context, groupID string, userID string) error {
	return r.removeFromGroupAttribute(ctx, groupID, "invite", userID)
}

func (r *KeycloakRepository) GetPredefinedInviteByCode(ctx context.Context, code string) (*domain.PredefinedInvite, error) {
	prefix := "invite." + code + "."
	pattern := prefix + "%"

	type predefinedInviteAttrRow struct {
		GroupID   string `db:"group_id"`
		GroupName string `db:"group_name"`
		Name      string `db:"name"`
		Value     string `db:"value"`
	}

	var rows []predefinedInviteAttrRow
	err := r.db.SelectContext(ctx, &rows, `
		SELECT g.id AS group_id, g.name AS group_name, ga.name, ga.value
		FROM keycloak_group g
		JOIN group_attribute ga ON ga.group_id = g.id
		WHERE g.realm_id = $1
			AND g.parent_group = $2
			AND ga.name LIKE $3`,
		r.realmID, deref(r.rootGroupID), pattern)
	if err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return nil, nil
	}

	invite := &domain.PredefinedInvite{
		Code:      code,
		GroupID:   rows[0].GroupID,
		GroupName: rows[0].GroupName,
		Role:      "member",
		Teams:     []string{},
	}

	for _, row := range rows {
		if row.GroupID != invite.GroupID {
			return nil, fmt.Errorf("predefined invitation code %s is duplicated across groups", code)
		}
		suffix := strings.TrimPrefix(row.Name, prefix)
		switch suffix {
		case "redirectUrl":
			invite.RedirectURL = row.Value
		case "role":
			invite.Role = strings.ToLower(strings.TrimSpace(row.Value))
		case "teams":
			invite.Teams = parseInviteTeams(row.Value)
		}
	}

	return invite, nil
}

func (r *KeycloakRepository) ConsumePredefinedInvite(ctx context.Context, invite *domain.PredefinedInvite, userID string) error {
	if err := r.kc.Client.AddUserToGroup(ctx, r.kc.GetToken(), r.realm, userID, invite.GroupID); err != nil {
		return fmt.Errorf("add user to group from predefined invitation: %w", err)
	}
	if err := r.setUserLevelViaKC(ctx, invite.GroupID, userID, parseInviteRole(invite.Role)); err != nil {
		return fmt.Errorf("set membership level from predefined invitation: %w", err)
	}
	for _, teamName := range invite.Teams {
		if err := r.AddUserToTeamByName(ctx, invite.GroupID, teamName, userID); err != nil {
			return err
		}
	}
	return nil
}

func (r *KeycloakRepository) AddUserToTeamByName(ctx context.Context, groupID string, teamName string, userID string) error {
	if teamName == "" {
		return nil
	}
	var teamID string
	err := r.db.GetContext(ctx, &teamID, `
		SELECT g.id
		FROM keycloak_group g
		WHERE g.parent_group = $1
			AND g.realm_id = $2
			AND g.name = $3`,
		groupID, r.realmID, teamName)
	if err != nil {
		return fmt.Errorf("team %s not found: %w", teamName, err)
	}
	if err := r.kc.Client.AddUserToGroup(ctx, r.kc.GetToken(), r.realm, userID, teamID); err != nil {
		return fmt.Errorf("add user to team %s: %w", teamName, err)
	}
	return nil
}

// ── Requests (writes via KC) ───────────────────────────────────────────────

func (r *KeycloakRepository) ListPredefinedInvites(ctx context.Context, groupID string) ([]domain.PredefinedInvite, error) {
	var groupName string
	if err := r.db.GetContext(ctx, &groupName, `SELECT name FROM keycloak_group WHERE id = $1 AND realm_id = $2`, groupID, r.realmID); err != nil {
		return nil, fmt.Errorf("get group name: %w", err)
	}

	var rows []attributeRow
	if err := r.db.SelectContext(ctx, &rows, `
		SELECT ga.name, ga.value
		FROM group_attribute ga
		WHERE ga.group_id = $1 AND ga.name LIKE 'invite.%.%'`, groupID); err != nil {
		return nil, fmt.Errorf("list predefined invites: %w", err)
	}

	byCode := map[string]*domain.PredefinedInvite{}
	var order []string
	for _, row := range rows {
		parts := strings.SplitN(strings.TrimPrefix(row.Name, "invite."), ".", 2)
		if len(parts) != 2 {
			continue
		}
		code, key := parts[0], parts[1]
		if _, ok := byCode[code]; !ok {
			byCode[code] = &domain.PredefinedInvite{Code: code, GroupID: groupID, GroupName: groupName, Role: "member", Teams: []string{}}
			order = append(order, code)
		}
		inv := byCode[code]
		switch key {
		case "role":
			inv.Role = strings.ToLower(strings.TrimSpace(row.Value))
		case "redirectUrl":
			inv.RedirectURL = row.Value
		case "teams":
			inv.Teams = parseInviteTeams(row.Value)
		}
	}

	result := make([]domain.PredefinedInvite, 0, len(order))
	for _, code := range order {
		result = append(result, *byCode[code])
	}
	return result, nil
}

func (r *KeycloakRepository) CreatePredefinedInvite(ctx context.Context, input ports.PredefinedInviteLinkInput) (*domain.PredefinedInvite, error) {
	kcGroup, err := r.kc.Client.GetGroup(ctx, r.kc.GetToken(), r.realm, input.GroupID)
	if err != nil {
		return nil, err
	}
	attrs := safeAttrs(kcGroup.Attributes)
	setPredefinedInviteAttrs(attrs, input)
	kcGroup.Attributes = &attrs
	if err := r.kc.Client.UpdateGroup(ctx, r.kc.GetToken(), r.realm, *kcGroup); err != nil {
		return nil, err
	}
	return r.GetPredefinedInviteByCode(ctx, input.Code)
}

func (r *KeycloakRepository) DeletePredefinedInvite(ctx context.Context, groupID, code string) error {
	kcGroup, err := r.kc.Client.GetGroup(ctx, r.kc.GetToken(), r.realm, groupID)
	if err != nil {
		return err
	}
	attrs := safeAttrs(kcGroup.Attributes)
	prefix := "invite." + code + "."
	for k := range attrs {
		if strings.HasPrefix(k, prefix) {
			delete(attrs, k)
		}
	}
	kcGroup.Attributes = &attrs
	return r.kc.Client.UpdateGroup(ctx, r.kc.GetToken(), r.realm, *kcGroup)
}

func setPredefinedInviteAttrs(attrs map[string][]string, input ports.PredefinedInviteLinkInput) {
	prefix := "invite." + input.Code + "."
	role := input.Role
	if role == "" {
		role = "member"
	}
	attrs[prefix+"role"] = []string{role}
	if v := strings.TrimSpace(input.RedirectURL); v != "" {
		attrs[prefix+"redirectUrl"] = []string{v}
	}
	if len(input.Teams) > 0 {
		attrs[prefix+"teams"] = []string{strings.Join(input.Teams, ",")}
	}
}

func (r *KeycloakRepository) RequestJoinToGroup(ctx context.Context, groupID string, userID string) error {
	return r.addToGroupAttribute(ctx, groupID, "request", userID)
}

func (r *KeycloakRepository) CancelRequestJoinToGroup(ctx context.Context, groupID string, userID string) error {
	return r.removeFromGroupAttribute(ctx, groupID, "request", userID)
}

// ── Teams (writes via KC) ──────────────────────────────────────────────────

func (r *KeycloakRepository) EditTeam(ctx context.Context, input ports.EditTeamInput) error {
	// Find existing child group by name (read from DB)
	var teamID string
	err := r.db.GetContext(ctx, &teamID, `
		SELECT id FROM keycloak_group
		WHERE parent_group = $1 AND name = $2 AND realm_id = $3`,
		input.ParentID, input.Name, r.realmID)

	if err != nil {
		// Create new child group via KC
		teamID, err = r.kc.Client.CreateChildGroup(ctx, r.kc.GetToken(), r.realm, input.ParentID, gocloak.Group{
			Name: gocloak.StringP(input.Name),
		})
		if err != nil {
			return fmt.Errorf("create team: %w", err)
		}
	}

	// Sync members: read current from DB, add/remove via KC
	type memberID struct {
		UserID string `db:"user_id"`
	}
	var currentMembers []memberID
	_ = r.db.SelectContext(ctx, &currentMembers, `
		SELECT user_id FROM user_group_membership WHERE group_id = $1`, teamID)

	currentIDs := make(map[string]bool)
	for _, m := range currentMembers {
		currentIDs[m.UserID] = true
	}
	desiredIDs := make(map[string]bool)
	for _, id := range input.UserIDs {
		desiredIDs[id] = true
	}

	for _, id := range input.UserIDs {
		if !currentIDs[id] {
			err = r.kc.Client.AddUserToGroup(ctx, r.kc.GetToken(), r.realm, id, teamID)
			if err != nil {
				return fmt.Errorf("add user to team: %w", err)
			}
		}
	}
	for _, m := range currentMembers {
		if !desiredIDs[m.UserID] {
			err = r.kc.Client.DeleteUserFromGroup(ctx, r.kc.GetToken(), r.realm, m.UserID, teamID)
			if err != nil {
				return fmt.Errorf("remove user from team: %w", err)
			}
		}
	}

	return nil
}

func (r *KeycloakRepository) DeleteTeam(ctx context.Context, input ports.DeleteTeamInput) error {
	var g groupRow

	err := r.db.GetContext(ctx, &g, `
		SELECT g.id, g.name
		FROM keycloak_group g
		WHERE g.name = $1 AND g.realm_id = $2 AND g.parent_group = $3`,
		input.Name, r.realmID, input.ParentID)
	if err != nil {
		return fmt.Errorf("team not found")
	}

	if g.ID == "" {
		return fmt.Errorf("team not found")
	}
	return r.kc.Client.DeleteGroup(ctx, r.kc.GetToken(), r.realm, g.ID)
}

// ── Settings & Attributes (writes via KC) ──────────────────────────────────

func (r *KeycloakRepository) SetGroupSettings(ctx context.Context, input ports.UpdateSettingsInput) error {
	kcGroup, err := r.kc.Client.GetGroup(ctx, r.kc.GetToken(), r.realm, input.GroupID)
	if err != nil {
		return err
	}
	attrs := safeAttrs(kcGroup.Attributes)
	if input.Settings.AutoAcceptRequests != nil {
		attrs[settingsPrefix+"autoAcceptRequests"] = []string{boolToStr(*input.Settings.AutoAcceptRequests)}
	}
	if input.Settings.SearchVisibility != nil {
		attrs[settingsPrefix+"searchVisible"] = []string{boolToStr(*input.Settings.SearchVisibility)}
	}
	kcGroup.Attributes = &attrs
	return r.kc.Client.UpdateGroup(ctx, r.kc.GetToken(), r.realm, *kcGroup)
}

func (r *KeycloakRepository) SetLinks(ctx context.Context, input ports.UpdateLinksInput) error {
	kcGroup, err := r.kc.Client.GetGroup(ctx, r.kc.GetToken(), r.realm, input.GroupID)
	if err != nil {
		return err
	}
	attrs := safeAttrs(kcGroup.Attributes)
	attrs["link"] = input.Links
	kcGroup.Attributes = &attrs
	return r.kc.Client.UpdateGroup(ctx, r.kc.GetToken(), r.realm, *kcGroup)
}

func (r *KeycloakRepository) SetTOS(ctx context.Context, input ports.UpdateTOSInput) error {
	kcGroup, err := r.kc.Client.GetGroup(ctx, r.kc.GetToken(), r.realm, input.GroupID)
	if err != nil {
		return err
	}
	attrs := safeAttrs(kcGroup.Attributes)
	attrs["tos"] = []string{input.TOS}
	kcGroup.Attributes = &attrs
	return r.kc.Client.UpdateGroup(ctx, r.kc.GetToken(), r.realm, *kcGroup)
}

// ── KC attribute helpers (write) ───────────────────────────────────────────

func (r *KeycloakRepository) addToGroupAttribute(ctx context.Context, groupID string, attrName string, value string) error {
	kcGroup, err := r.kc.Client.GetGroup(ctx, r.kc.GetToken(), r.realm, groupID)
	if err != nil {
		return err
	}
	attrs := safeAttrs(kcGroup.Attributes)
	attrs[attrName] = appendUnique(attrs[attrName], value)
	kcGroup.Attributes = &attrs
	return r.kc.Client.UpdateGroup(ctx, r.kc.GetToken(), r.realm, *kcGroup)
}

func (r *KeycloakRepository) removeFromGroupAttribute(ctx context.Context, groupID string, attrName string, value string) error {
	kcGroup, err := r.kc.Client.GetGroup(ctx, r.kc.GetToken(), r.realm, groupID)
	if err != nil {
		return err
	}
	attrs := safeAttrs(kcGroup.Attributes)
	attrs[attrName] = removeString(attrs[attrName], value)
	kcGroup.Attributes = &attrs
	return r.kc.Client.UpdateGroup(ctx, r.kc.GetToken(), r.realm, *kcGroup)
}

// ══════════════════════════════════════════════════════════════════════════
// Attribute merge helper (DB rows → structured data)
// ══════════════════════════════════════════════════════════════════════════

type mergedAttrs struct {
	owners             []string
	admins             []string
	links              []string
	description        string
	tos                string
	autoAcceptRequests bool
	searchVisible      bool
}

func mergeAttributes(rows []attributeRow) mergedAttrs {
	m := mergedAttrs{}
	for _, r := range rows {
		if r.Value == "" {
			continue
		}
		switch r.Name {
		case "owner":
			m.owners = append(m.owners, r.Value)
		case "admin":
			m.admins = append(m.admins, r.Value)
		case "link":
			m.links = append(m.links, r.Value)
		case "description":
			m.description = r.Value
		case "tos":
			m.tos = r.Value
		case settingsPrefix + "autoAcceptRequests":
			m.autoAcceptRequests = r.Value == "true"
		case settingsPrefix + "searchVisible":
			m.searchVisible = r.Value == "true"
		}
	}
	if m.links == nil {
		m.links = []string{}
	}
	return m
}

// ══════════════════════════════════════════════════════════════════════════
// Utility functions
// ══════════════════════════════════════════════════════════════════════════

func deref(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func safeAttrs(attrs *map[string][]string) map[string][]string {
	if attrs == nil {
		return make(map[string][]string)
	}
	return *attrs
}

func contains(slice []string, s string) bool {
	for _, v := range slice {
		if v == s {
			return true
		}
	}
	return false
}

func removeString(slice []string, s string) []string {
	result := make([]string, 0, len(slice))
	for _, v := range slice {
		if v != s {
			result = append(result, v)
		}
	}
	return result
}

func appendUnique(slice []string, s string) []string {
	for _, v := range slice {
		if v == s {
			return slice
		}
	}
	return append(slice, s)
}

func boolToStr(b bool) string {
	if b {
		return "true"
	}
	return "false"
}

func parseInviteRole(role string) int {
	switch strings.ToLower(strings.TrimSpace(role)) {
	case "owner":
		return domain.LevelOwner
	case "admin":
		return domain.LevelAdmin
	default:
		return domain.LevelMember
	}
}

func parseInviteTeams(csv string) []string {
	parts := strings.Split(csv, ",")
	teams := make([]string, 0, len(parts))
	for _, p := range parts {
		team := strings.TrimSpace(p)
		if team != "" {
			teams = append(teams, team)
		}
	}
	return teams
}

func nonNil[T any](s []T) []T {
	if s == nil {
		return []T{}
	}
	return s
}
