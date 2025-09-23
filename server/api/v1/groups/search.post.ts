import { z } from 'zod'
import type { GroupDtoType } from '~~/server/dto/group.js'
import type { PaginatedResponse } from '~~/server/dto/utils.js'
import repo from '../../../repository'

export const ListQueryDtoSchema = z.object({
  search: z.string(),
  page: z.number().min(1).optional().default(1),
  pageSize: z.number().min(1).max(100).optional().default(20),
})
export type ListQueryDtoType = z.infer<typeof ListQueryDtoSchema>

export default defineEventHandler(async (event): Promise<PaginatedResponse<GroupDtoType>> => {
  const searchParam = await readValidatedBody(event, body => ListQueryDtoSchema.parse(body))

  // Search logic here
  const { groups, total } = await repo.searchGroups(searchParam.search, (searchParam.page - 1) * searchParam.pageSize, searchParam.pageSize)
  return {
    results: groups.map(group => ({
      id: group.id,
      name: group.name,
      description: group.description,
    })),
    page: searchParam.page,
    pageSize: searchParam.pageSize,
    total,
  }
})
