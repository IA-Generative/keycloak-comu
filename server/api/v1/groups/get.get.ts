import { groupDetailToDto } from '~~/server/utils/user-to-member.js'
import repo from '../../../repository'
import { guard, LEVEL } from '~~/server/guards/group.js'

defineRouteMeta({
  openAPI: {
    description: 'Test route description',
    tags: ['Groups'],
    responses: {
      200: {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/GroupDto' },
          },
        },
      },
    },
    parameters: [
      {
        name: 'id',
        in: 'query',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: 'The UUID of the group to retrieve',
      },
    ],
  },
})

export default defineEventHandler(async (event): Promise<GroupDtoType | null> => {
  const query = getQuery(event)
  const id = query.id
  if (!id || Array.isArray(id)) {
    return null
  }

  const group = await repo.getGroupDetails(id as string)

  if (!group) {
    return null
  }

  const userId = event.context.user.sub
  const requestorLevel = guard({ requiredLevel: LEVEL.GUEST, group, requestorId: userId })

  return groupDetailToDto(group, { userId, membershipLevel: requestorLevel })
})
