import { z } from 'zod'

export const DemoteGroupOwnerDtoSchema = z.object({
  groupId: z.string(),
  userId: z.string(),
})
export type DemoteGroupOwnerDtoType = z.infer<typeof DemoteGroupOwnerDtoSchema>

export default defineEventHandler((event) => {
  return { message: `Hello ${event.context.clientAddress}` }
})
