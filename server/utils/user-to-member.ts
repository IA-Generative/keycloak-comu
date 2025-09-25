import { LEVEL } from '../guards/group.js'
import type { Level } from '../guards/group.js'
import type { GroupDetails } from '../repository/groups.js'

function findMembershipLevel(
  group: GroupDetails,
  userId: string,
): number {
  if (group.attributes.owner.includes(userId)) {
    return LEVEL.OWNER
  }
  if (group.attributes.admin.includes(userId)) {
    return LEVEL.ADMIN
  }
  if (group.members.some(member => member.id === userId)) {
    return LEVEL.MEMBER
  }
  return LEVEL.GUEST
}

export function groupDetailToDto(group: GroupDetails, requestorLevel: Level): GroupDtoType {
  const { id, name, members, invites } = group

  let membersWithLevel = members.map(member => ({
    ...member,
    membershipLevel: findMembershipLevel(group, member.id),
  }))

  if (requestorLevel < LEVEL.GUEST) {
    membersWithLevel = membersWithLevel.filter(member => member.membershipLevel >= LEVEL.ADMIN)
  }

  return {
    id,
    name,
    members: membersWithLevel,
    invites,
  }
}
