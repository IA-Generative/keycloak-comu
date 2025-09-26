import repo from '../../../repository'
import createResponseError from '~~/server/utils/error.js'

export default defineEventHandler(async (event): Promise<Pick<GroupDtoType, 'id' | 'name'>> => {
  const session = event.context

  const payload = await readBody(event)
  const parseResult = CreateGroupDtoSchema.safeParse(payload)
  if (!parseResult.success) {
    throw createResponseError({ statusCode: 400, data: 'VALIDATION_ERROR' })
  }

  const body = parseResult.data

  const existingGroup = await repo.getGroupByName(body.name)
  if (existingGroup) {
    throw createResponseError({ statusCode: 409, data: 'GROUP_ALREADY_EXISTS' })
  }

  const group = await repo.createGroup(body.name)
  await repo.addMemberToGroup(session.user.sub, group.id)
  await repo.addOwnerToGroup(session.user.sub, group.id)
  const detailedGroup = await repo.getGroupDetails(group.id)

  if (!detailedGroup) {
    return { id: group.id, name: group.name }
  }
  return { id: detailedGroup.id, name: detailedGroup.name }

  // return detailedGroup!
})
