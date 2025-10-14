import { z } from 'zod'
import repo from '../../../repository'
import { guard, LEVEL } from '../../../guards/group.js'
import createResponseError from '~~/server/utils/error.js'

export const DeleteTeamDtoSchema = z.object({
  parentId: z.uuid({ error: 'INVALID_GROUP_ID' }),
  name: z.string(),
})
export type DeleteTeamDtoType = z.infer<typeof DeleteTeamDtoSchema>

defineRouteMeta({
  openAPI: {
    description: 'Delete a team (child group)',
    tags: ['Groups'],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/GroupAndTeamBody' },
        },
      },
    },
    responses: {
      200: {
        description: 'Team deleted successfully',
      },
    },
  },
})
export default defineEventHandler(async (event) => {
  const requestorId = event.context.user.sub
  const body = await readValidatedBody(event, body => DeleteTeamDtoSchema.parse(body))
  // Use userId to verify permissions to delete group
  const group = await repo.getGroupDetails(body.parentId)
  if (!group) {
    throw createResponseError({ statusCode: 404, data: 'GROUP_NOT_FOUND' })
  }
  guard({ requiredLevel: LEVEL.ADMIN, group, requestorId })
  await repo.deleteTeam(body.parentId, body.name)
})
