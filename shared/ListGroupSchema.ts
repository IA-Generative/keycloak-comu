import { z } from 'zod'
import GroupDtoSchema from './GroupSchema.js'

export const ListGroupDtoSchema = z.object({
  joined: GroupDtoSchema.array(),
  invited: GroupDtoSchema.array(),
})
export type ListGroupDtoType = z.infer<typeof ListGroupDtoSchema>

export default ListGroupDtoSchema
