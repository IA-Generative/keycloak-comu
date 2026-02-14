// @ts-expect-error
import { Pool } from 'pg'
import { getRootGroup } from './keycloak.js'
import type { UserRow } from './types.js'
import { internalFeatureFlags } from '../composables/feature-flags.js'

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
  const realmName = runtimeConfig.public.keycloak.realm
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
async function defaultGroupSearch(test: string, limit: number, skip: number): Promise<{ rows: GroupRow[] }> {
  return query(
    'SELECT * FROM keycloak_group WHERE name ILIKE $1 AND realm_id = $2 AND parent_group = $5 LIMIT $3 OFFSET $4',
    [`%${test}%`, await getRealmId(), limit + 1, skip, getRootGroup().id],
  ) as Promise<{ rows: GroupRow[] }>
}

async function defaultUserSearch(test: string, limit: number, skip: number, excludedUsers: string[]): Promise<{ rows: UserRow[] }> {
  return query(
    `SELECT first_name, last_name, email, id, username FROM user_entity WHERE (
      email ILIKE $1 OR
      first_name ILIKE $1 OR
      last_name ILIKE $1
    ) AND realm_id = $2 AND id != ALL($5)
    LIMIT $3
    OFFSET $4`,
    [`%${test}%`, await getRealmId(), limit + 1, skip, excludedUsers],
  ) as Promise<{ rows: UserRow[] }>
}

async function searchGroupTrgm(test: string, limit: number, skip: number): Promise<{ rows: GroupRow[] }> {
  return query(
    `SELECT *, (name ILIKE '%$1%')::int AS like_match,
       word_similarity($1, name) AS sim
    FROM keycloak_group
    WHERE (
      name ILIKE '%$1%' OR word_similarity($1, name) > 0.2
    ) AND realm_id = $2 AND parent_group = $5
    ORDER BY like_match DESC, sim DESC
    LIMIT $3 OFFSET $4`,
    [test, await getRealmId(), limit + 1, skip, getRootGroup().id],
  ) as Promise<{ rows: GroupRow[] }>
}

async function searchUserTrgm(test: string, limit: number, skip: number, excludedUsers: string[]): Promise<{ rows: UserRow[] }> {
  const result = await query(
    `SELECT 
        id,
        first_name,
        last_name,
        email,
        username,
        (CONCAT(email, ' ', first_name, ' ', last_name) ILIKE '%$1%')::int AS like_match,
        word_similarity($1, (CONCAT(email, ' ', first_name, ' ', last_name))) AS sim
     FROM user_entity
     WHERE (
        CONCAT(email, ' ', first_name, ' ', last_name) ILIKE '%$1%' OR
        word_similarity($1, (CONCAT(email, ' ', first_name, ' ', last_name))) > 0.2
     ) AND
        realm_id = $2 AND id != ALL($5)
     ORDER BY like_match DESC, sim DESC
     LIMIT $3 OFFSET $4`,
    [test, await getRealmId(), limit + 1, skip, excludedUsers],
  ) as Promise<{ rows: UserRow[] }>

  return result
}

// eslint-disable-next-line import/no-mutable-exports
export let searchFn: (test: string, limit: number, skip: number) => Promise<{ rows: GroupRow[] }> = defaultGroupSearch
// eslint-disable-next-line import/no-mutable-exports
export let searchUsersFn: (test: string, limit: number, skip: number, excludedUsers: string[]) => Promise<{ rows: UserRow[] }> = defaultUserSearch

export async function setSearchFunctions() {
  const res = await query(`SELECT EXISTS(
    SELECT 1
    FROM pg_extension
    WHERE extname = 'pg_trgm'
  );`, [])
  const pgTrgmInstalled = res.rows[0].exists
  if (pgTrgmInstalled) {
    internalFeatureFlags.trgmSearch = true
    searchFn = searchGroupTrgm
    searchUsersFn = searchUserTrgm
  }
}

setSearchFunctions()
