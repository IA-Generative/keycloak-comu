import { z } from 'zod'

export const KickGroupMemberDtoSchema = z.object({
  groupId: z.string(),
  userId: z.string(),
})
export type KickGroupMemberDtoType = z.infer<typeof KickGroupMemberDtoSchema>

export default defineEventHandler((event) => {
  return { message: `Hello ${event.context.clientAddress}` }
})
