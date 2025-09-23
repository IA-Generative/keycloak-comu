import { z } from 'zod'
import UserDtoSchema from './UserSchema.js'

const GroupDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  members: z.array(UserDtoSchema),
  invites: z.array(UserDtoSchema),
  owners: z.array(UserDtoSchema),
})

export default GroupDtoSchema
