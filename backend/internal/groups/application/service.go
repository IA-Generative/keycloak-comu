package application

import (
	"context"
	"errors"

	"github.com/IA-Generative/keycloak-comu-new/backend/internal/groups/domain"
	"github.com/IA-Generative/keycloak-comu-new/backend/internal/groups/ports"
	"go.uber.org/zap"
)

var (
	ErrInsufficientPermissions      = errors.New("insufficient permissions")
	ErrCannotLeaveOnlyOwner         = errors.New("cannot leave group as the only owner")
	ErrCannotKickSelf               = errors.New("cannot kick yourself")
	ErrCannotKickSameLevel          = errors.New("cannot kick user with same or higher level")
	ErrCannotDemoteOnlyOwner        = errors.New("cannot demote the only owner")
	ErrCannotGrantEqualLevel        = errors.New("cannot grant level equal to yours")
	ErrCannotGrantHigherLevel       = errors.New("cannot grant level higher than yours")
	ErrCannotDemoteHigherEqualLevel = errors.New("cannot demote user with higher or equal level")
	ErrUserAlreadyMember            = errors.New("user is already a member")
	ErrUserAlreadyRequesting        = errors.New("user is already requesting to join")
	ErrUserNotInvited               = errors.New("user not invited")
	ErrUserNotRequesting            = errors.New("user is not requesting to join")
	ErrGroupNotFound                = errors.New("group not found")
	ErrUserNotFound                 = errors.New("user not found")
	ErrGroupAlreadyExists           = errors.New("group with this name already exists")
	ErrInvalidLevel                 = errors.New("invalid membership level")
)

type Service struct {
	repo     ports.Repository
	mailer   ports.Mailer
	metrics  ports.MetricsRecorder
	notifier *NotificationBroker
	log      *zap.Logger
}

func NewService(
	groups ports.Repository,
	mailer ports.Mailer,
	metrics ports.MetricsRecorder,
	notifier *NotificationBroker,
	log *zap.Logger,
) *Service {
	return &Service{
		repo:     groups,
		mailer:   mailer,
		metrics:  metrics,
		notifier: notifier,
		log:      log,
	}
}

// Guard checks that the requestor has the required membership level in the group.
func (s *Service) guard(group *domain.Group, requestorID string, requiredLevel int) (int, error) {
	level := findMembershipLevel(group, requestorID)
	if level < requiredLevel {
		return level, ErrInsufficientPermissions
	}
	return level, nil
}

func findMembershipLevel(group *domain.Group, userID string) int {
	for _, m := range group.Members {
		if m.ID == userID {
			return m.MembershipLevel
		}
	}
	// Check if user is invited → GUEST
	for _, inv := range group.Invites {
		if inv.ID == userID {
			return domain.LevelGuest
		}
	}
	// Check if user has a pending request → GUEST
	for _, req := range group.Requests {
		if req.ID == userID {
			return domain.LevelGuest
		}
	}
	return domain.LevelGuest
}

func countOwners(group *domain.Group) int {
	count := 0
	for _, m := range group.Members {
		if m.MembershipLevel == domain.LevelOwner {
			count++
		}
	}
	return count
}

func adminNotificationRecipients(group *domain.Group) []string {
	userIDs := make([]string, 0, len(group.Members))
	for _, member := range group.Members {
		if member.MembershipLevel >= domain.LevelAdmin {
			userIDs = append(userIDs, member.ID)
		}
	}
	return userIDs
}

func inviteNotificationRecipients(group *domain.Group) []string {
	userIDs := make([]string, 0, len(group.Invites))
	for _, invite := range group.Invites {
		userIDs = append(userIDs, invite.ID)
	}
	return userIDs
}

func (s *Service) publishNotifications(userIDs ...string) {
	if s.notifier == nil {
		return
	}
	s.notifier.Publish(userIDs...)
}

func (s *Service) SubscribeToNotifications(userID string) (<-chan struct{}, func()) {
	if s.notifier == nil {
		closed := make(chan struct{})
		close(closed)
		return closed, func() {}
	}
	return s.notifier.Subscribe(userID)
}

