import { z } from 'zod'
import { guard, LEVEL } from '../../../../guards/group.js'
import repo from '../../../../repository/index.js'
import createResponseError from '~~/server/utils/error.js'

export const KickGroupMemberDtoSchema = z.object({
  groupId: z.uuid({ error: 'INVALID_GROUP_ID' }),
  userId: z.uuid({ error: 'INVALID_USER_ID' }),
})
export type KickGroupMemberDtoType = z.infer<typeof KickGroupMemberDtoSchema>

export default defineEventHandler(async (event) => {
  const userId = event.context.user.sub
  const body = await readValidatedBody(event, body => KickGroupMemberDtoSchema.parse(body))
  const group = await repo.getGroupDetails(body.groupId)

  if (!group) {
    throw createResponseError({ statusCode: 404, data: 'GROUP_NOT_FOUND' })
  }
  const targetLevel = guard({ requiredLevel: LEVEL.GUEST, group, requestorId: body.userId })
  guard({ gtLevel: targetLevel, group, requestorId: userId }, { statusCode: 403, data: 'CANNOT_KICK_USER_SAME_LEVEL' })
  guard({ requiredLevel: LEVEL.ADMIN, group, requestorId: userId }, { statusCode: 403, data: 'CANNOT_KICK_USER_WITHOUT_RIGHTS' })

  if (body.userId === userId) {
    throw createResponseError({ statusCode: 400, data: 'CANNOT_KICK_SELF' })
  }
  await repo.setUserLevelInGroup(body.userId, body.groupId, LEVEL.GUEST)
  await repo.kickMemberFromGroup(body.userId, group)
})
