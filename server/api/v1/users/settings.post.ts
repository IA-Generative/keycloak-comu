import repo from '../../../repository/index.js'

export default defineEventHandler(async (event) => {
  const userId = event.context.user.sub
  const settings = await readValidatedBody(event, body => UserSettingsSchema.parse(body))

  await repo.setUserSettings(userId, settings)
})
