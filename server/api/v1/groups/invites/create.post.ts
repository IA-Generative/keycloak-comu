import { z } from 'zod'
import repo from '../../../../repository'
import { guard, LEVEL } from '../../../../guards/group.js'
import createResponseError from '~~/server/utils/error.js'
import { sendMail } from '~~/server/composables/mailer/client.js'
import { generateGroupInviteEmail } from '~~/server/composables/mailer/body-builder.js'
import type { UserRow } from '~~/server/repository/types.js'

export const GroupInviteCreateDtoSchema = z.object({
  groupId: z.uuid({ error: 'INVALID_GROUP_ID' }),
  email: z.string().trim(),
})
export type GroupInviteDtoType = z.infer<typeof GroupInviteCreateDtoSchema>

defineRouteMeta({
  openAPI: {
    description: 'Invite a user to join a group',
    tags: ['Group Invites'],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/GroupAndEmailBody' },
        },
      },
    },
    responses: {
      200: {
        description: 'User invited to join group successfully',
        content: {
          'application/json': {
            schema: {
              type: 'string',
              enum: ['disabled', 'sent', 'sendFailed', 'merged', 'alreadyMember'],
              description: '\'disabled\' if mail sending is disabled, \'sent\' if the invite has been sent and email is sent, \'sendFailed\' if the invite is created but email sending failed, \'merged\' if the user had a pending request to join and is now added to the group, \'alreadyMember\' if the user is already a member of the group',
            },
          },
        },
      },
    },
  },
})
export default defineEventHandler(async (event): Promise<'disabled' | 'sent' | 'sendFailed' | 'merged' | 'alreadyMember'> => {
  const body = await readValidatedBody(event, body => GroupInviteCreateDtoSchema.parse(body))

  const requestorId = event.context.user.sub
  // Use requestorId to verify permissions to invite to group
  const group = await repo.getGroupDetails(body.groupId)
  const requestor = await repo.getUserById(requestorId) as UserRow
  const invitee = await repo.getUserByEmail(body.email)
  if (!invitee) {
    throw createResponseError({ statusCode: 404, data: 'USER_NOT_FOUND' })
  }
  guard({ requiredLevel: LEVEL.ADMIN, group, requestorId })
  if (!group) {
    throw createResponseError({ statusCode: 404, data: 'GROUP_NOT_FOUND' })
  }
  if (group.members.some(member => member.id === invitee.id)) {
    return 'alreadyMember'
  }

  if (group.requests.find(req => req.id === invitee.id)) {
    await repo.cancelRequestJoinToGroup(invitee.id, body.groupId)
    await repo.addMemberToGroup(invitee.id, body.groupId)
    return 'merged'
  }
  await repo.inviteMemberToGroup(invitee.id, body.groupId)
  return sendMail({
    to: body.email,
    subject: `Vous avez été invité à rejoindre le groupe ${group.name}`,
    html: generateGroupInviteEmail(group, requestor),
  })
})
