import { z } from 'zod'
import repo from '../../../../repository'
import { guard, LEVEL } from '../../../../guards/group.js'
import createResponseError from '~~/server/utils/error.js'
import { sendMail } from '~~/server/composables/mailer/client.js'
import { generateGroupInviteEmail } from '~~/server/composables/mailer/body-builder.js'
import type { UserRow } from '~~/server/repository/types.js'
import { safeText } from '~~/server/utils/input-cleaner.js'

export const GroupInviteCreateDtoSchema = z.object({
  groupId: z.uuid({ error: 'INVALID_GROUP_ID' }),
  email: safeText,
})
export type GroupInviteDtoType = z.infer<typeof GroupInviteCreateDtoSchema>

export default defineEventHandler(async (event) => {
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
    return
  }

  if (group.requests.find(req => req.id === invitee.id)) {
    await repo.cancelRequestJoinToGroup(invitee.id, body.groupId)
    await repo.addMemberToGroup(invitee.id, body.groupId)
    return
  }
  await repo.inviteMemberToGroup(invitee.id, body.groupId)
  return sendMail({
    to: body.email,
    subject: `Vous avez été invité à rejoindre le groupe ${group.name}`,
    html: generateGroupInviteEmail(group, requestor),
  })
})
