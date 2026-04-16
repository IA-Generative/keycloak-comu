import { ref, readonly } from 'vue'

interface AppConfig {
  appTitle: string
  version: string
  rootGroupPath: string
}

const state = ref<AppConfig>({
  appTitle: 'Keycloak Community',
  version: 'unknown',
  rootGroupPath: '/',
})

// Fetch starts immediately on first import; keeps defaults on error
fetch('/api/config')
  .then(res => (res.ok ? (res.json() as Promise<AppConfig>) : null))
  .then(data => {
    if (data) state.value = data
    if (state.value.rootGroupPath === '') state.value.rootGroupPath = '/'
    if (!state.value.appTitle) state.value.appTitle = 'Keycloak Community'
    if (!state.value.version) state.value.version = 'unknown'
    if (!state.value.rootGroupPath.endsWith('/')) state.value.rootGroupPath+='/'
  })
  .catch(() => {})

export function useAppConfig() {
  return readonly(state)
}
