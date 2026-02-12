import repo from '../../../repository'
import { guard, LEVEL } from '../../../guards/group.js'
import createResponseError from '~~/server/utils/error.js'

export default defineEventHandler(async (event) => {
  const requestorId = event.context.user.sub
  const { description, groupId } = await readValidatedBody(event, body => EditGroupDtoSchema.parse(body))
  // Use userId to verify permissions to delete group
  const group = await repo.getGroupDetails(groupId)
  if (!group) {
    throw createResponseError({ statusCode: 404, data: 'GROUP_NOT_FOUND' })
  }
  guard({ requiredLevel: LEVEL.ADMIN, group, requestorId })
  if (typeof description !== 'undefined') {
    await repo.editGroup(groupId, description, group.name)
  }
  return { message: `Group ${group.id} edited successfully` }
})
