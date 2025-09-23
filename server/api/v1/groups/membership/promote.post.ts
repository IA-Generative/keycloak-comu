import { z } from 'zod'

export const PromoteGroupOwnerDtoSchema = z.object({
  groupId: z.string(),
  userId: z.string(),
})
export type PromoteGroupOwnerDtoType = z.infer<typeof PromoteGroupOwnerDtoSchema>

export default defineEventHandler((event) => {
  return { message: `Hello ${event.context.clientAddress}` }
})
