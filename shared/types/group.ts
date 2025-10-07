import { z } from 'zod'

export const GroupNameSchema = z.string()
  .min(3, { message: 'Le nom doit faire au moins 3 caractères' })
  .max(50, { message: 'Le nom doit faire au maximum 50 caractères' })
  // Couvre quasiment tout ce qui est "imprimable" (hors contrôles comme \n, \t, etc.)
  .regex(/^[\p{L}\p{N}\p{P}\p{S}\p{Zs}]+$/u, { message: 'Caractères invalides' })
  .describe('Le nom du groupe')

export const CreateGroupDtoSchema = z.object({
  name: GroupNameSchema,
})

export type CreateGroupDtoType = z.infer<typeof CreateGroupDtoSchema>