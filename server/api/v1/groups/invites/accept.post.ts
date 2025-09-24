import { z } from 'zod'
import repo from '../../../../repository/index.js'

export const AcceptGroupInviteDtoSchema = z.object({
  groupId: z.uuid(),
})
export type AcceptGroupInviteDtoType = z.infer<typeof AcceptGroupInviteDtoSchema>

export default defineEventHandler(async (event) => {
  const userId = event.context.user.sub

  const result = await readValidatedBody(event, body => AcceptGroupInviteDtoSchema.parse(body))
  const group = await repo.getGroupDetails(result.groupId)

  if (!group) {
    throw createError({ statusCode: 404, statusMessage: 'Group not found' })
  }

  if (!group.attributes.invite.includes(userId)) {
    throw createError({ statusCode: 403, statusMessage: 'User not invited' })
  }
  await repo.addMemberToGroup(userId, result.groupId)
  await repo.uninviteMemberFromGroup(userId, result.groupId)

  return { message: `Group ${result.groupId}` }
})
