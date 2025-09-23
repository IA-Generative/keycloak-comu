import { z } from 'zod'

export const DeleteGroupDtoSchema = z.object({
  id: z.string(),
})
export type DeleteGroupDtoType = z.infer<typeof DeleteGroupDtoSchema>

export default defineEventHandler((event) => {
  return { message: `Hello ${event.context.clientAddress}` }
})
