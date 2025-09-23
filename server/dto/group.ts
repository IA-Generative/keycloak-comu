import { z } from 'zod'
import { UserDtoSchema } from './user.js'

export const GroupDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  // If no label is provided, the name will be used as label
  label: z.string().optional(),
  description: z.string().nullable(),
  path: z.string().optional(),
  members: z.array(UserDtoSchema).optional(),
  invites: z.array(UserDtoSchema).optional(),
  owners: z.array(UserDtoSchema).optional(),
})
export type GroupDtoType = z.infer<typeof GroupDtoSchema>
