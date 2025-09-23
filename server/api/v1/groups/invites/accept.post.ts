import { z } from 'zod'

export const AcceptGroupInviteDtoSchema = z.object({
  groupId: z.uuid(),
})
export type AcceptGroupInviteDtoType = z.infer<typeof AcceptGroupInviteDtoSchema>

export default defineEventHandler(async (event) => {
  const result = await readValidatedBody(event, body => AcceptGroupInviteDtoSchema.parse(body))

  return { message: `Group ${result.groupId}` }
})
