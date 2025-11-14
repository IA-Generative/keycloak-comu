import { z } from 'zod'

import repo from '../../../repository'
import type { UserRow } from '~~/server/repository/types.js'
import { safeText } from '~~/server/utils/input-cleaner.js'

export const ListQueryDtoSchema = z.object({
  search: safeText,
  exact: z.boolean().optional().default(false),
  page: z.number().min(0).optional().default(0),
  pageSize: z.number().min(1).max(100).optional().default(20),
})
export type ListQueryDtoType = z.infer<typeof ListQueryDtoSchema>

export default defineEventHandler(async (event): Promise<PaginatedResponse<{ id: string, name: string, owners: UserRow[] }>> => {
  const searchParam = await readValidatedBody(event, body => ListQueryDtoSchema.parse(body))

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
