import * as db from '../repository/pg'

import { setupKeycloakClient } from '../repository/keycloak'
import { noticeGroupExpiringInLessThan } from '../composables/expires.js'

const config = useRuntimeConfig()
export default defineNitroPlugin(async () => {
  await db.getRealmId()
  await setupKeycloakClient()

  if (config.smtp.enable) {
    noticeGroupExpiringInLessThan(30)
    // check every 12 hours
    setTimeout(() => noticeGroupExpiringInLessThan(30), 12 * 60 * 60 * 1000) // Delay to allow Keycloak to start
  }
})
