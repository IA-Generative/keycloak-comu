import { z } from 'zod'

import repo from '../../../repository'
import type { GroupSearchDtoType } from '~~/shared/types/group.js'

export const searchBodyDtoSchema = z.object({
  search: z.string(),
  exact: z.boolean().optional().default(false),
  page: z.number().min(0).optional().default(0),
  pageSize: z.number().min(1).max(100).optional().default(20),
})
export type ListQueryDtoType = z.infer<typeof searchBodyDtoSchema>

defineRouteMeta({
  openAPI: {
    description: 'Search for groups',
    tags: ['Groups'],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/SearchGroupBody' },
        },
      },
    },
    responses: {
      200: {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PaginatedGroupSearchDto' },
          },
        },
      },
    },
  },
})

export default defineEventHandler(async (event): Promise<PaginatedResponse<GroupSearchDtoType>> => {
  const searchParam = await readValidatedBody(event, body => searchBodyDtoSchema.parse(body))

  // Search logic here
  const { groups, total, next } = await repo.searchGroups({
    query: searchParam.search,
    exact: searchParam.exact,
    skip: searchParam.page * searchParam.pageSize,
    limit: searchParam.pageSize,
  })
  return {
    results: groups.map(group => ({
      id: group.id,
      description: group.description ?? '',
      name: group.name,
      invites: [],
      members: [],
      owners: group.owners,
    })),
    page: searchParam.page,
    pageSize: searchParam.pageSize,
    total,
    next,
  }
})
