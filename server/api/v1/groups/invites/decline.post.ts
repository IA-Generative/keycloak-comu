import { z } from 'zod'
import repo from '../../../../repository/index.js'

export const DeclineGroupInviteDtoSchema = z.object({
  groupId: z.uuid({ error: 'INVALID_GROUP_ID' }),
})
export type DeclineGroupInviteDtoType = z.infer<typeof DeclineGroupInviteDtoSchema>

export default defineEventHandler(async (event) => {
  const userId = event.context.user.sub
  const body = await readValidatedBody(event, body => DeclineGroupInviteDtoSchema.parse(body))
  await repo.uninviteMemberFromGroup(userId, body.groupId)
})
