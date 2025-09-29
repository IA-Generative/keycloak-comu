// @ts-expect-error
import { Pool } from 'pg'
import { getRootGroup } from './keycloak.js'

const runtimeConfig = useRuntimeConfig()

const pool = new Pool({
  user: runtimeConfig.database.user,
  host: runtimeConfig.database.host,
  database: runtimeConfig.database.name,
  password: runtimeConfig.database.password,
  port: runtimeConfig.database.port ? Number.parseInt(runtimeConfig.database.port, 10) : 5432,
})

export function query(text: string, params: any[]) {
  return pool.query(text, params)
}

let realmId = ''
export async function getRealmId(): Promise<string> {
  if (realmId) return realmId
  const realmName = runtimeConfig.public.keycloakRealm
  if (!realmName) throw new Error('NUXT_PUBLIC_KEYCLOAK_REALM env var is not set')
  const res = await query('SELECT id FROM realm WHERE name = $1', [realmName])
  if (res.rows.length === 0) throw new Error(`Realm "${realmName}" not found`)
  realmId = res.rows[0].id
  return realmId
}

export interface GroupRow {
  id: string
  name: string
  parent_group: string
  realm_id: string
  type: number
}
async function defaultSearch(test: string, limit: number, skip: number): Promise<{ rows: GroupRow[] }> {
  return query(
    'SELECT * FROM keycloak_group WHERE name ILIKE $1 AND realm_id = $2 AND parent_group = $5 LIMIT $3 OFFSET $4',
    [`%${test}%`, await getRealmId(), limit + 1, skip, getRootGroup().id],
  ) as Promise<{ rows: GroupRow[] }>
}

async function pgTrgm(test: string, limit: number, skip: number): Promise<{ rows: GroupRow[] }> {
  return query(
    `SELECT *, (name ILIKE '%$1%')::int AS like_match,
       word_similarity($1, name) AS sim
     FROM keycloak_group
     WHERE (name ILIKE '%$1%' OR word_similarity($1, name) > 0.2) AND realm_id = $2 AND parent_group = $5
     ORDER BY like_match DESC, sim DESC
     LIMIT $3 OFFSET $4`,
    [test, await getRealmId(), limit + 1, skip, getRootGroup().id],
  ) as Promise<{ rows: GroupRow[] }>
}

// eslint-disable-next-line import/no-mutable-exports
export let searchFn: (test: string, limit: number, skip: number) => Promise<{ rows: GroupRow[] }> = defaultSearch

export async function setSearchFunction() {
  const res = await query(`SELECT EXISTS(
    SELECT 1
    FROM pg_extension
    WHERE extname = 'pg_trgm'
  );`, [])
  const pgTrgmInstalled = res.rows[0].exists
  if (pgTrgmInstalled) {
    searchFn = pgTrgm
  }
}

setSearchFunction()
