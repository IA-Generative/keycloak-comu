import { z } from 'zod'

export const CreateGroupDtoSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'Le nom doit faire au moins 3 caractères' })
    .max(10, { message: 'Le nom doit faire au maximum 10 caractères' })
    .regex(/^[\p{L}\p{N}\p{P}\p{S}\p{Zs}]+$/u, { message: 'Caractères invalides' })
    .describe('Le nom du groupe'),
    // Couvre quasiment tout ce qui est "imprimable" (hors contrôles comme \n, \t, etc.)
})

export type CreateGroupDtoType = z.infer<typeof CreateGroupDtoSchema>