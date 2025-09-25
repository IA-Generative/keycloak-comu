import { z } from 'zod'
import repo from '../../../repository'
import { guard, LEVEL } from '../../../guards/group.js'
import createResponseError from '~~/server/utils/error.js'

export const DeleteGroupDtoSchema = z.object({
  groupId: z.string(),
})
export type DeleteGroupDtoType = z.infer<typeof DeleteGroupDtoSchema>

export default defineEventHandler(async (event) => {
  const requestorId = event.context.user.sub
  const body = await readValidatedBody(event, body => DeleteGroupDtoSchema.parse(body))
  // Use userId to verify permissions to delete group
  const group = await repo.getGroupDetails(body.groupId)
  if (!group) {
    throw createResponseError({ statusCode: 404, data: 'GROUP_NOT_FOUND' })
  }
  guard({ requiredLevel: LEVEL.OWNER, group, requestorId })
  await repo.deleteGroup(body.groupId)
  return { message: `Group ${body.groupId} deleted successfully` }
})
