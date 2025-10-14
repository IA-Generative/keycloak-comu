import { z } from 'zod'
import repo from '../../../../repository/index.js'
import createResponseError from '~~/server/utils/error.js'

export const AcceptGroupInviteDtoSchema = z.object({
  groupId: z.uuid({ error: 'INVALID_GROUP_ID' }),
})
export type AcceptGroupInviteDtoType = z.infer<typeof AcceptGroupInviteDtoSchema>

defineRouteMeta({
  openAPI: {
    description: 'Accept an invite to join a group',
    tags: ['Group Invites'],
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
        description: 'User invite to join group accepted successfully',
      },
    },
  },
})
export default defineEventHandler(async (event) => {
  const userId = event.context.user.sub

  const result = await readValidatedBody(event, body => AcceptGroupInviteDtoSchema.parse(body))
  const group = await repo.getGroupDetails(result.groupId)

  if (!group) {
    throw createResponseError({ statusCode: 404, data: 'GROUP_NOT_FOUND' })
  }

  if (!group.attributes.invite.includes(userId)) {
    throw createResponseError({ statusCode: 403, data: 'USER_NOT_INVITED' })
  }
  await repo.addMemberToGroup(userId, result.groupId)
  await repo.uninviteMemberFromGroup(userId, result.groupId)
  await repo.cancelRequestJoinToGroup(userId, result.groupId)
})
