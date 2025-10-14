import { z } from 'zod'
import repo from '../../../../repository/index.js'
import { guard, LEVEL } from '../../../../guards/group.js'
import createResponseError from '~~/server/utils/error.js'

export const LeaveGroupDtoSchema = z.object({
  groupId: z.uuid({ error: 'INVALID_GROUP_ID' }),
})
export type LeaveGroupDtoType = z.infer<typeof LeaveGroupDtoSchema>

defineRouteMeta({
  openAPI: {
    description: 'Leave a group',
    tags: ['Group Membership'],
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
        description: 'User left group successfully',
      },
    },
  },
})
export default defineEventHandler(async (event) => {
  const requestorId = event.context.user.sub
  const body = await readValidatedBody(event, body => LeaveGroupDtoSchema.parse(body))
  const group = await repo.getGroupDetails(body.groupId)
  if (!group) {
    throw createResponseError({ statusCode: 404, data: 'GROUP_NOT_FOUND' })
  }
  guard({ requiredLevel: LEVEL.MEMBER, group, requestorId })
  // If the user is the last member, delete the group
  if (group.members.length > 1 && group.attributes.owner.length === 1 && group.attributes.owner[0] === requestorId) {
    throw createResponseError({ statusCode: 400, data: 'CANNOT_LEAVE_ONLY_OWNER' })
  }
  if (group.members.length <= 1) {
    await repo.deleteGroup(group.id)
    return
  }
  await repo.kickMemberFromGroup(requestorId, group)
  await repo.setUserLevelInGroup(requestorId, body.groupId, LEVEL.GUEST)
})
