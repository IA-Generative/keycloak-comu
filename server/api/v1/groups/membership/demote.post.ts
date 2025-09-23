import { z } from 'zod'
import { guard, LEVEL } from '../../../../guards/group.js'
import repo from '../../../../repository/index.js'

export const DemoteGroupOwnerDtoSchema = z.object({
  groupId: z.string(),
  userId: z.string(),
})
export type DemoteGroupOwnerDtoType = z.infer<typeof DemoteGroupOwnerDtoSchema>

export default defineEventHandler(async (event) => {
  const userId = event.context.user.sub
  const body = await readValidatedBody(event, body => DemoteGroupOwnerDtoSchema.parse(body))
  const group = await repo.getGroupDetails(body.groupId)

  if (!group) {
    throw createError({ statusCode: 404, statusMessage: 'Group not found' })
  }
  guard({ requiredLevel: LEVEL.ADMIN, group, requestorId: userId })
  if (!group.attributes.owner?.includes(body.userId)) {
    return
  }
  if (!group.attributes.owner || group.attributes.owner.length <= 1) {
    throw createError({ statusCode: 400, statusMessage: 'You cannot demote yourself as the only owner' })
  }
  await repo.removeOwnerFromGroup(body.userId, body.groupId)
})
