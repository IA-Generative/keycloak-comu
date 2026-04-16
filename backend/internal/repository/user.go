package repository

import (
	"context"
	"strings"

	"github.com/IA-Generative/keycloak-comu-new/backend/internal/groups/domain"
)

const AUTO_ACCEPT_INVITES_ATTRIBUTE = "keycloak-comu.autoAcceptInvites"

func (r *KeycloakRepository) SearchUsers(ctx context.Context, search string, excludeGroupID string) ([]domain.User, error) {
	likePattern := "%" + strings.ToLower(search) + "%"
	useTrgm := r.flags != nil && r.flags.IsEnabled("trgmSearch")

	var query string
	var args []interface{}

	if useTrgm {
		query = `
			SELECT ue.id, ue.username, ue.email,
				COALESCE(ue.first_name, '') AS first_name,
				COALESCE(ue.last_name, '') AS last_name
			FROM user_entity ue
			WHERE ue.realm_id = $1
				AND (
					CONCAT(ue.email, ' ', ue.first_name, ' ', ue.last_name) ILIKE $2
					OR word_similarity($3, CONCAT(ue.email, ' ', ue.first_name, ' ', ue.last_name)) > 0.2
				)
			ORDER BY (CONCAT(ue.email, ' ', ue.first_name, ' ', ue.last_name) ILIKE $2)::int DESC,
				word_similarity($3, CONCAT(ue.email, ' ', ue.first_name, ' ', ue.last_name)) DESC
			LIMIT 20
		`
		args = []interface{}{r.realmID, likePattern, search}
	} else {
		query = `
			SELECT ue.id, ue.username, ue.email,
				COALESCE(ue.first_name, '') AS first_name,
				COALESCE(ue.last_name, '') AS last_name
			FROM user_entity ue
			WHERE ue.realm_id = $1
				AND (LOWER(ue.email) LIKE $2 OR LOWER(ue.first_name) LIKE $2 OR LOWER(ue.last_name) LIKE $2)
			ORDER BY ue.username ASC
			LIMIT 20
		`
		args = []interface{}{r.realmID, likePattern}
	}

	var users []domain.User
	err := r.db.SelectContext(ctx, &users, query, args...)
	return users, err
}

func (r *KeycloakRepository) GetUserByEmail(ctx context.Context, email string) (*domain.User, error) {
	var user domain.User
	err := r.db.GetContext(ctx, &user, `
		SELECT ue.id, ue.username, ue.email,
			COALESCE(ue.first_name, '') AS first_name,
			COALESCE(ue.last_name, '') AS last_name
		FROM user_entity ue
		WHERE ue.realm_id = $1 AND LOWER(ue.email) = LOWER($2)
	`, r.realmID, email)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *KeycloakRepository) GetUserByID(ctx context.Context, id string) (*domain.User, error) {
	var user domain.User
	err := r.db.GetContext(ctx, &user, `
		SELECT ue.id, ue.username, ue.email,
			COALESCE(ue.first_name, '') AS first_name,
			COALESCE(ue.last_name, '') AS last_name
		FROM user_entity ue
		WHERE ue.realm_id = $1 AND ue.id = $2
	`, r.realmID, id)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *KeycloakRepository) GetUserSettings(ctx context.Context, userID string) (*domain.UserSettings, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT name, value FROM user_attribute
		WHERE user_id = $1 AND name = 'autoAcceptInvites'
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	settings := &domain.UserSettings{}
	for rows.Next() {
		var name, value string
		if err := rows.Scan(&name, &value); err != nil {
			return nil, err
		}
		if name == "autoAcceptInvites" {
			b := value == "true"
			settings.AutoAcceptInvites = &b
		}
	}
	return settings, nil
}

func (r *KeycloakRepository) SetUserSettings(ctx context.Context, userID string, settings domain.UserSettings) error {
	if settings.AutoAcceptInvites != nil {
		val := "false"
		if *settings.AutoAcceptInvites {
			val = "true"
		}
		kcUser, err := r.kc.Client.GetUserByID(ctx, r.kc.GetToken(), r.realm, userID)
		if err != nil {
			return err
		}
		attrs := safeAttrs(kcUser.Attributes)
		attrs[AUTO_ACCEPT_INVITES_ATTRIBUTE] = []string{val}
		kcUser.Attributes = &attrs
		return r.kc.Client.UpdateUser(ctx, r.kc.GetToken(), r.realm, *kcUser)
	}
	return nil
}
