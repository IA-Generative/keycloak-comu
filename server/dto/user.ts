import { z } from 'zod'

export const UserDtoSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})
export type UserDtoType = z.infer<typeof UserDtoSchema>
