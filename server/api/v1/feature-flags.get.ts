import { featureFlags } from '~~/server/composables/feature-flags.js'

export default defineEventHandler(async () => {
  return Object.entries(featureFlags).filter(([, value]) => value).map(([key]) => key)
})
