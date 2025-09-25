import { z } from 'zod'
import { guard, LEVEL } from '../../../../guards/group.js'
import repo from '../../../../repository/index.js'
import createResponseError from '~~/server/utils/error.js'

export const KickGroupMemberDtoSchema = z.object({
  groupId: z.string(),
  userId: z.string(),
})
export type KickGroupMemberDtoType = z.infer<typeof KickGroupMemberDtoSchema>

export default defineEventHandler(async (event) => {
  const userId = event.context.user.sub
  const body = await readValidatedBody(event, body => KickGroupMemberDtoSchema.parse(body))
  const group = await repo.getGroupDetails(body.groupId)

  if (!group) {
    throw createResponseError({ statusCode: 404, data: 'GROUP_NOT_FOUND' })
  }
  guard({ requiredLevel: LEVEL.ADMIN, group, requestorId: userId })
  if (body.userId === userId) {
    throw createResponseError({ statusCode: 400, data: 'CANNOT_KICK_SELF' })
  }
  await repo.removeOwnerFromGroup(body.userId, body.groupId)
  await repo.removeMemberFromGroup(body.userId, body.groupId)
  return { message: `Hello ${event.context.clientAddress}` }
})