// CreateGroup creates a new group with the caller as owner.
func (s *Service) CreateGroup(ctx context.Context, input ports.CreateGroupInput) (*domain.Group, error) {
	group, err := s.repo.CreateGroup(ctx, input)
	s.metrics.ObserveGroupOperation("create", err == nil)
	if err != nil {
		return nil, err
	}
	return group, nil
}

// GetGroupDetails returns group details for display.
func (s *Service) GetGroupDetails(ctx context.Context, groupID string, requestorID string) (*domain.Group, error) {
	group, err := s.repo.GetGroupDetails(ctx, groupID, requestorID)
	s.metrics.ObserveGroupOperation("get", err == nil)
	return group, err
}

// ListGroups returns groups the user is a member of or has requested.
func (s *Service) ListGroups(ctx context.Context, userID string) (*domain.ListGroups, error) {
	return s.repo.ListGroupsForUser(ctx, userID)
}

// SearchGroups performs paginated search.
func (s *Service) SearchGroups(ctx context.Context, input ports.SearchGroupsInput) (*domain.PaginatedResult[domain.SearchGroupResult], error) {
	return s.repo.SearchGroups(ctx, input)
}

// EditGroup updates group description (ADMIN+).
func (s *Service) EditGroup(ctx context.Context, input ports.EditGroupInput, requestorID string) error {
	group, err := s.repo.GetGroupDetails(ctx, input.GroupID, requestorID)
	if err != nil {
		return err
	}
	if _, err := s.guard(group, requestorID, domain.LevelAdmin); err != nil {
		return err
	}
	return s.repo.EditGroup(ctx, input)
}

// DeleteGroup removes a group (OWNER only).
func (s *Service) DeleteGroup(ctx context.Context, groupID string, requestorID string) error {
	group, err := s.repo.GetGroupDetails(ctx, groupID, requestorID)
	if err != nil {
		return err
	}
	if _, err := s.guard(group, requestorID, domain.LevelOwner); err != nil {
		return err
	}
	usersToNotify := append(adminNotificationRecipients(group), inviteNotificationRecipients(group)...)
	err = s.repo.DeleteGroup(ctx, groupID)
	if err == nil {
		s.publishNotifications(usersToNotify...)
	}
	return err
}

// InviteUser sends an invitation to a user (ADMIN+).
func (s *Service) InviteUser(ctx context.Context, groupID string, email string, requestorID string, requestorName string) error {
	group, err := s.repo.GetGroupDetails(ctx, groupID, requestorID)
	if err != nil {
		return err
	}
	if _, err := s.guard(group, requestorID, domain.LevelAdmin); err != nil {
		return err
	}

	user, err := s.repo.GetUserByEmail(ctx, email)
	if err != nil {
		return ErrUserNotFound
	}

	// Check if user is already a member
	for _, m := range group.Members {
		if m.ID == user.ID {
			return ErrUserAlreadyMember
		}
	}

	// Check if user has autoAcceptInvites
	settings, _ := s.repo.GetUserSettings(ctx, user.ID)
	if settings != nil && settings.AutoAcceptInvites != nil && *settings.AutoAcceptInvites {
		if err := s.repo.AddMemberToGroup(ctx, groupID, user.ID); err != nil {
			return err
		}
		_ = s.mailer.SendAutoJoinNotification(ctx, user.Email, user.FirstName, group.ID, group.Name)
		return nil
	}

	if err := s.repo.InviteMemberToGroup(ctx, groupID, user.ID); err != nil {
		return err
	}
	s.publishNotifications(user.ID)
	_ = s.mailer.SendGroupInvite(ctx, user.Email, user.FirstName+" "+user.LastName, group.ID, group.Name)
	return nil
}

