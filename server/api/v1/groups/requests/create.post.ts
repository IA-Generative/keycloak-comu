import { z } from 'zod'
import repo from '../../../../repository'
import createResponseError from '~~/server/utils/error.js'
import { generateJoinRequestEmail } from '~~/server/composables/mailer/body-builder.js'
import { sendMail } from '~~/server/composables/mailer/client.js'

export const GroupInviteCreateDtoSchema = z.object({
  groupId: z.uuid({ error: 'INVALID_GROUP_ID' }),
})
export type GroupInviteDtoType = z.infer<typeof GroupInviteCreateDtoSchema>

export default defineEventHandler(async (event) => {
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
    return
  }
  await repo.requestJoinToGroup(requestorId, body.groupId)
  const emailBody = generateJoinRequestEmail(group, requestor!)
  const tos = group.members
    .filter(member => group.attributes.owner.includes(member.id) || group.attributes.admin.includes(member.id))
    .map(member => member.email)
  await sendMail({
    to: tos,
    subject: `Nouvelle demande pour rejoindre le groupe ${group.name}`,
    html: emailBody,
  })
})
