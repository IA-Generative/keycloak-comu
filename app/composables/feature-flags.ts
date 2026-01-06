import fetcher from './useApi.js'

const featureFlags = ref<string[]>([])

export async function loadFeatureFlags() {
  const flags = await fetcher('/api/v1/feature-flags')
  featureFlags.value = flags
  setInterval(loadFeatureFlags, 5 * 60 * 1000) // every 5 minutes
}

export default featureFlags
