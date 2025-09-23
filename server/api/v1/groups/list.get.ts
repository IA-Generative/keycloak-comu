import repo from '../../../repository'

export default defineEventHandler(async (event): Promise<ListGroupDtoType> => {
  // Search logic here
  const userId = event.context.user.sub
  const { invited, joined } = await repo.listGroupsForUser(userId)

  return {
    joined: joined.map((group): GroupDtoType => ({
      id: group.id,
      name: group.name,
      invites: [],
      members: [],
      owners: [],
    })),
    invited: invited.map((group): GroupDtoType => ({
      id: group.id,
      name: group.name,
      invites: [],
      members: [],
      owners: [],
    })),
  }
})
