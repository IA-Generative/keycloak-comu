import { ref } from 'vue'
import { getBearerToken } from './useOidc'

const featureFlags = ref<string[]>([])
let featureFlagsIntervalId: ReturnType<typeof setInterval> | null = null

export async function loadFeatureFlags() {
  try {
    const token = await getBearerToken()
    const res = await fetch('/api/v1/feature-flags', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (res.ok) {
      featureFlags.value = await res.json()
    }
  } catch {
    // silently ignore — flags stay at defaults
  }
  if (featureFlagsIntervalId === null) {
    featureFlagsIntervalId = setInterval(loadFeatureFlags, 5 * 60 * 1000)
  }
}

export { featureFlags }
export default featureFlags
