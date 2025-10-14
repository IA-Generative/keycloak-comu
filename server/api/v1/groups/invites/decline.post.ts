import { z } from 'zod'
import repo from '../../../../repository/index.js'

export const DeclineGroupInviteDtoSchema = z.object({
  groupId: z.uuid({ error: 'INVALID_GROUP_ID' }),
})
export type DeclineGroupInviteDtoType = z.infer<typeof DeclineGroupInviteDtoSchema>

defineRouteMeta({
  openAPI: {
    description: 'Decline an invite to join a group',
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
        description: 'User invite to join group declined successfully',
      },
    },
  },
})
export default defineEventHandler(async (event) => {
  const userId = event.context.user.sub
  const body = await readValidatedBody(event, body => DeclineGroupInviteDtoSchema.parse(body))
  await repo.uninviteMemberFromGroup(userId, body.groupId)
})
