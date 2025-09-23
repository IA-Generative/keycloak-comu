import { z } from 'zod'

export const GroupInviteDtoSchema = z.object({
  groupId: z.string(),
  email: z.string(),
})
export type GroupInviteDtoType = z.infer<typeof GroupInviteDtoSchema>

export default defineEventHandler((event) => {
  return { message: `Hello ${event.context.clientAddress}` }
})
