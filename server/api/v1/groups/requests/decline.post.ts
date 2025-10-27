import { z } from 'zod'
import repo from '../../../../repository/index.js'
import createResponseError from '~~/server/utils/error.js'
import { guard, LEVEL } from '~~/server/guards/group.js'

export const DeclineGroupInviteDtoSchema = z.object({
  groupId: z.uuid({ error: 'INVALID_GROUP_ID' }),
  userId: z.uuid({ error: 'INVALID_USER_ID' }),
})
export type DeclineGroupInviteDtoType = z.infer<typeof DeclineGroupInviteDtoSchema>

export default defineEventHandler(async (event) => {
  const userId = event.context.user.sub
  const body = await readValidatedBody(event, body => DeclineGroupInviteDtoSchema.parse(body))
  const group = await repo.getGroupDetails(body.groupId)
  if (!group) {
    throw createResponseError({ statusCode: 404, data: 'GROUP_NOT_FOUND' })
  }
  guard({ requiredLevel: LEVEL.ADMIN, group, requestorId: userId })
  await repo.cancelRequestJoinToGroup(body.userId, body.groupId)
})
