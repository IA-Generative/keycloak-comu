// @ts-expect-error
import { Pool } from 'pg'

const pool = new Pool({
  user: 'keycloak',
  host: 'localhost',
  database: 'keycloak',
  password: 'password',
  port: 5432,
})

export function query(text: string, params: any[]) {
  return pool.query(text, params)
}

let realmId = ''
export async function getRealmId(): Promise<string> {
  if (realmId) return realmId
  const realmName = process.env.KEYCLOAK_REALM
  if (!realmName) throw new Error('KEYCLOAK_REALM env var is not set')
  const res = await query('SELECT id FROM realm WHERE name = $1', [realmName])
  if (res.rows.length === 0) throw new Error(`Realm "${realmName}" not found`)
  realmId = res.rows[0].id
  return realmId
}
