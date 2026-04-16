package api

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"go.uber.org/zap"

	groupsapp "github.com/IA-Generative/keycloak-comu-new/backend/internal/groups/application"
	"github.com/IA-Generative/keycloak-comu-new/backend/internal/groups/domain"
	"github.com/IA-Generative/keycloak-comu-new/backend/internal/groups/ports"
)

// ── Group routes ───────────────────────────────────────────────────────────

type groupOutput struct {
	Body *domain.Group
}

type groupIDInput struct {
	GroupID string `path:"groupId" format:"uuid"`
}

type createGroupInput struct {
	Body struct {
		Name        string `json:"name" minLength:"3" maxLength:"50"`
		Description string `json:"description,omitempty" maxLength:"255"`
	}
}

type editGroupInput struct {
	Body struct {
		GroupID     string `json:"groupId" format:"uuid"`
		Description string `json:"description" maxLength:"255"`
	}
}

type searchGroupsInput struct {
	Body struct {
		Search   string `json:"search"`
		Exact    bool   `json:"exact,omitempty"`
		Page     int    `json:"page" minimum:"0"`
		PageSize int    `json:"pageSize,omitempty" minimum:"1" maximum:"100"`
	}
}

type searchGroupsOutput struct {
	Body *domain.PaginatedResult[domain.SearchGroupResult]
}

type listGroupsOutput struct {
	Body *domain.ListGroups
}

type deleteGroupInput struct {
	Body struct {
		GroupID string `json:"groupId" format:"uuid"`
	}
}

type inviteInput struct {
	Body struct {
		GroupID string `json:"groupId" format:"uuid"`
		Email   string `json:"email" format:"email"`
	}
}

type memberActionInput struct {
	Body struct {
		GroupID string `json:"groupId" format:"uuid"`
		UserID  string `json:"userId" format:"uuid"`
	}
}

type implicitMemberActionInput struct {
	Body struct {
		GroupID string `json:"groupId" format:"uuid"`
	}
}

type editMembershipInput struct {
	Body struct {
		GroupID string `json:"groupId" format:"uuid"`
		UserID  string `json:"userId" format:"uuid"`
		Level   int    `json:"level,omitempty"`
	}
}

type editTeamInput struct {
	Body struct {
		ParentID string   `json:"parentId" format:"uuid"`
		Name     string   `json:"name" minLength:"2" maxLength:"15"`
		UserIDs  []string `json:"userIds,omitempty"`
	}
}

type deleteTeamInput struct {
	Body struct {
		ParentID string `json:"parentId" format:"uuid"`
		Name     string `json:"name"`
	}
}

type updateSettingsInput struct {
	Body struct {
		GroupID            string `json:"groupId" format:"uuid"`
		AutoAcceptRequests *bool  `json:"autoAcceptRequests,omitempty"`
	}
}

type updateLinksInput struct {
	Body struct {
		GroupID string   `json:"groupId" format:"uuid"`
		Links   []string `json:"links"`
	}
}

type updateTOSInput struct {
	Body struct {
		GroupID string `json:"groupId" format:"uuid"`
		TOS     string `json:"tos" maxLength:"255"`
	}
}

type notificationsOutput struct {
	Body *domain.Notifications
}

