import { z } from 'zod'
import UserDtoSchema from './UserSchema.js'
import MembershipLevel from './MembershipLevel.js'

const GroupDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  members: z.array(UserDtoSchema.extend({ membershipLevel: MembershipLevel })),
  invites: z.array(UserDtoSchema),
})

export default GroupDtoSchema
