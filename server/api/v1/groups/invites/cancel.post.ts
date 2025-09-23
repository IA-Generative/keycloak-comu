import { z } from 'zod'
import repo from '../../../../repository/index.js'
import { guard, LEVEL } from '../../../../guards/group.js'

export const GroupInviteCancelDtoSchema = z.object({
  groupId: z.string(),
  userId: z.string(),
})
export type GroupInviteDtoType = z.infer<typeof GroupInviteCancelDtoSchema>

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, body => GroupInviteCancelDtoSchema.parse(body))

  const requestorId = event.context.user.sub
  // Use requestorId to verify permissions to invite to group
  const group = await repo.getGroupDetails(body.groupId)

  guard({ requiredLevel: LEVEL.ADMIN, group, requestorId })

  await repo.uninviteMemberFromGroup(body.userId, body.groupId)
  return { message: `Hello ${event.context.clientAddress}` }
})
