import { z } from 'zod'
import GroupDtoSchema from './GroupSchema.js'

export const ListGroupDtoSchema = z.object({
  joined: GroupDtoSchema.omit({ members: true, invites: true }).array(),
  invited: GroupDtoSchema.omit({ members: true, invites: true }).array(),
})
export type ListGroupDtoType = z.infer<typeof ListGroupDtoSchema>

export default ListGroupDtoSchema
