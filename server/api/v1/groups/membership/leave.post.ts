import { z } from 'zod'
import repo from '../../../../repository/index.js'
import { guard, LEVEL } from '../../../../guards/group.js'

export const LeaveGroupDtoSchema = z.object({
  groupId: z.string(),
})
export type LeaveGroupDtoType = z.infer<typeof LeaveGroupDtoSchema>

export default defineEventHandler(async (event) => {
  const requestorId = event.context.user.sub
  const body = await readValidatedBody(event, body => LeaveGroupDtoSchema.parse(body))
  const group = await repo.getGroupDetails(body.groupId)
  if (!group) {
    throw createError({ statusCode: 404, statusMessage: 'Group not found' })
  }
  guard({ requiredLevel: LEVEL.MEMBER, group, requestorId })
  // If the user is the last member, delete the group
  if (group.members.length > 1 && group.attributes.owner.length === 1 && group.attributes.owner[0] === requestorId) {
    throw createError({ statusCode: 400, statusMessage: 'Cannot leave group as the only owner. Please assign another owner before leaving.' })
  }
  if (group.members.length <= 1) {
    await repo.deleteGroup(group.id)
    return
  }
  await repo.removeMemberFromGroup(requestorId, body.groupId)
  await repo.removeOwnerFromGroup(requestorId, body.groupId)
})
