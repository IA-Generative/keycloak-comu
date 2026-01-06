import repo from '../../../repository/index.js'

export default defineEventHandler(async (event) => {
  const userId = event.context.user.sub

  return repo.getUserSettings(userId)
})
