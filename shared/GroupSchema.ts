import { z } from 'zod'
import UserDtoSchema from './UserSchema.js'
import MembershipLevel from './MembershipLevel.js'
import TeamDtoSchema from './TeamSchema.js'
import GroupSettingsDtoSchema from './GroupSettingsSchema.js'

const GroupMemberDtoSchema = UserDtoSchema.extend({
  membershipLevel: MembershipLevel,
})

export type GroupMemberDto = z.infer<typeof GroupMemberDtoSchema>

const GroupDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  members: z.array(GroupMemberDtoSchema),
  teams: TeamDtoSchema,
  invites: z.array(UserDtoSchema),
  requests: z.array(UserDtoSchema),
  description: z.string(),
  tos: z.string(),
  links: z.array(z.string()),
  settings: GroupSettingsDtoSchema,
})

export default GroupDtoSchema
