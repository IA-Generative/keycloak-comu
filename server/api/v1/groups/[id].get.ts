import { guard, LEVEL } from '../../../guards/group.js'
import repo from '../../../repository'

export default defineEventHandler(async (event): Promise<GroupDtoType | null> => {
  const requestorId = event.context.user.sub
  const params = getRouterParams(event)

  const group = await repo.getGroupDetails(params.id as string)

  const requestorLevel = guard({ requiredLevel: LEVEL.GUEST, group, requestorId })

  return {
    ...group!,
    invites: requestorLevel >= LEVEL.ADMIN ? group!.invites : [],
    members: requestorLevel >= LEVEL.MEMBER ? group!.members : [],
    owners: group!.members.filter(member => group!.attributes.owner?.includes(member.id)),
  }
})