// AcceptInvite accepts a pending invitation.
func (s *Service) AcceptInvite(ctx context.Context, groupID string, userID string) error {
	group, err := s.repo.GetGroupDetails(ctx, groupID, userID)
	if err != nil {
		return err
	}
	invited := false
	for _, inv := range group.Invites {
		if inv.ID == userID {
			invited = true
			break
		}
	}
	if !invited {
		return ErrUserNotInvited
	}
	if err := s.repo.UninviteMemberFromGroup(ctx, groupID, userID); err != nil {
		return err
	}
	if err := s.repo.AddMemberToGroup(ctx, groupID, userID); err != nil {
		return err
	}
	s.publishNotifications(userID)
	return nil
}

// DeclineInvite declines a pending invitation.
func (s *Service) DeclineInvite(ctx context.Context, groupID string, userID string) error {
	if err := s.repo.UninviteMemberFromGroup(ctx, groupID, userID); err != nil {
		return err
	}
	s.publishNotifications(userID)
	return nil
}

// CancelInvite cancels a sent invitation (ADMIN+).
func (s *Service) CancelInvite(ctx context.Context, groupID string, targetUserID string, requestorID string) error {
	group, err := s.repo.GetGroupDetails(ctx, groupID, requestorID)
	if err != nil {
		return err
	}
	if _, err := s.guard(group, requestorID, domain.LevelAdmin); err != nil {
		return err
	}
	if err := s.repo.UninviteMemberFromGroup(ctx, groupID, targetUserID); err != nil {
		return err
	}
	s.publishNotifications(targetUserID)
	return nil
}

// RequestJoin creates a join request for a group.
func (s *Service) RequestJoin(ctx context.Context, groupID string, userID string, userEmail string) error {
	group, err := s.repo.GetGroupDetails(ctx, groupID, userID)
	if err != nil {
		return err
	}
	// Check if already member
	for _, m := range group.Members {
		if m.ID == userID {
			return ErrUserAlreadyMember
		}
	}
	// Check if already requesting
	for _, r := range group.Requests {
		if r.ID == userID {
			return ErrUserAlreadyRequesting
		}
	}

	// Check autoAcceptRequests
	if group.Settings.AutoAcceptRequests {
		if err := s.repo.AddMemberToGroup(ctx, groupID, userID); err != nil {
			return err
		}
		return nil
	}

	if err := s.repo.RequestJoinToGroup(ctx, groupID, userID); err != nil {
		return err
	}
	s.publishNotifications(adminNotificationRecipients(group)...)

	// Notify admins/owners
	requester, _ := s.repo.GetUserByID(ctx, userID)
	requesterName := userEmail
	if requester != nil {
		requesterName = requester.FirstName + " " + requester.LastName
	}
	for _, m := range group.Members {
		if m.MembershipLevel >= domain.LevelAdmin {
			_ = s.mailer.SendJoinRequest(ctx, m.Email, group.ID, group.Name, requesterName)
		}
	}
	return nil
}

// AcceptRequest accepts a pending join request (ADMIN+).
func (s *Service) AcceptRequest(ctx context.Context, groupID string, targetUserID string, requestorID string) error {
	group, err := s.repo.GetGroupDetails(ctx, groupID, requestorID)
	if err != nil {
		return err
	}
	if _, err := s.guard(group, requestorID, domain.LevelAdmin); err != nil {
		return err
	}

	requesting := false
	var requester *domain.User
	for _, r := range group.Requests {
		if r.ID == targetUserID {
			requesting = true
			requester = &r
			break
		}
	}
	if !requesting {
		return ErrUserNotRequesting
	}

	if err := s.repo.CancelRequestJoinToGroup(ctx, groupID, targetUserID); err != nil {
		return err
	}
	if err := s.repo.AddMemberToGroup(ctx, groupID, targetUserID); err != nil {
		return err
	}
	s.publishNotifications(adminNotificationRecipients(group)...)
	_ = s.mailer.SendJoinValidation(ctx, requester.Email, group.ID, group.Name)
	return nil
}

