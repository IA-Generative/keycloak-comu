import { z } from 'zod'
import repo from '../../../repository'
import { guard, LEVEL } from '../../../guards/group.js'
import createResponseError from '~~/server/utils/error.js'
import { TeamNameSchema } from '~~/shared/types/team.js'

export const CreateTeamDtoSchema = z.object({
  parentId: z.uuid({ error: 'INVALID_GROUP_ID' }),
  name: z.string(),
  userIds: z.array(z.uuid()).optional(),
})

export default defineEventHandler(async (event) => {
  const requestorId = event.context.user.sub
  const body = await readValidatedBody(event, body => CreateTeamDtoSchema.parse(body))
  // Use userId to verify permissions to edit group
  const parentGroup = await repo.getGroupDetails(body.parentId)
  if (!parentGroup) {
    throw createResponseError({ statusCode: 404, data: 'GROUP_NOT_FOUND' })
  }
  guard({ requiredLevel: LEVEL.ADMIN, group: parentGroup, requestorId })

  let childGroup: ({ id: string } | undefined) = parentGroup.teams.find(g => g.name === body.name)
  // Fetch potential team and create if not exists
  if (!childGroup) {
    TeamNameSchema.parse(body.name) // re-validate name with team schema

    childGroup = await repo.createGroup(body.name, body.parentId)
  }

  if (body.userIds) {
    // ensure userIds are members of parent group, otherwise strip them
    const validUserIds = body.userIds.filter(userId => parentGroup.members.find(member => member.id === userId))

    // apply userIds to group by passing child group
    return repo.ensureMembersForChildGroup(childGroup.id, validUserIds)
  }
})