func registerGroupRoutes(api huma.API, service *groupsapp.Service, logger *zap.Logger) {
	security := []map[string][]string{{"bearerAuth": {}}}

	// ── GET groups/list ──
	huma.Register(api, huma.Operation{
		OperationID: "list-groups",
		Method:      http.MethodGet,
		Path:        "/v1/groups/list",
		Tags:        []string{"groups"},
		Summary:     "List user's groups",
		Security:    security,
	}, func(ctx context.Context, _ *struct{}) (*listGroupsOutput, error) {
		p, err := requirePrincipal(ctx)
		if err != nil {
			return nil, err
		}
		result, err := service.ListGroups(ctx, p.Subject)
		if err != nil {
			logger.Warn("failed to list groups", zap.String("userID", p.Subject), zap.Error(err))
			return nil, mapServiceError(err)
		}
		return &listGroupsOutput{Body: result}, nil
	})

	// ── POST groups/create ──
	huma.Register(api, huma.Operation{
		OperationID:   "create-group",
		Method:        http.MethodPost,
		Path:          "/v1/groups/create",
		Tags:          []string{"groups"},
		Summary:       "Create a new group",
		Security:      security,
		DefaultStatus: http.StatusCreated,
	}, func(ctx context.Context, input *createGroupInput) (*groupOutput, error) {
		p, err := requirePrincipal(ctx)
		if err != nil {
			return nil, err
		}
		group, err := service.CreateGroup(ctx, ports.CreateGroupInput{
			Name:        sanitize(input.Body.Name),
			Description: input.Body.Description,
			OwnerID:     p.Subject,
		})
		if err != nil {
			logger.Warn("failed to create group", zap.String("userID", p.Subject), zap.Error(err))
			return nil, mapServiceError(err)
		}
		return &groupOutput{Body: group}, nil
	})

	// ── GET groups/{groupId} ──
	huma.Register(api, huma.Operation{
		OperationID: "get-group",
		Method:      http.MethodGet,
		Path:        "/v1/groups/{groupId}",
		Tags:        []string{"groups"},
		Summary:     "Get group details",
		Security:    security,
	}, func(ctx context.Context, input *groupIDInput) (*groupOutput, error) {
		p, err := requirePrincipal(ctx)
		if err != nil {
			return nil, err
		}
		group, err := service.GetGroupDetails(ctx, input.GroupID, p.Subject)
		if err != nil {
			logger.Warn("failed to get group details", zap.String("userID", p.Subject), zap.String("groupID", input.GroupID), zap.Error(err))
			return nil, mapServiceError(err)
		}
		return &groupOutput{Body: group}, nil
	})

	// ── POST groups/edit ──
	huma.Register(api, huma.Operation{
		OperationID: "edit-group",
		Method:      http.MethodPost,
		Path:        "/v1/groups/edit",
		Tags:        []string{"groups"},
		Summary:     "Edit group description",
		Security:    security,
	}, func(ctx context.Context, input *editGroupInput) (*struct{}, error) {
		p, err := requirePrincipal(ctx)
		if err != nil {
			return nil, err
		}
		err = service.EditGroup(ctx, ports.EditGroupInput{
			GroupID:     input.Body.GroupID,
			Description: input.Body.Description,
		}, p.Subject)
		if err != nil {
			logger.Warn("failed to edit group", zap.String("userID", p.Subject), zap.String("groupID", input.Body.GroupID), zap.Error(err))
			return nil, mapServiceError(err)
		}
		return nil, nil
	})

	// ── POST groups/delete ──
	huma.Register(api, huma.Operation{
		OperationID: "delete-group",
		Method:      http.MethodPost,
		Path:        "/v1/groups/delete",
		Tags:        []string{"groups"},
		Summary:     "Delete group",
		Security:    security,
	}, func(ctx context.Context, input *deleteGroupInput) (*struct{}, error) {
		p, err := requirePrincipal(ctx)
		if err != nil {
			return nil, err
		}
		if err := service.DeleteGroup(ctx, input.Body.GroupID, p.Subject); err != nil {
			logger.Warn("failed to delete group", zap.String("userID", p.Subject), zap.String("groupID", input.Body.GroupID), zap.Error(err))
			return nil, mapServiceError(err)
		}
		return nil, nil
	})

	// ── POST groups/search ──
	huma.Register(api, huma.Operation{
		OperationID: "search-groups",
		Method:      http.MethodPost,
		Path:        "/v1/groups/search",
		Tags:        []string{"groups"},
		Summary:     "Search groups",
		Security:    security,
	}, func(ctx context.Context, input *searchGroupsInput) (*searchGroupsOutput, error) {
		p, err := requirePrincipal(ctx)
		if err != nil {
			return nil, err
		}
		pageSize := input.Body.PageSize
		if pageSize == 0 {
			pageSize = 20
		}
		result, err := service.SearchGroups(ctx, ports.SearchGroupsInput{
			Search:   sanitize(input.Body.Search),
			Exact:    input.Body.Exact,
			Page:     input.Body.Page,
			PageSize: pageSize,
		})
		if err != nil {
			logger.Warn("failed to search groups", zap.String("userID", p.Subject), zap.Error(err))
			return nil, mapServiceError(err)
		}
		return &searchGroupsOutput{Body: result}, nil
	})

	// ── POST groups/update-settings ──
	huma.Register(api, huma.Operation{
		OperationID: "update-group-settings",
		Method:      http.MethodPost,
		Path:        "/v1/groups/update-settings",
		Tags:        []string{"groups"},
		Summary:     "Update group settings",
		Security:    security,
	}, func(ctx context.Context, input *updateSettingsInput) (*struct{}, error) {
		p, err := requirePrincipal(ctx)
		if err != nil {
			return nil, err
		}
		settings := domain.GroupSettings{}
		if input.Body.AutoAcceptRequests != nil {
			settings.AutoAcceptRequests = *input.Body.AutoAcceptRequests
		}
		if err := service.UpdateSettings(ctx, ports.UpdateSettingsInput{
			GroupID:  input.Body.GroupID,
			Settings: settings,
		}, p.Subject); err != nil {
			logger.Warn("failed to update group settings", zap.String("userID", p.Subject), zap.String("groupID", input.Body.GroupID), zap.Error(err))
			return nil, mapServiceError(err)
		}
		return nil, nil
	})

	// ── POST groups/update-links ──
	huma.Register(api, huma.Operation{
		OperationID: "update-group-links",
		Method:      http.MethodPost,
		Path:        "/v1/groups/update-links",
		Tags:        []string{"groups"},
		Summary:     "Update group resource links",
		Security:    security,
	}, func(ctx context.Context, input *updateLinksInput) (*struct{}, error) {
		p, err := requirePrincipal(ctx)
		if err != nil {
			return nil, err
		}
		if err := service.UpdateLinks(ctx, ports.UpdateLinksInput{
			GroupID: input.Body.GroupID,
			Links:   input.Body.Links,
		}, p.Subject); err != nil {
			logger.Warn("failed to update group links", zap.String("userID", p.Subject), zap.String("groupID", input.Body.GroupID), zap.Error(err))
			return nil, mapServiceError(err)
		}
		return nil, nil
	})

	// ── POST groups/update-tos ──
	huma.Register(api, huma.Operation{
		OperationID: "update-group-tos",
		Method:      http.MethodPost,
		Path:        "/v1/groups/update-tos",
		Tags:        []string{"groups"},
		Summary:     "Update group Terms of Service",
		Security:    security,
	}, func(ctx context.Context, input *updateTOSInput) (*struct{}, error) {
		p, err := requirePrincipal(ctx)
		if err != nil {
			return nil, err
		}
		if err := service.UpdateTOS(ctx, ports.UpdateTOSInput{
			GroupID: input.Body.GroupID,
			TOS:     input.Body.TOS,
		}, p.Subject); err != nil {
			logger.Warn("failed to update group TOS", zap.String("userID", p.Subject), zap.String("groupID", input.Body.GroupID), zap.Error(err))
			return nil, mapServiceError(err)
		}
		return nil, nil
	})

	// ── Invites ────────────────────────────────────────────────────────────

	huma.Register(api, huma.Operation{
		OperationID: "create-invite",
		Method:      http.MethodPost,
		Path:        "/v1/groups/invites/create",
		Tags:        []string{"invites"},
		Summary:     "Invite a user to a group",
		Security:    security,
	}, func(ctx context.Context, input *inviteInput) (*struct{}, error) {
		p, err := requirePrincipal(ctx)
		if err != nil {
			return nil, err
		}
		if err := service.InviteUser(ctx, input.Body.GroupID, sanitize(input.Body.Email), p.Subject, p.PreferredUsername); err != nil {
			logger.Warn("failed to create invite", zap.String("userID", p.Subject), zap.String("groupID", input.Body.GroupID), zap.String("email", input.Body.Email), zap.Error(err))
			return nil, mapServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "accept-invite",
		Method:      http.MethodPost,
		Path:        "/v1/groups/invites/accept",
		Tags:        []string{"invites"},
		Summary:     "Accept an invitation",
		Security:    security,
	}, func(ctx context.Context, input *implicitMemberActionInput) (*struct{}, error) {
		p, err := requirePrincipal(ctx)
		if err != nil {
			return nil, err
		}
		if err := service.AcceptInvite(ctx, input.Body.GroupID, p.Subject); err != nil {
			logger.Warn("failed to accept invite", zap.String("userID", p.Subject), zap.String("groupID", input.Body.GroupID), zap.Error(err))
			return nil, mapServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "decline-invite",
		Method:      http.MethodPost,
		Path:        "/v1/groups/invites/decline",
		Tags:        []string{"invites"},
		Summary:     "Decline an invitation",
		Security:    security,
	}, func(ctx context.Context, input *implicitMemberActionInput) (*struct{}, error) {
		p, err := requirePrincipal(ctx)
		if err != nil {
			return nil, err
		}
		if err := service.DeclineInvite(ctx, input.Body.GroupID, p.Subject); err != nil {
			logger.Warn("failed to decline invite", zap.String("userID", p.Subject), zap.String("groupID", input.Body.GroupID), zap.Error(err))
			return nil, mapServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "cancel-invite",
		Method:      http.MethodPost,
		Path:        "/v1/groups/invites/cancel",
		Tags:        []string{"invites"},
		Summary:     "Cancel a sent invitation",
		Security:    security,
	}, func(ctx context.Context, input *memberActionInput) (*struct{}, error) {
		p, err := requirePrincipal(ctx)
		if err != nil {
			return nil, err
		}
		if err := service.CancelInvite(ctx, input.Body.GroupID, input.Body.UserID, p.Subject); err != nil {
			logger.Warn("failed to cancel invite", zap.String("userID", p.Subject), zap.String("groupID", input.Body.GroupID), zap.String("targetUserID", input.Body.UserID), zap.Error(err))
			return nil, mapServiceError(err)
		}
		return nil, nil
	})

	// ── Requests ───────────────────────────────────────────────────────────

	huma.Register(api, huma.Operation{
		OperationID: "create-join-request",
		Method:      http.MethodPost,
		Path:        "/v1/groups/requests/create",
		Tags:        []string{"requests"},
		Summary:     "Request to join a group",
		Security:    security,
	}, func(ctx context.Context, input *implicitMemberActionInput) (*struct{}, error) {
		p, err := requirePrincipal(ctx)
		if err != nil {
			return nil, err
		}
		if err := service.RequestJoin(ctx, input.Body.GroupID, p.Subject, p.Email); err != nil {
			logger.Warn("failed to create join request", zap.String("userID", p.Subject), zap.String("groupID", input.Body.GroupID), zap.Error(err))
			return nil, mapServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "accept-join-request",
		Method:      http.MethodPost,
		Path:        "/v1/groups/requests/accept",
		Tags:        []string{"requests"},
		Summary:     "Accept a join request",
		Security:    security,
	}, func(ctx context.Context, input *memberActionInput) (*struct{}, error) {
		p, err := requirePrincipal(ctx)
		if err != nil {
			return nil, err
		}
		if err := service.AcceptRequest(ctx, input.Body.GroupID, input.Body.UserID, p.Subject); err != nil {
			logger.Warn("failed to accept join request", zap.String("userID", p.Subject), zap.String("groupID", input.Body.GroupID), zap.String("targetUserID", input.Body.UserID), zap.Error(err))
			return nil, mapServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "decline-join-request",
		Method:      http.MethodPost,
		Path:        "/v1/groups/requests/decline",
		Tags:        []string{"requests"},
		Summary:     "Decline a join request",
		Security:    security,
	}, func(ctx context.Context, input *memberActionInput) (*struct{}, error) {
		p, err := requirePrincipal(ctx)
		if err != nil {
			return nil, err
		}
		if err := service.DeclineRequest(ctx, input.Body.GroupID, input.Body.UserID, p.Subject); err != nil {
			logger.Warn("failed to decline join request", zap.String("userID", p.Subject), zap.String("groupID", input.Body.GroupID), zap.String("targetUserID", input.Body.UserID), zap.Error(err))
			return nil, mapServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "cancel-join-request",
		Method:      http.MethodPost,
		Path:        "/v1/groups/requests/cancel",
		Tags:        []string{"requests"},
		Summary:     "Cancel your join request",
		Security:    security,
	}, func(ctx context.Context, input *implicitMemberActionInput) (*struct{}, error) {
		p, err := requirePrincipal(ctx)
		if err != nil {
			return nil, err
		}
		if err := service.CancelRequest(ctx, input.Body.GroupID, p.Subject); err != nil {
			logger.Warn("failed to cancel join request", zap.String("userID", p.Subject), zap.String("groupID", input.Body.GroupID), zap.Error(err))
			return nil, mapServiceError(err)
		}
		return nil, nil
	})

	// ── Membership ─────────────────────────────────────────────────────────

	huma.Register(api, huma.Operation{
		OperationID: "edit-membership",
		Method:      http.MethodPost,
		Path:        "/v1/groups/membership/edit",
		Tags:        []string{"membership"},
		Summary:     "Change a member's role",
		Security:    security,
	}, func(ctx context.Context, input *editMembershipInput) (*struct{}, error) {
		p, err := requirePrincipal(ctx)
		if err != nil {
			return nil, err
		}
		if err := service.EditMembership(ctx, ports.EditMembershipInput{
			GroupID: input.Body.GroupID,
			UserID:  input.Body.UserID,
			Level:   input.Body.Level,
		}, p.Subject); err != nil {
			logger.Warn("failed to edit membership", zap.String("userID", p.Subject), zap.String("groupID", input.Body.GroupID), zap.String("targetUserID", input.Body.UserID), zap.Int("level", input.Body.Level), zap.Error(err))
			return nil, mapServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "kick-member",
		Method:      http.MethodPost,
		Path:        "/v1/groups/membership/kick",
		Tags:        []string{"membership"},
		Summary:     "Remove a member from a group",
		Security:    security,
	}, func(ctx context.Context, input *memberActionInput) (*struct{}, error) {
		p, err := requirePrincipal(ctx)
		if err != nil {
			return nil, err
		}
		if err := service.KickMember(ctx, input.Body.GroupID, input.Body.UserID, p.Subject); err != nil {
			logger.Warn("failed to kick member", zap.String("userID", p.Subject), zap.String("groupID", input.Body.GroupID), zap.String("targetUserID", input.Body.UserID), zap.Error(err))
			return nil, mapServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "leave-group",
		Method:      http.MethodPost,
		Path:        "/v1/groups/membership/leave",
		Tags:        []string{"membership"},
		Summary:     "Leave a group",
		Security:    security,
	}, func(ctx context.Context, input *implicitMemberActionInput) (*struct{}, error) {
		p, err := requirePrincipal(ctx)
		if err != nil {
			return nil, err
		}
		if err := service.LeaveGroup(ctx, input.Body.GroupID, p.Subject); err != nil {
			logger.Warn("failed to leave group", zap.Error(err))
			return nil, mapServiceError(err)
		}
		return nil, nil
	})

	// ── Teams ──────────────────────────────────────────────────────────────

	huma.Register(api, huma.Operation{
		OperationID: "edit-team",
		Method:      http.MethodPost,
		Path:        "/v1/groups/edit-team",
		Tags:        []string{"teams"},
		Summary:     "Create or update a team",
		Security:    security,
	}, func(ctx context.Context, input *editTeamInput) (*struct{}, error) {
		p, err := requirePrincipal(ctx)
		if err != nil {
			return nil, err
		}
		if err := service.EditTeam(ctx, ports.EditTeamInput{
			ParentID: input.Body.ParentID,
			Name:     sanitize(input.Body.Name),
			UserIDs:  input.Body.UserIDs,
		}, p.Subject); err != nil {
			logger.Warn("failed to edit team", zap.String("userID", p.Subject), zap.String("parentID", input.Body.ParentID), zap.String("teamName", input.Body.Name), zap.Strings("userIDs", input.Body.UserIDs), zap.Error(err))
			return nil, mapServiceError(err)
		}
		return nil, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "delete-team",
		Method:      http.MethodPost,
		Path:        "/v1/groups/delete-team",
		Tags:        []string{"teams"},
		Summary:     "Delete a team",
		Security:    security,
	}, func(ctx context.Context, input *deleteTeamInput) (*struct{}, error) {
		p, err := requirePrincipal(ctx)
		if err != nil {
			return nil, err
		}
		if err := service.DeleteTeam(ctx, ports.DeleteTeamInput{
			ParentID: input.Body.ParentID,
			Name:     input.Body.Name,
		}, p.Subject); err != nil {
			logger.Warn("failed to delete team", zap.Error(err))
			return nil, mapServiceError(err)
		}
		return nil, nil
	})

	// ── Notifications ──────────────────────────────────────────────────────

	huma.Register(api, huma.Operation{
		OperationID: "get-notifications",
		Method:      http.MethodGet,
		Path:        "/v1/notifications",
		Tags:        []string{"notifications"},
		Summary:     "Get pending invites and requests",
		Security:    security,
	}, func(ctx context.Context, _ *struct{}) (*notificationsOutput, error) {
		p, err := requirePrincipal(ctx)
		if err != nil {
			return nil, err
		}
		result, err := service.GetNotifications(ctx, p.Subject)
		if err != nil {
			logger.Warn("failed to get notifications", zap.Error(err))
			return nil, mapServiceError(err)
		}
		return &notificationsOutput{Body: result}, nil
	})
}
