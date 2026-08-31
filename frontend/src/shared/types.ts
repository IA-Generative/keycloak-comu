// Re-export generated types for use in components
export type {
  Group as GroupDtoType,
  GroupMember as GroupMemberDto,
  ListGroups as ListGroupDtoType,
  User as UserDtoType,
  Notifications as NotificationsDtoType,
  GlobalRequest as GlobalRequestType,
  GroupSettings,
  GroupSummary,
  Team,
  SearchGroupResult,
  PaginatedResultSearchGroupResult as PaginatedResponse,
  UserSettings,
  PredefinedInvite,
} from '@/client/types.gen'

export type InviteLinkParameters = {
  role: string
  redirectUrl: string | undefined
  teams: string[] | undefined
}