// DeclineRequest declines a join request (ADMIN+).
func (s *Service) DeclineRequest(ctx context.Context, groupID string, targetUserID string, requestorID string) error {
	group, err := s.repo.GetGroupDetails(ctx, groupID, requestorID)
	if err != nil {
		return err
	}
	if _, err := s.guard(group, requestorID, domain.LevelAdmin); err != nil {
		return err
	}
	if err := s.repo.CancelRequestJoinToGroup(ctx, groupID, targetUserID); err != nil {
		return err
	}
	s.publishNotifications(adminNotificationRecipients(group)...)
	return nil
}

// CancelRequest allows a user to cancel their own request.
func (s *Service) CancelRequest(ctx context.Context, groupID string, userID string) error {
	group, err := s.repo.GetGroupDetails(ctx, groupID, userID)
	if err != nil {
		return err
	}
	if err := s.repo.CancelRequestJoinToGroup(ctx, groupID, userID); err != nil {
		return err
	}
	s.publishNotifications(adminNotificationRecipients(group)...)
	return nil
}

// EditMembership changes a member's access level.
func (s *Service) EditMembership(ctx context.Context, input ports.EditMembershipInput, requestorID string) error {
	if input.Level != domain.LevelMember && input.Level != domain.LevelAdmin && input.Level != domain.LevelOwner {
		return ErrInvalidLevel
	}

	group, err := s.repo.GetGroupDetails(ctx, input.GroupID, requestorID)
	if err != nil {
		return err
	}
	requestorLevel, err := s.guard(group, requestorID, domain.LevelAdmin)
	if err != nil {
		return err
	}

	// Find target member
	var targetMember *domain.GroupMember
	for i := range group.Members {
		if group.Members[i].ID == input.UserID {
			targetMember = &group.Members[i]
			break
		}
	}
	if targetMember == nil {
		return ErrUserNotFound
	}

	// Can't demote the only owner
	if requestorLevel == domain.LevelOwner {
		if targetMember.ID == requestorID && input.Level < domain.LevelOwner && countOwners(group) <= 1 {
			return ErrCannotDemoteOnlyOwner
		}
	} else {
		// Self demotion/granting rules
		if targetMember.ID == requestorID {
			if input.Level > requestorLevel {
				return ErrCannotGrantHigherLevel
			}
		} else {
			if input.Level >= requestorLevel {
				return ErrCannotGrantEqualLevel
			}
			// Can't change level of users with higher or equal level
			if targetMember.MembershipLevel >= requestorLevel {
				return ErrCannotDemoteHigherEqualLevel
			}
		}
	}

	if err := s.repo.SetUserLevelInGroup(ctx, input.GroupID, input.UserID, input.Level); err != nil {
		return err
	}
	s.publishNotifications(requestorID, input.UserID)
	return nil
}

// KickMember removes a member from a group (ADMIN+).
func (s *Service) KickMember(ctx context.Context, groupID string, targetUserID string, requestorID string) error {
	if targetUserID == requestorID {
		return ErrCannotKickSelf
	}

	group, err := s.repo.GetGroupDetails(ctx, groupID, requestorID)
	if err != nil {
		return err
	}
	requestorLevel, err := s.guard(group, requestorID, domain.LevelAdmin)
	if err != nil {
		return err
	}

	// Find target level
	targetLevel := domain.LevelGuest
	for _, m := range group.Members {
		if m.ID == targetUserID {
			targetLevel = m.MembershipLevel
			break
		}
	}

	if targetLevel >= requestorLevel {
		return ErrCannotKickSameLevel
	}

	if err := s.repo.KickMemberFromGroup(ctx, groupID, targetUserID); err != nil {
		return err
	}
	s.publishNotifications(requestorID, targetUserID)
	return nil
}

