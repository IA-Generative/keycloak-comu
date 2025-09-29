import { z } from 'zod'
import repo from '../../../../repository'
import { guard, LEVEL } from '../../../../guards/group.js'
import createResponseError from '~~/server/utils/error.js'

export const GroupInviteCreateDtoSchema = z.object({
  groupId: z.uuid({ error: 'INVALID_GROUP_ID' }),
  email: z.string(),
})
export type GroupInviteDtoType = z.infer<typeof GroupInviteCreateDtoSchema>

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, body => GroupInviteCreateDtoSchema.parse(body))

  const requestorId = event.context.user.sub
  // Use requestorId to verify permissions to invite to group
  const group = await repo.getGroupDetails(body.groupId)
  const invitee = await repo.getUserByEmail(body.email)
  if (!invitee) {
    throw createResponseError({ statusCode: 404, data: 'USER_NOT_FOUND' })
  }
  guard({ requiredLevel: LEVEL.ADMIN, group, requestorId })
  if (group!.members.some(member => member.id === invitee.id)) {
    return
  }
  await repo.inviteMemberToGroup(invitee.id, body.groupId)
})
