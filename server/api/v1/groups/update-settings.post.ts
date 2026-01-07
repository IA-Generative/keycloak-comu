import repo from '../../../repository'
import { guard, LEVEL } from '../../../guards/group.js'
import createResponseError from '~~/server/utils/error.js'
import { z } from 'zod'
import GroupSettingsDtoSchema from '~~/shared/GroupSettingsSchema.js'

const UpdateGroupSettingsDtoSchema = z.object({
  groupId: z.uuid({ message: 'INVALID_GROUP_ID' }),
  settings: GroupSettingsDtoSchema.partial(),
})
export default defineEventHandler(async (event) => {
  const requestorId = event.context.user.sub

  const { groupId, settings } = await readValidatedBody(event, body => UpdateGroupSettingsDtoSchema.parse(body))
  // Use userId to verify permissions to delete group
  const group = await repo.getGroupDetails(groupId)
  if (!group) {
    throw createResponseError({ statusCode: 404, data: 'GROUP_NOT_FOUND' })
  }

  guard({ requiredLevel: LEVEL.ADMIN, group, requestorId })

  await repo.setGroupSettings(groupId, settings)
})
