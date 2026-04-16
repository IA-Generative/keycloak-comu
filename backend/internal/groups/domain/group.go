package domain

// MembershipLevel represents the access level in a group.
const (
	LevelGuest  = 0
	LevelMember = 10
	LevelAdmin  = 20
	LevelOwner  = 30
)

type User struct {
	ID        string `json:"id" db:"id"`
	Username  string `json:"username" db:"username"`
	Email     string `json:"email" db:"email"`
	FirstName string `json:"first_name,omitempty" db:"first_name"`
	LastName  string `json:"last_name,omitempty" db:"last_name"`
}

type GroupMember struct {
	User
	MembershipLevel int `json:"membershipLevel"`
}

type Team struct {
	ID      string   `json:"id"`
	Name    string   `json:"name"`
	Members []string `json:"members"`
}

type GroupSettings struct {
	AutoAcceptRequests bool `json:"autoAcceptRequests"`
}

type Group struct {
	ID          string        `json:"id"`
	Name        string        `json:"name"`
	Members     []GroupMember `json:"members"`
	Teams       []Team        `json:"teams"`
	Invites     []User        `json:"invites"`
	Requests    []User        `json:"requests"`
	Description string        `json:"description"`
	TOS         string        `json:"tos"`
	Links       []string      `json:"links"`
	Settings    GroupSettings `json:"settings"`
}

type GroupSummary struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type ListGroups struct {
	Joined    []GroupSummary `json:"joined"`
	Requested []GroupSummary `json:"requested"`
}

type GlobalRequest struct {
	GroupID       string `json:"groupId"`
	GroupName     string `json:"groupName"`
	UserID        string `json:"userId"`
	UserEmail     string `json:"userEmail"`
	UserLastName  string `json:"userLastName,omitempty"`
	UserFirstName string `json:"userFirstName,omitempty"`
}

type Notifications struct {
	Invites  []GroupSummary  `json:"invites"`
	Requests []GlobalRequest `json:"requests"`
}

type UserSettings struct {
	AutoAcceptInvites *bool `json:"autoAcceptInvites"`
}

type PaginatedResult[T any] struct {
	Results  []T  `json:"results"`
	Total    int  `json:"total"`
	Page     int  `json:"page"`
	PageSize int  `json:"pageSize"`
	Next     bool `json:"next,omitempty"`
}

type SearchGroupResult struct {
	ID     string   `json:"id"`
	Name   string   `json:"name"`
	Owners []string `json:"owners"`
}