// LeaveGroup removes the caller from a group.
func (s *Service) LeaveGroup(ctx context.Context, groupID string, userID string) error {
	group, err := s.repo.GetGroupDetails(ctx, groupID, userID)
	if err != nil {
		return err
	}

	// Check if only owner
	myLevel := findMembershipLevel(group, userID)
	if myLevel == domain.LevelOwner && countOwners(group) <= 1 {
		// If last member, delete the group
		if len(group.Members) <= 1 {
			if err := s.repo.DeleteGroup(ctx, groupID); err != nil {
				return err
			}
			s.publishNotifications(userID)
			return nil
		}
		return ErrCannotLeaveOnlyOwner
	}

	if err := s.repo.KickMemberFromGroup(ctx, groupID, userID); err != nil {
		return err
	}
	s.publishNotifications(userID)
	return nil
}

// EditTeam creates or updates a sub-team (ADMIN+).
func (s *Service) EditTeam(ctx context.Context, input ports.EditTeamInput, requestorID string) error {
	group, err := s.repo.GetGroupDetails(ctx, input.ParentID, requestorID)
	if err != nil {
		return err
	}
	if _, err := s.guard(group, requestorID, domain.LevelAdmin); err != nil {
		return err
	}
	return s.repo.EditTeam(ctx, input)
}

// DeleteTeam removes a sub-team (ADMIN+).
func (s *Service) DeleteTeam(ctx context.Context, input ports.DeleteTeamInput, requestorID string) error {
	group, err := s.repo.GetGroupDetails(ctx, input.ParentID, requestorID)
	if err != nil {
		return err
	}
	if _, err := s.guard(group, requestorID, domain.LevelAdmin); err != nil {
		return err
	}
	return s.repo.DeleteTeam(ctx, input)
}

// UpdateSettings updates group settings (ADMIN+).
func (s *Service) UpdateSettings(ctx context.Context, input ports.UpdateSettingsInput, requestorID string) error {
	group, err := s.repo.GetGroupDetails(ctx, input.GroupID, requestorID)
	if err != nil {
		return err
	}
	if _, err := s.guard(group, requestorID, domain.LevelAdmin); err != nil {
		return err
	}
	return s.repo.SetGroupSettings(ctx, input)
}

// UpdateLinks updates group resource links (ADMIN+).
func (s *Service) UpdateLinks(ctx context.Context, input ports.UpdateLinksInput, requestorID string) error {
	group, err := s.repo.GetGroupDetails(ctx, input.GroupID, requestorID)
	if err != nil {
		return err
	}
	if _, err := s.guard(group, requestorID, domain.LevelAdmin); err != nil {
		return err
	}
	return s.repo.SetLinks(ctx, input)
}

// UpdateTOS updates group Terms of Service (ADMIN+).
func (s *Service) UpdateTOS(ctx context.Context, input ports.UpdateTOSInput, requestorID string) error {
	group, err := s.repo.GetGroupDetails(ctx, input.GroupID, requestorID)
	if err != nil {
		return err
	}
	if _, err := s.guard(group, requestorID, domain.LevelAdmin); err != nil {
		return err
	}
	if err := s.repo.SetTOS(ctx, input); err != nil {
		return err
	}
	// Notify all members
	for _, m := range group.Members {
		_ = s.mailer.SendTOSUpdate(ctx, m.Email, group.ID, group.Name)
	}
	return nil
}

// GetNotifications returns pending invites and requests for a user.
func (s *Service) GetNotifications(ctx context.Context, userID string) (*domain.Notifications, error) {
	return s.repo.GetNotifications(ctx, userID)
}

// GetUserSettings returns user preferences.
func (s *Service) GetUserSettings(ctx context.Context, userID string) (*domain.UserSettings, error) {
	return s.repo.GetUserSettings(ctx, userID)
}

// SetUserSettings updates user preferences.
func (s *Service) SetUserSettings(ctx context.Context, userID string, settings domain.UserSettings) error {
	return s.repo.SetUserSettings(ctx, userID, settings)
}

// SearchUsers searches users by email/name.
func (s *Service) SearchUsers(ctx context.Context, search string, excludeGroupID string) ([]domain.User, error) {
	return s.repo.SearchUsers(ctx, search, excludeGroupID)
}
