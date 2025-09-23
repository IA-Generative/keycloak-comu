import { z } from 'zod'
import repo from '../../../repository'

export const CreateGroupDtoSchema = z.object({
  name: z.string(),
})
export type CreateGroupDtoType = z.infer<typeof CreateGroupDtoSchema>

export default defineEventHandler(async (event): Promise<Pick<GroupDtoType, 'id' | 'name'>> => {
  const session = event.context

  const body = await readValidatedBody(event, body => CreateGroupDtoSchema.parse(body))

  const group = await repo.createGroup(body.name)
  await repo.addMemberToGroup(session.user.sub, group.id)
  await repo.addOwnerToGroup(session.user.sub, group.id)
  const detailedGroup = await repo.getGroupDetails(group.id)

  return detailedGroup!
})
