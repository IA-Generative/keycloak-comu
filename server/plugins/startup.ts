import * as db from '../repository/pg'

import { setupKeycloakClient } from '../repository/keycloak'
import { retrieveGroupMetrics } from '../composables/metrics.js'

export default defineNitroPlugin(async () => {
  await db.getRealmId()
  await setupKeycloakClient()
  retrieveGroupMetrics()
  setInterval(retrieveGroupMetrics, 10 * 1000) // every 10 seconds
})
