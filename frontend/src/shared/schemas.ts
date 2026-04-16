import { z } from 'zod'

export const GroupNameSchema = z.string()
  .min(3, { message: 'Le nom doit faire au moins 3 caractères' })
  .max(50, { message: 'Le nom doit faire au maximum 50 caractères' })
  .regex(/^[\p{L}\p{N}\p{P}\p{S}\p{Zs}]+$/u, { message: 'Caractères invalides' })
  .describe('Le nom du groupe')

export const CreateGroupDtoSchema = z.object({
  name: GroupNameSchema,
})

export const LinkSchema = z.string()
  .url({ message: 'INVALID_LINK_FORMAT' })
  .max(255, { message: 'LINK_TOO_LONG' })
  .describe('A link associated with the group')

export const TeamNameSchema = z.string()
  .min(2, { message: 'TEAM_NAME_TOO_SHORT' })
  .max(15, { message: 'TEAM_NAME_TOO_LONG' })
  .regex(/^[\p{L}\p{N}\p{P}\p{S}\p{Zs}]+$/u, { message: 'TEAM_NAME_INVALID_CHARACTERS' })
  .describe('Le nom du groupe')

export const yesNoOptions = [
  { label: 'Oui', value: true },
  { label: 'Non', value: false },
] as const
