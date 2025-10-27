import { groupDetailToDto } from '~~/server/utils/user-to-member.js'
import repo from '../../../repository'
import { guard, LEVEL } from '~~/server/guards/group.js'

export default defineEventHandler(async (event): Promise<GroupDtoType | null> => {
  const params = getRouterParams(event)

  const group = await repo.getGroupDetails(params.id as string)

  if (!group) {
    return null
  }

  const userId = event.context.user.sub
  const requestorLevel = guard({ requiredLevel: LEVEL.GUEST, group, requestorId: userId })

  return groupDetailToDto(group, { userId, membershipLevel: requestorLevel })
})
