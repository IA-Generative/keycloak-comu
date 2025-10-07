import { z } from 'zod'
import type TeamsDtoSchema from '../TeamSchema.js'

export const TeamNameSchema = z.string()
  .min(2, { error: 'TEAM_NAME_TOO_SHORT' })
  .max(15, { error: 'TEAM_NAME_TOO_LONG' })
  // Couvre quasiment tout ce qui est "imprimable" (hors contrôles comme \n, \t, etc.)
  .regex(/^[\p{L}\p{N}\p{P}\p{S}\p{Zs}]+$/u, { error: 'TEAM_NAME_INVALID_CHARACTERS' })
  .describe('Le nom du groupe')

export const CreateTeamDtoSchema = z.object({
  name: TeamNameSchema,
})

export type CreateTeamDtoType = z.infer<typeof CreateTeamDtoSchema>
export type TeamsDtoType = z.infer<typeof TeamsDtoSchema>