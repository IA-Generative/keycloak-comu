import { z } from 'zod'

import repo from '../../../repository'
import type { UserRow } from '~~/server/repository/types.js'
import { safeText } from '~~/server/utils/input-cleaner.js'

export const ListUsersQueryDtoSchema = z.object({
  search: safeText,
  excludeGroupId: z.string().uuid().optional(),
})
export type ListQueryDtoType = z.infer<typeof ListUsersQueryDtoSchema>

export default defineEventHandler(async (event): Promise<UserRow[]> => {
  const searchParam = await readValidatedBody(event, body => ListUsersQueryDtoSchema.parse(body))

  // Search logic here
  const users = await repo.searchUsers({ query: searchParam.search, excludeGroupId: searchParam.excludeGroupId })

  return users
})
