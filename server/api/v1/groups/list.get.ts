import type { ListGroupDtoType } from '~~/shared/types/index.js'
import repo from '../../../repository'

defineRouteMeta({
  openAPI: {
    description: 'List groups the user is a member of, invited to, or has requested to join',
    tags: ['Groups'],
    responses: {
      200: {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ListGroupDto' },
          },
        },
      },
    },
  },
})
export default defineEventHandler(async (event): Promise<ListGroupDtoType> => {
  // Search logic here
  const userId = event.context.user.sub
  const { invited, joined, requested } = await repo.listGroupsForUser(userId)

  return {
    joined,
    invited,
    requested,
  }
})
