import type { NotificationsDtoType } from '~~/shared/NotificationsDtoSchema.js'
import repo from '../../repository'

export default defineEventHandler(async (event): Promise<NotificationsDtoType> => {
  // Search logic here
  const userId = event.context.user.sub
  return repo.notificationsForUser(userId)
})
