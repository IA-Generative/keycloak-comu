interface ErrorMessages {
  [key: string]: {
    en: string
    fr: string
  }
}

const ERROR_MESSAGES = {
  TEAM_NAME_TOO_SHORT: {
    en: 'The name must be at least 2 characters long',
    fr: 'Le nom doit faire au moins 2 caractères',
  },
  TEAM_NAME_TOO_LONG: {
    en: 'The name must be at most 15 characters long',
    fr: 'Le nom doit faire au maximum 15 caractères',
  },
  TEAM_NAME_INVALID_CHARACTERS: {
    en: 'The name contains invalid characters',
    fr: 'Le nom contient des caractères invalides',
  },
  USER_ALREADY_MEMBER: {
    en: 'User is already a member of the group',
    fr: 'L\'utilisateur est déjà membre du groupe',
  },
  USER_NOT_REQUESTING: {
    en: 'User is not requesting to join the group',
    fr: 'L\'utilisateur ne demande pas à rejoindre le groupe',
  },
  USER_ALREADY_REQUESTING: {
    en: 'User is already requesting to join the group',
    fr: 'L\'utilisateur demande déjà à rejoindre le groupe',
  },
  UNKNOWN_ERROR: {
    en: 'An unknown error occurred',
    fr: 'Une erreur inconnue est survenue',
  },
  INVALID_GROUP_ID: {
    en: 'Invalid group ID',
    fr: 'ID de groupe invalide',
  },
  INVALID_LEVEL: {
    en: 'Invalid level',
    fr: 'Niveau invalide',
  },
  INVALID_USER_ID: {
    en: 'Invalid user ID',
    fr: 'ID d\'utilisateur invalide',
  },
  CANNOT_KICK_USER_WITHOUT_RIGHTS: {
    en: 'You do not have the rights to kick a user from this group',
    fr: 'Vous n\'avez pas les droits pour expulser un utilisateur de ce groupe',
  },
  CANNOT_KICK_USER_SAME_LEVEL: {
    en: 'Cannot kick a user with the same or higher access level than yours',
    fr: 'Impossible d\'expulser un utilisateur avec le même niveau d\'accès ou un niveau supérieur au vôtre',
  },
  CANNOT_GRANT_AT_LEVEL_EQ_TO_YOURS: {
    en: 'Cannot grant a user an access level equal to yours',
    fr: 'Impossible d\'accorder à un utilisateur un niveau d\'accès égal au vôtre',
  },
  CANNOT_DEMOTE_USER_WITH_HIGER_LEVEL: {
    en: 'Cannot demote a user with a higher access level than yours',
    fr: 'Impossible de rétrograder un utilisateur avec un niveau d\'accès supérieur au vôtre',
  },
  VALIDATION_ERROR: {
    en: 'Validation error',
    fr: 'Erreur de validation',
  },
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
  KEYCLOAK_CONNECTION_ERROR: {
    en: 'Keycloak connection error',
    fr: 'Erreur de connexion à Keycloak',
  },
} as const satisfies ErrorMessages

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES
export default ERROR_MESSAGES
