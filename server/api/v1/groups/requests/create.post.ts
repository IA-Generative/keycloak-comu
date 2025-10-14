import { z } from 'zod'
import repo from '../../../../repository'
import createResponseError from '~~/server/utils/error.js'
import { generateJoinRequestEmail } from '~~/server/composables/mailer/body-builder.js'
import { sendMail } from '~~/server/composables/mailer/client.js'

export const GroupInviteCreateDtoSchema = z.object({
  groupId: z.uuid({ error: 'INVALID_GROUP_ID' }),
})
export type GroupInviteDtoType = z.infer<typeof GroupInviteCreateDtoSchema>

defineRouteMeta({
  openAPI: {
    description: 'Request to join a group',
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
        description: 'User request to join group declined successfully',
        content: {
          'application/json': {
            schema: {
              type: 'string',
              enum: ['disabled', 'sent', 'sendFailed', 'accepted'],
              description: '\'disabled\' if mail sending is disabled, \'sent\' if the request has been sent and email is sent, \'sendFailed\' if the request is created but email sending failed, \'accepted\' if the user was automatically added to the group',
            },
          },
        },
      },
    },
  },
})
export default defineEventHandler(async (event): Promise<'disabled' | 'sent' | 'sendFailed' | 'accepted'> => {
  const body = await readValidatedBody(event, body => GroupInviteCreateDtoSchema.parse(body))

  const requestorId = event.context.user.sub as string
  // Use requestorId to verify permissions to invite to group
  const group = await repo.getGroupDetails(body.groupId)
  const requestor = await repo.getUserById(requestorId)
  if (!group) {
    throw createResponseError({ statusCode: 404, data: 'GROUP_NOT_FOUND' })
  }
  if (group.members.some(member => member.id === requestorId)) {
    throw createResponseError({ statusCode: 400, data: 'USER_ALREADY_MEMBER' })
  }
  if (group.invites.find(invite => invite.id === requestorId)) {
    await repo.uninviteMemberFromGroup(requestorId, body.groupId)
    await repo.addMemberToGroup(requestorId, body.groupId)
    return 'accepted'
  }
  await repo.requestJoinToGroup(requestorId, body.groupId)
  const emailBody = generateJoinRequestEmail(group, requestor!)
  const tos = group.members
    .filter(member => group.attributes.owner.includes(member.id) || group.attributes.admin.includes(member.id))
    .map(member => member.email)
  return sendMail({
    to: tos,
    subject: `Nouvelle demande pour rejoindre le groupe ${group.name}`,
    html: emailBody,
  })
})
