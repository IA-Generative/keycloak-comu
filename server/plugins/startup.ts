import * as db from '../repository/pg'
import { getKcClient, getRootGroup } from '../repository/keycloak'

export default defineNitroPlugin(async () => {
  await Promise.all([
    db.getRealmId(),
    getKcClient(),
    getRootGroup(),
  ])
})
