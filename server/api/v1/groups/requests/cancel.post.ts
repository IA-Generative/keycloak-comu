import { z } from 'zod'
import repo from '../../../../repository/index.js'
import createResponseError from '~~/server/utils/error.js'

export const GroupInviteCancelDtoSchema = z.object({
  groupId: z.uuid({ error: 'INVALID_GROUP_ID' }),
})
export type GroupInviteDtoType = z.infer<typeof GroupInviteCancelDtoSchema>

defineRouteMeta({
  openAPI: {
    description: 'Cancel a request to join a group',
    tags: ['Group Requests'],
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
        description: 'User request to join group cancelled successfully',
      },
    },
  },
})
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, body => GroupInviteCancelDtoSchema.parse(body))

  const requestorId = event.context.user.sub
  // Use requestorId to verify permissions to invite to group
  const group = await repo.getGroupDetails(body.groupId)
  if (!group) {
    throw createResponseError({ statusCode: 404, data: 'GROUP_NOT_FOUND' })
  }

  if (!group.requests.find(request => request.id === requestorId)) {
    throw createResponseError({ statusCode: 403, data: 'USER_NOT_REQUESTING' })
  }

  await repo.cancelRequestJoinToGroup(requestorId, body.groupId)
})
