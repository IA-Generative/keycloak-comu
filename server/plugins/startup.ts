import * as db from '../repository/pg'

import { setupKeycloakClient } from '../repository/keycloak'
import { retrieveGroupMetrics } from './metrics.js'

export default defineNitroPlugin(async () => {
  await db.getRealmId()
  await setupKeycloakClient()
  retrieveGroupMetrics()
})
