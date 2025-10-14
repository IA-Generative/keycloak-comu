import { z } from 'zod'
import type { UserDtoType } from './index.js'

export const GroupNameSchema = z.string()
  .min(3, { message: 'Le nom doit faire au moins 3 caractères' })
  .max(50, { message: 'Le nom doit faire au maximum 50 caractères' })
  // Couvre quasiment tout ce qui est "imprimable" (hors contrôles comme \n, \t, etc.)
  .regex(/^[\p{L}\p{N}\p{P}\p{S}\p{Zs}]+$/u, { message: 'Caractères invalides' })
  .describe('Le nom du groupe')

  export const GroupDescriptionSchema = z.string()
  .max(255, { message: 'La description doit faire au maximum 255 caractères' })
  .optional()
  .describe('La description du groupe')

export const CreateGroupDtoSchema = z.object({
  name: GroupNameSchema,
  description: GroupDescriptionSchema,
})

export const EditGroupDtoSchema = z.object({
  groupId: z.uuid({ error: 'INVALID_GROUP_ID' }),
  description: GroupDescriptionSchema,
})

export type CreateGroupDtoType = z.infer<typeof CreateGroupDtoSchema>
export type EditGroupDtoType = z.infer<typeof EditGroupDtoSchema>

export type GroupSearchDtoType = {
  id: string,
  name: string,
  owners: UserDtoType[],
  description: string
}