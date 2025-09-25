import type { GroupDetails } from '../repository/groups.js'
import createResponseError from '../utils/error.js'

export const LEVEL = {
  GUEST: 0,
  MEMBER: 10,
  ADMIN: 20,
} as const

type Level = typeof LEVEL[keyof typeof LEVEL]
export interface GuardParams {
  group: GroupDetails | null
  requestorId: string
  requiredLevel: Level
}

export const UnknownGroupError = createResponseError({ statusCode: 400, data: 'GROUP_NOT_FOUND' })

// Pas encore implémenté
export function guard({
  requiredLevel,
  group,
  requestorId,
}: GuardParams): Level {
  // Récupére le groupe auprès de la base de données
  if (!group) {
    throw UnknownGroupError
  }

  let requestorLevel: Level = LEVEL.GUEST

  if (group.members.some(member => member.id === requestorId)) {
    requestorLevel = LEVEL.MEMBER
  }
  if (group.attributes.owner.includes(requestorId)) {
    requestorLevel = LEVEL.ADMIN
  }
  if (requiredLevel >= LEVEL.ADMIN && (!group.attributes.owner.includes(requestorId))) {
    throw UnknownGroupError
  }
  // Vérifie si l'utilisateur a le niveau d'accès requis
  if (requestorLevel < requiredLevel) {
    throw UnknownGroupError
  }
  return requestorLevel
}
