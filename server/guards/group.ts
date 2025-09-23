import { createError } from 'nuxt/app'

interface Level {
  GUEST: 0
  MEMBER: 10
  ADMIN: 20
}

export interface GuardParams {
  level: Level
  groupId: string
  userId: string
}

export const UnknownGroupError = createError({
  statusCode: 400,
  message: 'Group not found',
})

// Pas encore implémenté
export async function guard({
  level,
  groupId,
  // userId,
}: GuardParams) {
  // Récupére le groupe auprès de la base de données
  // @ts-expect-error
  const group = await getGroupById(groupId)
  if (!group) {
    throw UnknownGroupError
  }

  // Vérifie si l'utilisateur a le niveau d'accès requis
  if (level < group.requiredLevel) {
    throw UnknownGroupError
  }
}
