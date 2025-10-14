import { z } from 'zod'
import repo from '../../../../repository/index.js'
import { guard, LEVEL } from '../../../../guards/group.js'

export const GroupInviteCancelDtoSchema = z.object({
  groupId: z.uuid({ error: 'INVALID_GROUP_ID' }),
  userId: z.uuid({ error: 'INVALID_USER_ID' }),
})
export type GroupInviteDtoType = z.infer<typeof GroupInviteCancelDtoSchema>

defineRouteMeta({
  openAPI: {
    description: 'Cancel an invite to join a group',
    tags: ['Group Invites'],
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
        description: 'User invite to join group cancelled successfully',
      },
    },
  },
})
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, body => GroupInviteCancelDtoSchema.parse(body))

  const requestorId = event.context.user.sub
  // Use requestorId to verify permissions to invite to group
  const group = await repo.getGroupDetails(body.groupId)

  guard({ requiredLevel: LEVEL.ADMIN, group, requestorId })

  await repo.uninviteMemberFromGroup(body.userId, body.groupId)
})
