interface ErrorMessages {
  [key: string]: {
    en: string
    fr: string
  }
}

const ERROR_MESSAGES = {
  GROUP_ALREADY_EXISTS: {
    en: 'A group with this name already exists',
    fr: 'Un groupe avec ce nom existe déjà',
  },
  TOKEN_MISSING: {
    en: 'Authorization token is missing',
    fr: 'Le jeton d\'autorisation est manquant',
  },
  TOKEN_MALFORMED: {
    en: 'Authorization token is malformed',
    fr: 'Le jeton d\'autorisation est mal formé',
  },
  TOKEN_INVALID: {
    en: 'Authorization token is invalid',
    fr: 'Le jeton d\'autorisation est invalide',
  },
  CANNOT_LEAVE_ONLY_OWNER: {
    en: 'Cannot leave group as the only owner. Please assign another owner before leaving.',
    fr: 'Impossible de quitter le groupe en tant que seul propriétaire. Veuillez attribuer un autre propriétaire avant de partir.',
  },
  CANNOT_KICK_SELF: {
    en: 'You cannot kick yourself from the group',
    fr: 'Vous ne pouvez pas vous expulser du groupe',
  },
  CANNOT_DEMOTE_ONLY_OWNER: {
    en: 'Cannot demote the only owner of the group',
    fr: 'Impossible de rétrograder le seul propriétaire du groupe',
  },
  USER_NOT_INVITED: {
    en: 'User not invited',
    fr: 'Utilisateur non invité',
  },
  GROUP_NOT_FOUND: {
    en: 'Group not found',
    fr: 'Groupe non trouvé',
  },
  USER_NOT_FOUND: {
    en: 'User not found',
    fr: 'Utilisateur non trouvé',
  },
  USER_ALREADY_IN_GROUP: {
    en: 'User is already in group',
    fr: 'L\'utilisateur est déjà dans le groupe',
  },
  USER_NOT_IN_GROUP: {
    en: 'User is not in group',
    fr: 'L\'utilisateur n\'est pas dans le groupe',
  },
  INVALID_GROUP_NAME: {
    en: 'Invalid group name',
    fr: 'Nom de groupe invalide',
  },
  INVALID_USER_ID: {
    en: 'Invalid user ID',
    fr: 'ID d\'utilisateur invalide',
  },
  KEYCLOAK_CONNECTION_ERROR: {
    en: 'Keycloak connection error',
    fr: 'Erreur de connexion à Keycloak',
  },
} as const satisfies ErrorMessages

export default ERROR_MESSAGES
