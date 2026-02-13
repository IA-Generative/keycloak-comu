import { z } from 'zod'

export const GlobalRequestSchema = z.object({
  groupId: z.string(),
  groupName: z.string(),
  userId: z.string(),
  userEmail: z.string(),
  userLastName: z.string().optional(),
  userFirstName: z.string().optional(),
})
export type GlobalRequestType = z.infer<typeof GlobalRequestSchema>
