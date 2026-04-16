package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"go.uber.org/zap"

	groupsapp "github.com/IA-Generative/keycloak-comu-new/backend/internal/groups/application"
	"github.com/IA-Generative/keycloak-comu-new/backend/internal/groups/domain"
)

// ── User routes ────────────────────────────────────────────────────────────

type searchUsersInput struct {
	Body struct {
		Search         string `json:"search"`
		ExcludeGroupID string `json:"excludeGroupId,omitempty" format:"uuid"`
	}
}

type searchUsersOutput struct {
	Body struct {
		Users []domain.User `json:"users"`
	}
}

type userSettingsOutput struct {
	Body *domain.UserSettings
}

type userSettingsInput struct {
	Body domain.UserSettings
}

func registerUserRoutes(api huma.API, service *groupsapp.Service, logger *zap.Logger) {
	security := []map[string][]string{{"bearerAuth": {}}}

	huma.Register(api, huma.Operation{
		OperationID: "search-users",
		Method:      http.MethodPost,
		Path:        "/v1/users/search",
		Tags:        []string{"users"},
		Summary:     "Search users",
		Security:    security,
	}, func(ctx context.Context, input *searchUsersInput) (*searchUsersOutput, error) {
		if _, err := requirePrincipal(ctx); err != nil {
			return nil, err
		}
		users, err := service.SearchUsers(ctx, sanitize(input.Body.Search), input.Body.ExcludeGroupID)
		if err != nil {
			return nil, mapServiceError(err)
		}
		output := &searchUsersOutput{}
		output.Body.Users = users
		return output, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-user-settings",
		Method:      http.MethodGet,
		Path:        "/v1/users/settings",
		Tags:        []string{"users"},
		Summary:     "Get user settings",
		Security:    security,
	}, func(ctx context.Context, _ *struct{}) (*userSettingsOutput, error) {
		p, err := requirePrincipal(ctx)
		if err != nil {
			return nil, err
		}
		settings, err := service.GetUserSettings(ctx, p.Subject)
		if err != nil {
			return nil, mapServiceError(err)
		}
		return &userSettingsOutput{Body: settings}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "update-user-settings",
		Method:      http.MethodPost,
		Path:        "/v1/users/settings",
		Tags:        []string{"users"},
		Summary:     "Update user settings",
		Security:    security,
	}, func(ctx context.Context, input *userSettingsInput) (*struct{}, error) {
		p, err := requirePrincipal(ctx)
		if err != nil {
			return nil, err
		}
		if err := service.SetUserSettings(ctx, p.Subject, input.Body); err != nil {
			return nil, mapServiceError(err)
		}
		return nil, nil
	})
}
