package ports

import (
	"context"

	"github.com/IA-Generative/keycloak-comu-new/backend/internal/groups/domain"
)

type CreateGroupInput struct {
	Name        string
	Description string
	OwnerID     string
}

type EditGroupInput struct {
	GroupID     string
	Description string
}

type SearchGroupsInput struct {
	Search   string
	Exact    bool
	Page     int
	PageSize int
}

type InviteInput struct {
	GroupID string
	Email   string
}

type MemberActionInput struct {
	GroupID string
	UserID  string
}

type EditMembershipInput struct {
	GroupID string
	UserID  string
	Level   int
}

type EditTeamInput struct {
	ParentID string
	Name     string
	UserIDs  []string
}

type DeleteTeamInput struct {
	ParentID string
	Name   string
}

type UpdateLinksInput struct {
	GroupID string
	Links   []string
}

type UpdateTOSInput struct {
	GroupID string
	TOS     string
}

type UpdateSettingsInput struct {
	GroupID  string
	Settings domain.GroupSettings
}

type Repository interface {
	CreateGroup(ctx context.Context, input CreateGroupInput) (*domain.Group, error)
	GetGroupDetails(ctx context.Context, groupID string, requestorID string) (*domain.Group, error)
	EditGroup(ctx context.Context, input EditGroupInput) error
	DeleteGroup(ctx context.Context, groupID string) error
	ListGroupsForUser(ctx context.Context, userID string) (*domain.ListGroups, error)
	SearchGroups(ctx context.Context, input SearchGroupsInput) (*domain.PaginatedResult[domain.SearchGroupResult], error)

	// Membership
	AddMemberToGroup(ctx context.Context, groupID string, userID string) error
	KickMemberFromGroup(ctx context.Context, groupID string, userID string) error
	SetUserLevelInGroup(ctx context.Context, groupID string, userID string, level int) error

	// Invites
	InviteMemberToGroup(ctx context.Context, groupID string, userID string) error
	UninviteMemberFromGroup(ctx context.Context, groupID string, userID string) error

	// Requests
	RequestJoinToGroup(ctx context.Context, groupID string, userID string) error
	CancelRequestJoinToGroup(ctx context.Context, groupID string, userID string) error

	// Teams
	EditTeam(ctx context.Context, input EditTeamInput) error
	DeleteTeam(ctx context.Context, input DeleteTeamInput) error

	// Settings & Attributes
	SetGroupSettings(ctx context.Context, input UpdateSettingsInput) error
	SetLinks(ctx context.Context, input UpdateLinksInput) error
	SetTOS(ctx context.Context, input UpdateTOSInput) error

	// Notifications
	GetNotifications(ctx context.Context, userID string) (*domain.Notifications, error)

	// Users
	SearchUsers(ctx context.Context, search string, excludeGroupID string) ([]domain.User, error)
	GetUserByEmail(ctx context.Context, email string) (*domain.User, error)
	GetUserByID(ctx context.Context, id string) (*domain.User, error)
	GetUserSettings(ctx context.Context, userID string) (*domain.UserSettings, error)
	SetUserSettings(ctx context.Context, userID string, settings domain.UserSettings) error
}

type Mailer interface {
	SendGroupInvite(ctx context.Context, toEmail, toName, groupID, groupName string) error
	SendAutoJoinNotification(ctx context.Context, toEmail, toFirstName, groupID, groupName string) error
	SendJoinRequest(ctx context.Context, toEmail, groupID, groupName, requesterName string) error
	SendJoinValidation(ctx context.Context, toEmail, groupID, groupName string) error
	SendTOSUpdate(ctx context.Context, toEmail, groupID, groupName string) error
}

type MetricsRecorder interface {
	ObserveGroupOperation(operation string, success bool)
	ObserveEmailSent(status string)
}
