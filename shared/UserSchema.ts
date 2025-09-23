import { z } from 'zod'

export const UserDtoSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
})

export default UserDtoSchema
