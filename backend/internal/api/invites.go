package api

import (
	"context"
	"net/http"
	"strings"

	"github.com/danielgtaylor/huma/v2"
	"go.uber.org/zap"

	groupsapp "github.com/IA-Generative/keycloak-comu-new/backend/internal/groups/application"
	"github.com/IA-Generative/keycloak-comu-new/backend/internal/groups/domain"
	"github.com/IA-Generative/keycloak-comu-new/backend/internal/groups/ports"
)

type predefinedInviteListInput struct {
	Body struct {
		GroupID string `json:"groupId" format:"uuid"`
	}
}

type predefinedInviteListOutput struct {
	Body []domain.PredefinedInvite
}

type predefinedInviteOutput struct {
	Body *domain.PredefinedInvite
}

type predefinedInviteCreateInput struct {
	Body struct {
		GroupID     string   `json:"groupId" format:"uuid"`
		Role        string   `json:"role,omitempty"`
		RedirectURL string   `json:"redirectUrl,omitempty" maxLength:"255"`
		Teams       []string `json:"teams,omitempty"`
	}
}

type predefinedInviteDeleteInput struct {
	Body struct {
		GroupID string `json:"groupId" format:"uuid"`
		Code    string `json:"code" minLength:"7" maxLength:"7"`
	}
}

type invitePreviewInput struct {
	Code string `path:"code" minLength:"7" maxLength:"7"`
}

type invitePreviewOutput struct {
	Body *domain.PredefinedInvite
}

func registerInviteRoutes(api huma.API, service *groupsapp.Service, logger *zap.Logger) {
	security := []map[string][]string{{"bearerAuth": {}}}

	// ── GET /v1/invites/{code} ──
	huma.Register(api, huma.Operation{
		OperationID: "get-invite-preview",
		Method:      http.MethodGet,
		Path:        "/v1/invites/{code}",
		Tags:        []string{"invites"},
		Summary:     "Preview a predefined invitation link",
	}, func(ctx context.Context, input *invitePreviewInput) (*invitePreviewOutput, error) {
		invite, err := service.GetPredefinedInvitePreview(ctx, input.Code)
		logger.Debug("get-invite-preview", zap.String("code", input.Code), zap.Any("invite", invite), zap.Error(err))
		if err != nil {
			return nil, mapServiceError(err)
		}
		return &invitePreviewOutput{Body: invite}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-predefined-invites",
		Method:      http.MethodPost,
		Path:        "/v1/groups/invites/links/list",
		Tags:        []string{"invites"},
		Summary:     "List predefined invitation links",
		Security:    security,
	}, func(ctx context.Context, input *predefinedInviteListInput) (*predefinedInviteListOutput, error) {
		p, err := requirePrincipal(ctx)
		if err != nil {
			return nil, err
		}
		invites, err := service.ListPredefinedInvites(ctx, input.Body.GroupID, p.Subject)
		if err != nil {
			logger.Warn("failed to list predefined invites", zap.String("userID", p.Subject), zap.String("groupID", input.Body.GroupID), zap.Error(err))
			return nil, mapServiceError(err)
		}
		return &predefinedInviteListOutput{Body: invites}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID:   "create-predefined-invite",
		Method:        http.MethodPost,
		Path:          "/v1/groups/invites/links/create",
		Tags:          []string{"invites"},
		Summary:       "Create a predefined invitation link",
		Security:      security,
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *predefinedInviteCreateInput) (*predefinedInviteOutput, error) {
		p, err := requirePrincipal(ctx)
		if err != nil {
			return nil, err
		}
		invite, err := service.CreatePredefinedInvite(ctx, ports.PredefinedInviteLinkInput{
			GroupID:     input.Body.GroupID,
			Role:        strings.ToLower(strings.TrimSpace(input.Body.Role)),
			RedirectURL: input.Body.RedirectURL,
			Teams:       input.Body.Teams,
		}, p.Subject)
		if err != nil {
			logger.Warn("failed to create predefined invite", zap.String("userID", p.Subject), zap.String("groupID", input.Body.GroupID), zap.Error(err))
			return nil, mapServiceError(err)
		}
		return &predefinedInviteOutput{Body: invite}, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "delete-predefined-invite",
		Method:      http.MethodPost,
		Path:        "/v1/groups/invites/links/delete",
		Tags:        []string{"invites"},
		Summary:     "Delete a predefined invitation link",
		Security:    security,
	}, func(ctx context.Context, input *predefinedInviteDeleteInput) (*struct{}, error) {
		p, err := requirePrincipal(ctx)
		if err != nil {
			return nil, err
		}
		if err := service.DeletePredefinedInvite(ctx, input.Body.GroupID, input.Body.Code, p.Subject); err != nil {
			logger.Warn("failed to delete predefined invite", zap.String("userID", p.Subject), zap.String("groupID", input.Body.GroupID), zap.String("code", input.Body.Code), zap.Error(err))
			return nil, mapServiceError(err)
		}
		return nil, nil
	})
}
