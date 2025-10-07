import * as db from '../repository/pg'

import { setupKeycloakClient } from '../repository/keycloak'

export default defineNitroPlugin(async () => {
  await db.getRealmId()
  setupKeycloakClient()
})
