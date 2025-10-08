import { z } from 'zod'
import UserDtoSchema from './UserSchema.js'
import MembershipLevel from './MembershipLevel.js'
import TeamDtoSchema from './TeamSchema.js'

const GroupDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  members: z.array(UserDtoSchema.extend({ membershipLevel: MembershipLevel })),
  teams: TeamDtoSchema,
  invites: z.array(UserDtoSchema),
  requests: z.array(UserDtoSchema),
  description: z.string().optional().nullable(),
})

export default GroupDtoSchema
