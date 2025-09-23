import { z } from 'zod'

export const UpdateGroupDtoSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
})
export type UpdateGroupDtoType = z.infer<typeof UpdateGroupDtoSchema>

export default defineEventHandler((event) => {
  return { message: `Hello ${event.context.clientAddress}` }
})
