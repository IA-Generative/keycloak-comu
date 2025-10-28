import { z } from 'zod'

export const LinkSchema = z.url({ message: 'INVALID_LINK_FORMAT' })
  .max(255, { message: 'LINK_TOO_LONG' })
  .describe('A link associated with the group')
