import { z } from 'zod'

export const DeclineGroupInviteDtoSchema = z.object({
  groupId: z.string(),
})
export type DeclineGroupInviteDtoType = z.infer<typeof DeclineGroupInviteDtoSchema>

export default defineEventHandler((event) => {
  return { message: `Hello ${event.context.clientAddress}` }
})
