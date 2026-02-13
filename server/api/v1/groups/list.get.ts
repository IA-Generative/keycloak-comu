import repo from '../../../repository'

export default defineEventHandler(async (event): Promise<ListGroupDtoType> => {
  // Search logic here
  const userId = event.context.user.sub
  const groups = await repo.listGroupsForUser(userId)

  return groups
})
