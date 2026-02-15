import { z } from 'zod'
import GroupDtoSchema from './GroupSchema.js'
import { GlobalRequestSchema } from './types/global-request.js'

export const NotificationsDtoSchema = z.object({
  invites: GroupDtoSchema.pick({ id: true, name: true }).array(),
  requests: GlobalRequestSchema.array(),
})

export type NotificationsDtoType = z.infer<typeof NotificationsDtoSchema>
