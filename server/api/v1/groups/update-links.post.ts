import repo from '../../../repository'
import { guard, LEVEL } from '../../../guards/group.js'
import createResponseError from '~~/server/utils/error.js'
import { z } from 'zod'

const UpdateLinksDtoSchema = z.object({
  groupId: z.uuid({ message: 'INVALID_GROUP_ID' }),
  links: LinkSchema.array(),
})

export default defineEventHandler(async (event) => {
  const requestorId = event.context.user.sub
  const { links, groupId } = await readValidatedBody(event, body => UpdateLinksDtoSchema.parse(body))
  // Use userId to verify permissions to delete group
  const group = await repo.getGroupDetails(groupId)
  if (!group) {
    throw createResponseError({ statusCode: 404, data: 'GROUP_NOT_FOUND' })
  }
  guard({ requiredLevel: LEVEL.ADMIN, group, requestorId })
  await repo.setLinks(groupId, links)
})
