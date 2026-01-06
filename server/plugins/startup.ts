import * as db from '../repository/pg'

import { kcClient, setupKeycloakClient } from '../repository/keycloak'
import { retrieveGroupMetrics } from '../composables/metrics.js'
import { initFeatureFlags } from '../composables/feature-flags.js'

export default defineNitroPlugin(async () => {
  await db.getRealmId()
  await setupKeycloakClient()
  await initFeatureFlags(kcClient)
  retrieveGroupMetrics()
  setInterval(retrieveGroupMetrics, 10 * 1000) // every 10 seconds
})
