import { ZodError } from 'zod'
import repo from '../../../repository'
import createResponseError from '~~/server/utils/error.js'
import { LEVEL } from '~~/server/guards/group.js'

export default defineEventHandler(async (event): Promise<Pick<GroupDtoType, 'id' | 'name'>> => {
  const session = event.context

  let body
  try {
    body = await readValidatedBody(event, b => CreateGroupDtoSchema.parse(b))
  } catch (err: any) {
    if (err instanceof ZodError) {
      throw createResponseError({ statusCode: 400, data: 'VALIDATION_ERROR' })
    }
    throw err
  }

  const existingGroup = await repo.getGroupByName(body.name)
  if (existingGroup) {
    throw createResponseError({ statusCode: 409, data: 'GROUP_ALREADY_EXISTS' })
  }

  const group = await repo.createGroup(body.name)
  await repo.addMemberToGroup(session.user.sub, group.id)
  await repo.setUserLevelInGroup(session.user.sub, group.id, LEVEL.OWNER)
  const detailedGroup = await repo.getGroupDetails(group.id)

  return detailedGroup!
})
