import repo from '../../../repository'
import { guard, LEVEL } from '../../../guards/group.js'
import createResponseError from '~~/server/utils/error.js'
import z from 'zod'

const RenewGroupDtoSchema = z.object({
  groupId: z.uuid({ message: 'INVALID_GROUP_ID' }),
  timestamp: z.string()
    .regex(/^\d{13}$/, { message: 'INVALID_TIMESTAMP' })
    .min(1, { message: 'INVALID_TIMESTAMP' }),
})
export default defineEventHandler(async (event) => {
  const requestorId = event.context.user.sub
  const { timestamp, groupId } = await readValidatedBody(event, body => RenewGroupDtoSchema.parse(body))
  // Use userId to verify permissions to delete group
  const group = await repo.getGroupDetails(groupId)
  if (!group) {
    throw createResponseError({ statusCode: 404, data: 'GROUP_NOT_FOUND' })
  }
  guard({ requiredLevel: LEVEL.ADMIN, group, requestorId })

  const newTimestamp = new Date(timestamp).getTime()
  const minTimestamp = new Date().getTime() + 30 * 24 * 60 * 60 * 1000 // Extend by min 30 days

  if (newTimestamp < minTimestamp) {
    throw createResponseError({ statusCode: 400, data: 'INVALID_TIMESTAMP' })
  }

  const maxTimestamp = new Date(group.expiresAt).getTime() + 365 * 24 * 60 * 60 * 1000 // Extend by max 1 year

  if (new Date(timestamp).getTime() > maxTimestamp) {
    throw createResponseError({ statusCode: 400, data: 'INVALID_TIMESTAMP' })
  }

  await repo.renewGroup(groupId, timestamp)
  return { message: `Group ${group.id} renewed successfully` }
})
