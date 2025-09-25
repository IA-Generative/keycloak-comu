import { z } from 'zod'
import { guard, LEVEL } from '../../../../guards/group.js'
import repo from '../../../../repository/index.js'
import createResponseError from '~~/server/utils/error.js'

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
    throw createResponseError({ statusCode: 404, data: 'GROUP_NOT_FOUND' })
  }
  guard({ requiredLevel: LEVEL.ADMIN, group, requestorId: userId })
  if (!group.attributes.owner?.includes(body.userId)) {
    return
  }
  if (!group.attributes.owner || group.attributes.owner.length <= 1) {
    throw createResponseError({ statusCode: 400, data: 'CANNOT_DEMOTE_ONLY_OWNER' })
  }
  await repo.removeOwnerFromGroup(body.userId, body.groupId)
})
