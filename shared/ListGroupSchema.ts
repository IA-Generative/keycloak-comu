import { z } from 'zod'
import GroupDtoSchema from './GroupSchema.js'

const ListedGroup = GroupDtoSchema.pick({ id: true, name: true, description: true })
export const ListGroupDtoSchema = z.object({
  joined: ListedGroup.array(),
  invited: ListedGroup.array(),
  requested: ListedGroup.array(),
})
export type ListGroupDtoType = z.infer<typeof ListGroupDtoSchema>

export default ListGroupDtoSchema
