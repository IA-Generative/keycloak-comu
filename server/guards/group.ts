import type { GroupDetails } from '../repository/groups.js'
import createResponseError from '../utils/error.js'
import type { XOR } from '../utils/types.js'

export const LEVEL = {
  GUEST: 0,
  MEMBER: 10,
  ADMIN: 20,
  OWNER: 30,
} as const

export type Level = typeof LEVEL[keyof typeof LEVEL]
export type GuardParams = {
  group: GroupDetails | null
  requestorId: string
} & XOR<{ requiredLevel: number }, { gtLevel: number }>

export const UnknownGroupError = createResponseError({ statusCode: 400, data: 'GROUP_NOT_FOUND' })

// Pas encore implémenté
export function guard({
  requiredLevel,
  gtLevel,
  group,
  requestorId,
}: GuardParams, customError?: Parameters<typeof createResponseError>[0]): Level {
  // Récupére le groupe auprès de la base de données
  if (!group) {
    throw UnknownGroupError
  }

  const minLevel = requiredLevel ?? (gtLevel! + 1) // +1 car on veut strictement supérieur
  let requestorLevel: Level = LEVEL.GUEST

  // find the requestor's level
  if (group.attributes.owner.includes(requestorId)) {
    // no future check needed, owner is always >= minLevel
    return LEVEL.ADMIN
  } else if (group.attributes.admin.includes(requestorId)) {
    requestorLevel = LEVEL.ADMIN
  } else if (group.members.some(member => member.id === requestorId)) {
    requestorLevel = LEVEL.MEMBER
  }

  // Vérifie si l'utilisateur a le niveau d'accès requis
  if (requestorLevel < minLevel) {
    if (customError) {
      throw createResponseError(customError)
    }
    throw UnknownGroupError
  }
  return requestorLevel
}
