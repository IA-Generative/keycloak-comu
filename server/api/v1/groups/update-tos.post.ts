import repo from '../../../repository'
import { guard, LEVEL } from '../../../guards/group.js'
import createResponseError from '~~/server/utils/error.js'
import { z } from 'zod'
import { sendMail } from '~~/server/composables/mailer/client.js'
import { generateTermsUpdateEmail } from '~~/server/composables/mailer/body-builder.js'

const UpdateTosDtoSchema = z.object({
  groupId: z.uuid({ message: 'INVALID_GROUP_ID' }),
  tos: z.string().max(255, { message: 'TOS_TOO_LONG' }),
})

defineRouteMeta({
  openAPI: {
    description: 'Update the terms of service for a group',
    tags: ['Groups'],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/GroupAndTosBody' },
        },
      },
    },
    responses: {
      200: {
        description: 'Terms of service updated successfully',
      },
    },
  },
})
export default defineEventHandler(async (event) => {
  const requestorId = event.context.user.sub
  const { tos, groupId } = await readValidatedBody(event, body => UpdateTosDtoSchema.parse(body))
  // Use userId to verify permissions to delete group
  const group = await repo.getGroupDetails(groupId)
  if (!group) {
    throw createResponseError({ statusCode: 404, data: 'GROUP_NOT_FOUND' })
  }
  guard({ requiredLevel: LEVEL.ADMIN, group, requestorId })
  await repo.setTos(groupId, tos)
  if (group.tos === tos || !tos) {
    return
  }

  const body = generateTermsUpdateEmail(group, {
    date: new Date().toLocaleDateString('fr-FR'),
  })
  await sendMail({
    to: group.members.map(member => member.email).filter(email => !!email),
    subject: `Les conditions d'utilisation du groupe ${group.name} ont été mises à jour`,
    html: body,
  })
})
