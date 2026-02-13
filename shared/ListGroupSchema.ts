import { z } from 'zod'
import GroupDtoSchema from './GroupSchema.js'

export const ListGroupDtoSchema = z.object({
  joined: GroupDtoSchema.pick({ id: true, name: true }).array(),
  requested: GroupDtoSchema.pick({ id: true, name: true }).array(),
})
export type ListGroupDtoType = z.infer<typeof ListGroupDtoSchema>

export default ListGroupDtoSchema
