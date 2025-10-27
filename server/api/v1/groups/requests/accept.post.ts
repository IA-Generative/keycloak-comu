import { z } from 'zod'
import repo from '../../../../repository/index.js'
import createResponseError from '~~/server/utils/error.js'
import { guard, LEVEL } from '~~/server/guards/group.js'
import { sendMail } from '~~/server/composables/mailer/client.js'
import { generateJoinValidationEmail } from '~~/server/composables/mailer/body-builder.js'

export const AcceptGroupRequestDtoSchema = z.object({
  groupId: z.uuid({ error: 'INVALID_GROUP_ID' }),
  userId: z.uuid({ error: 'INVALID_USER_ID' }),
})
export type AcceptGroupRequestDtoType = z.infer<typeof AcceptGroupRequestDtoSchema>

export default defineEventHandler(async (event) => {
  const requestorId = event.context.user.sub

  const result = await readValidatedBody(event, body => AcceptGroupRequestDtoSchema.parse(body))
  const group = await repo.getGroupDetails(result.groupId)

  if (!group) {
    throw createResponseError({ statusCode: 404, data: 'GROUP_NOT_FOUND' })
  }
  guard({ requiredLevel: LEVEL.ADMIN, group, requestorId })

  if (!group.requests.find(req => req.id === result.userId)) {
    throw createResponseError({ statusCode: 400, data: 'USER_NOT_REQUESTING' })
  }
  await repo.addMemberToGroup(result.userId, result.groupId)
  await repo.cancelRequestJoinToGroup(result.userId, result.groupId)
  await repo.uninviteMemberFromGroup(result.userId, result.groupId)
  const emailBody = generateJoinValidationEmail(group)
  const acceptedUser = await repo.getUserById(result.userId)

  return sendMail({
    to: acceptedUser!.email,
    subject: `Votre demande pour rejoindre le groupe ${group.name} a été acceptée`,
    html: emailBody,
  })
})
