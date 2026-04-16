package repository

import "context"

func (r *KeycloakRepository) CountGroups(ctx context.Context) (int, error) {
	var count int
	err := r.db.GetContext(ctx, &count,
		`SELECT count(*) FROM keycloak_group WHERE realm_id = $1 AND parent_group = $2`,
		r.realmID, deref(r.rootGroupID))
	return count, err
}

func (r *KeycloakRepository) CountDistinctUsers(ctx context.Context) (int, error) {
	var count int
	err := r.db.GetContext(ctx, &count,
		`SELECT count(DISTINCT ugm.user_id)
		 FROM user_group_membership ugm
		 JOIN keycloak_group g ON ugm.group_id = g.id
		 WHERE g.realm_id = $1 AND g.parent_group = $2`,
		r.realmID, deref(r.rootGroupID))
	return count, err
}

func (r *KeycloakRepository) CountMembersPerGroup(ctx context.Context) ([]int, error) {
	return r.countPerGroup(ctx,
		`SELECT count(*)
		 FROM user_group_membership ugm
		 RIGHT JOIN keycloak_group g ON g.id = ugm.group_id
		 WHERE g.realm_id = $1 AND g.parent_group = $2
		 GROUP BY ugm.group_id`)
}

func (r *KeycloakRepository) CountOwnersPerGroup(ctx context.Context) ([]int, error) {
	return r.countAttributePerGroup(ctx, "owner")
}

func (r *KeycloakRepository) CountAdminsPerGroup(ctx context.Context) ([]int, error) {
	return r.countAttributePerGroup(ctx, "admin")
}

func (r *KeycloakRepository) CountPendingInvitesPerGroup(ctx context.Context) ([]int, error) {
	return r.countAttributePerGroup(ctx, "invite")
}

func (r *KeycloakRepository) CountPendingRequestsPerGroup(ctx context.Context) ([]int, error) {
	return r.countAttributePerGroup(ctx, "request")
}

func (r *KeycloakRepository) CountLinksPerGroup(ctx context.Context) ([]int, error) {
	return r.countAttributePerGroup(ctx, "link")
}

func (r *KeycloakRepository) CountTeamsPerGroup(ctx context.Context) ([]int, error) {
	return r.countPerGroup(ctx,
		`SELECT COUNT(c_g.parent_group)
		 FROM keycloak_group g
		 LEFT JOIN keycloak_group c_g ON g.id = c_g.parent_group
		 WHERE g.realm_id = $1 AND g.parent_group = $2
		 GROUP BY g.id`)
}

// ── helpers ────────────────────────────────────────────────────────────────

func (r *KeycloakRepository) countPerGroup(ctx context.Context, query string) ([]int, error) {
	var counts []int
	err := r.db.SelectContext(ctx, &counts, query, r.realmID, deref(r.rootGroupID))
	return counts, err
}

func (r *KeycloakRepository) countAttributePerGroup(ctx context.Context, attrName string) ([]int, error) {
	var counts []int
	err := r.db.SelectContext(ctx, &counts,
		`SELECT COUNT(ga.group_id)
		 FROM keycloak_group g
		 LEFT JOIN group_attribute ga ON g.id = ga.group_id AND ga.name = $3
		 WHERE g.realm_id = $1 AND g.parent_group = $2
		 GROUP BY g.id`,
		r.realmID, deref(r.rootGroupID), attrName)
	return counts, err
}
