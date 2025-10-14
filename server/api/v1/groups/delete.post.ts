import { z } from 'zod'
import repo from '../../../repository'
import { guard, LEVEL } from '../../../guards/group.js'
import createResponseError from '~~/server/utils/error.js'

export const DeleteGroupDtoSchema = z.object({
  groupId: z.uuid({ error: 'INVALID_GROUP_ID' }),
})
export type DeleteGroupDtoType = z.infer<typeof DeleteGroupDtoSchema>

defineRouteMeta({
  openAPI: {
    description: 'Delete a group',
    tags: ['Groups'],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/GroupBody' },
        },
      },
    },
    responses: {
      200: {
        description: 'Group deleted successfully',
      },
    },
  },
})
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
