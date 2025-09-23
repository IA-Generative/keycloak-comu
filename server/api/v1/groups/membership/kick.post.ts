import { z } from 'zod'
import { guard, LEVEL } from '../../../../guards/group.js'
import repo from '../../../../repository/index.js'

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
    throw createError({ statusCode: 404, statusMessage: 'Group not found' })
  }
  guard({ requiredLevel: LEVEL.ADMIN, group, requestorId: userId })
  if (body.userId === userId) {
    throw createError({ statusCode: 400, statusMessage: 'You cannot kick yourself' })
  }
  await repo.removeOwnerFromGroup(body.userId, body.groupId)
  await repo.removeMemberFromGroup(body.userId, body.groupId)
  return { message: `Hello ${event.context.clientAddress}` }
})
