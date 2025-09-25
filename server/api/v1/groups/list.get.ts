import repo from '../../../repository'

export default defineEventHandler(async (event): Promise<ListGroupDtoType> => {
  // Search logic here
  const userId = event.context.user.sub
  const { invited, joined } = await repo.listGroupsForUser(userId)

  return {
    joined,
    invited,
  }
})
