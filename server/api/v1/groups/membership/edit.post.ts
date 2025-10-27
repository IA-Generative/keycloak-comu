import { z } from 'zod'
import type { Level } from '../../../../guards/group.js'
import { guard, LEVEL } from '../../../../guards/group.js'
import repo from '../../../../repository/index.js'
import createResponseError from '~~/server/utils/error.js'
import type { UserRow } from '~~/server/repository/types.js'
import type { GroupDetails } from '~~/server/repository/groups.js'

export const ChangeMemberLevelDtoSchema = z.object({
  groupId: z.uuid({ error: 'INVALID_GROUP_ID' }),
  userId: z.uuid({ error: 'INVALID_USER_ID' }),
  level: z.enum([10, 20, 30].map(String), { error: 'INVALID_LEVEL' }).transform(Number).optional(),
})
export type ChangeMemberLevelDtoType = z.infer<typeof ChangeMemberLevelDtoSchema>

export default defineEventHandler(async (event) => {
  const requestorId = event.context.user.sub
  const { groupId, userId, level } = await readValidatedBody(event, body => ChangeMemberLevelDtoSchema.parse(body))
  const group = await repo.getGroupDetails(groupId)
  if (!group) {
    throw createResponseError({ statusCode: 404, data: 'GROUP_NOT_FOUND' })
  }

  const requestor = group.members.find(m => m.id === requestorId)
  const target = group.members.find(m => m.id === userId)

  if (!requestor) {
    throw createResponseError({ statusCode: 403, data: 'GROUP_NOT_FOUND' })
  }
  if (!target) {
    throw createResponseError({ statusCode: 403, data: 'USER_NOT_IN_GROUP' })
  }

  if (level != null) {
    await manageLevel({
      requestor,
      target,
      newLevel: level as Level,
      group,
    })
  }
})

function manageLevel({ requestor, target, newLevel, group }: { requestor: UserRow, target: UserRow, newLevel: Level, group: GroupDetails }) {
  const requestorLevel = guard({ requiredLevel: LEVEL.GUEST, group, requestorId: requestor.id })
  const targetLevel = guard({ requiredLevel: LEVEL.GUEST, group, requestorId: target.id })
  if (target.id === group.attributes.owner[0] && group.attributes.owner.length <= 1 && newLevel !== LEVEL.OWNER) {
    throw createResponseError({ statusCode: 400, data: 'CANNOT_DEMOTE_ONLY_OWNER' })
  }
  if (requestorLevel < LEVEL.OWNER) {
    if (target.id !== requestor.id) {
      if (requestorLevel <= targetLevel) {
        throw createResponseError({ statusCode: 403, data: 'CANNOT_DEMOTE_USER_WITH_HIGER_LEVEL' })
      }
    }
    if (newLevel >= requestorLevel) {
      throw createResponseError({ statusCode: 403, data: 'CANNOT_GRANT_AT_LEVEL_EQ_TO_YOURS' })
    }
  }

  return repo.setUserLevelInGroup(target.id, group.id, newLevel)
}
