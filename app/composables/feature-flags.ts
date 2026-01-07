import fetcher from './useApi.js'

const featureFlags = ref<string[]>([])
let featureFlagsIntervalId: ReturnType<typeof setInterval> | null = null

export async function loadFeatureFlags() {
  const flags = await fetcher('/api/v1/feature-flags')
  featureFlags.value = flags
  if (featureFlagsIntervalId === null) {
    featureFlagsIntervalId = setInterval(loadFeatureFlags, 5 * 60 * 1000) // every 5 minutes
  }
}

export default featureFlags
