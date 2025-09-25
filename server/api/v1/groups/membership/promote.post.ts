import { z } from 'zod'
import { guard, LEVEL } from '../../../../guards/group.js'
import repo from '../../../../repository/index.js'
import createResponseError from '~~/server/utils/error.js'

export const PromoteGroupOwnerDtoSchema = z.object({
  groupId: z.string(),
  userId: z.string(),
})
export type PromoteGroupOwnerDtoType = z.infer<typeof PromoteGroupOwnerDtoSchema>

export default defineEventHandler(async (event) => {
  const requestorId = event.context.user.sub
  const body = await readValidatedBody(event, body => PromoteGroupOwnerDtoSchema.parse(body))
  const group = await repo.getGroupDetails(body.groupId)

  if (!group) {
    throw createResponseError({ statusCode: 404, data: 'GROUP_NOT_FOUND' })
  }
  guard({ requiredLevel: LEVEL.ADMIN, group, requestorId })
  await repo.addOwnerToGroup(body.userId, body.groupId)
})
