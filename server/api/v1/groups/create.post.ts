import { z } from 'zod'
import repo from '../../../repository'
import type { GroupDtoType } from '~~/server/dto/group.js'

export const CreateGroupDtoSchema = z.object({
  name: z.string(),
  description: z.string().optional().nullable().default(null),
})
export type CreateGroupDtoType = z.infer<typeof CreateGroupDtoSchema>

export default defineEventHandler(async (event): Promise<GroupDtoType> => {
  const body = await readValidatedBody(event, body => CreateGroupDtoSchema.parse(body))

  const uniqueName = `${body.name}-${Date.now().toString(36)}`
  const group = await repo.createGroup(uniqueName, body.name, body.description)

  console.log(group)

  return group
})
