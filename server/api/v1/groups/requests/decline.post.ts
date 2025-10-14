import { z } from 'zod'
import repo from '../../../../repository/index.js'
import createResponseError from '~~/server/utils/error.js'
import { guard, LEVEL } from '~~/server/guards/group.js'

export const DeclineGroupInviteDtoSchema = z.object({
  groupId: z.uuid({ error: 'INVALID_GROUP_ID' }),
  userId: z.uuid({ error: 'INVALID_USER_ID' }),
})
export type DeclineGroupInviteDtoType = z.infer<typeof DeclineGroupInviteDtoSchema>

defineRouteMeta({
  openAPI: {
    description: 'Decline a user request to join a group',
    tags: ['Group Requests'],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/GroupAndUserBody' },
        },
      },
    },
    responses: {
      200: {
        description: 'User request to join group declined successfully',
      },
    },
  },
})
export default defineEventHandler(async (event) => {
  const userId = event.context.user.sub
  const body = await readValidatedBody(event, body => DeclineGroupInviteDtoSchema.parse(body))
  const group = await repo.getGroupDetails(body.groupId)
  if (!group) {
    throw createResponseError({ statusCode: 404, data: 'GROUP_NOT_FOUND' })
  }
  guard({ requiredLevel: LEVEL.ADMIN, group, requestorId: userId })
  await repo.cancelRequestJoinToGroup(body.userId, body.groupId)
})
