import { z } from 'zod'
import { guard, LEVEL } from '../../../../guards/group.js'
import repo from '../../../../repository/index.js'
import createResponseError from '~~/server/utils/error.js'

export const ChangeMemberLevelDtoSchema = z.object({
  groupId: z.string(),
  userId: z.string(),
  level: z.enum([10, 20, 30].map(String)).transform(Number),
})
export type ChangeMemberLevelDtoType = z.infer<typeof ChangeMemberLevelDtoSchema>

export default defineEventHandler(async (event) => {
  const requestorId = event.context.user.sub
  const body = await readValidatedBody(event, body => ChangeMemberLevelDtoSchema.parse(body))
  const group = await repo.getGroupDetails(body.groupId)

  if (!group) {
    throw createResponseError({ statusCode: 404, data: 'GROUP_NOT_FOUND' })
  }
  const targetLevel = guard({ requiredLevel: LEVEL.GUEST, group, requestorId: body.userId })
  if (body.userId !== requestorId) {
    guard({ gtLevel: targetLevel, group, requestorId }, { statusCode: 403, data: 'CANNOT_DEMOTE_USER_WITH_HIGER_LEVEL' })
  }
  guard({ gtLevel: body.level, group, requestorId }, { statusCode: 403, data: 'CANNOT_GRANT_AT_LEVEL_EQ_TO_YOURS' })

  if (body.userId === group.attributes.owner[0] && group.attributes.owner.length <= 1 && body.level !== LEVEL.OWNER) {
    throw createResponseError({ statusCode: 400, data: 'CANNOT_DEMOTE_ONLY_OWNER' })
  }
  await repo.setUserLevelInGroup(body.userId, body.groupId, body.level)
})
