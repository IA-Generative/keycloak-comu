import { z } from 'zod'

export const LeaveGroupDtoSchema = z.object({
  groupId: z.string(),
})
export type LeaveGroupDtoType = z.infer<typeof LeaveGroupDtoSchema>

export default defineEventHandler((event) => {
  return { message: `Hello ${event.context.clientAddress}` }
})
