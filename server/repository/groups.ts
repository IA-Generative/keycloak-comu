import * as db from './pg.js'
import type { AttributeRow, UserRow } from './types.js'

export interface GroupSearchResult {
  id: string
  name: string
  description: string | null
  attributes: Record<string, string[]>
}

export async function searchGroups(query: string, skip: number, limit: number): Promise<{ groups: GroupSearchResult[], total: number }> {
  const groups = await db.query(
    'SELECT * FROM keycloak_group WHERE name ILIKE $1 AND realm_id = $2 LIMIT $3 OFFSET $4',
    [`%${query}%`, await db.getRealmId(), limit, skip],
  )
  const total = await db.query(
    'SELECT count(*) FROM keycloak_group WHERE name ILIKE $1 AND realm_id = $2',
    [`%${query}%`, await db.getRealmId()],
  )
  return { groups: groups.rows, total: total.rows[0].count }
}

export async function getGroupAttributesAndMembers(groupId: string): Promise<{ attributes: AttributeRow[], members: UserRow[] }> {
  const attributes = await db.query(
    `SELECT ga.name, ga.value, ga.group_id
     FROM keycloak_group_attribute ga
     WHERE ga.group_id = $1`,
    [groupId],
  )

  console.log(attributes.rows)
  const members = await db.query(
    `SELECT ugm.user_id, u.username, u.email, u.id, u.first_name, u.last_name
     FROM user_group_membership ugm
     JOIN user_entity u ON u.id = ugm.user_id
     WHERE ugm.group_id = $1`,
    [groupId],
  )

  console.log(members.rows)
  return { attributes: attributes.rows, members: members.rows }
}

export async function searchGroupsByAttributes(name: string, value: string): Promise<GroupSearchResult[]> {
  const groups = await db.query(
    `SELECT g.id, g.name, g.description, ga.name AS attribute_name, ga.value AS attribute_value
     FROM keycloak_group g
     LEFT JOIN group_attribute ga ON g.id = ga.group_id
     WHERE (ga.name = $1 OR ga.value = $2) AND g.realm_id = $3`,
    [name, value, await db.getRealmId()],
  )
  return groups.rows
}

// TODO passer par l'api !
export async function createGroup(uniqueName: string, name: string, description: string | null): Promise<GroupSearchResult> {
  const result = await db.query(
    `INSERT INTO keycloak_group (id, name, parent_group, description, realm_id)
     VALUES (gen_random_uuid(), $1, '', $2, $3)
     RETURNING id, name, description`,
    [uniqueName, description, await db.getRealmId()],
  )
  const groupId = result.rows[0].id
  await setAttribute(groupId, 'name', name)
  return result.rows[0]
}

// TODO passer par l'api !
export async function setAttribute(groupId: string, name: string, value: string): Promise<void> {
  await db.query(
    `INSERT INTO group_attribute (id, name, value, group_id)
     VALUES (gen_random_uuid(), $1, $2, $3)`,
    [name, value, groupId],
  )
}
