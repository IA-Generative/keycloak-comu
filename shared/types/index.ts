import { z } from 'zod';
import type GroupDtoSchema from '../GroupSchema.js';
import type UserDtoSchema from '../UserSchema.js';
import type ListGroupDtoSchema from '../ListGroupSchema.js';
import type ERROR_MESSAGES from '../ErrorMessages.js';

export type GroupDtoType = z.infer<typeof GroupDtoSchema>
export type ListGroupDtoType = z.infer<typeof ListGroupDtoSchema>
export type UserDtoType = z.infer<typeof UserDtoSchema>
export interface PaginatedResponse<T> {
  results: T[]
  total: number
  page: number
  pageSize: number
}

export type ErrorMessageKeys = keyof typeof ERROR_MESSAGES