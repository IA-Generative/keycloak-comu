import type KeycloakAdminClient from '@keycloak/keycloak-admin-client'
import { realmName } from '../repository/utils.js'
import type prom from 'prom-client'

export const featureFlags = {
  userSettings: false,
}

export const internalFeatureFlags = {
  trgmSearch: false,
}

async function setUserSettingsFlag(kcClient: KeycloakAdminClient) {
  try {
    const components = await kcClient.components.find({
      type: 'org.keycloak.userprofile.UserProfileProvider',
      realm: realmName,
    })
    // Assume there is only one user profile component
    const candidateComponent = components[0]
    const config = JSON.parse(candidateComponent.config?.['kc.user.profile.config']?.[0] || '{}')
    featureFlags.userSettings = !!(config.unmanagedAttributePolicy && config.unmanagedAttributePolicy !== 'DISABLED')
  } catch (error) {
    console.error('Error fetching user profile component for feature flags \'userSettings\' :', error)
  }
}
export async function initFeatureFlags(kcClient: KeycloakAdminClient) {
  await setUserSettingsFlag(kcClient)
}

export function exportMetricsForFeatureFlags(metric: prom.Gauge<string>) {
  for (const [flag, enabled] of Object.entries(featureFlags)) {
    metric.set({ name: flag }, enabled ? 1 : 0)
  }
  for (const [flag, enabled] of Object.entries(internalFeatureFlags)) {
    metric.set({ name: flag }, enabled ? 1 : 0)
  }
}
