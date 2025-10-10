import { ADMIN_ATTRIBUTE, INVITE_ATTRIBUTE, OWNER_ATTRIBUTE, REQUEST_ATTRIBUTE } from './groups.js'
import { getRootGroup } from './keycloak.js'
import * as db from './pg.js'

function mapValues(rows: { count: string }[]): number[] {
  return rows.map(row => Number.parseInt(row.count, 10))
}

// Metrics
export async function countGroupMetrics(): Promise<number> {
  const groupsResult = await db.query(
    `SELECT count(*)
      FROM keycloak_group g
      WHERE g.realm_id = $1 AND g.parent_group = $2`,
    [await db.getRealmId(), getRootGroup().id],
  )
  return Number.parseInt(groupsResult.rows[0].count, 10)
}

export async function countMembersPerGroupMetrics(): Promise<number[]> {
  const groupsResult = await db.query(
    `SELECT count(*)
      FROM user_group_membership ugm
      RIGHT JOIN keycloak_group g ON g.id = ugm.group_id
      WHERE g.realm_id = $1 AND g.parent_group = $2
      GROUP BY ugm.group_id`,
    [await db.getRealmId(), getRootGroup().id],
  )
  return mapValues(groupsResult.rows)
}

export async function countOwnersPerGroupMetrics(): Promise<number[]> {
  const groupsResult = await db.query(
    `SELECT COUNT(ga.group_id)
      FROM keycloak_group g
      LEFT JOIN group_attribute ga ON g.id = ga.group_id AND ga.name = $3
      WHERE g.realm_id = $1 AND g.parent_group = $2
      GROUP BY g.id`,
    [await db.getRealmId(), getRootGroup().id, OWNER_ATTRIBUTE],
  )
  return mapValues(groupsResult.rows)
}

export async function countAdminsPerGroupMetrics(): Promise<number[]> {
  const groupsResult = await db.query(
    `SELECT COUNT(ga.group_id)
      FROM keycloak_group g
      LEFT JOIN group_attribute ga ON g.id = ga.group_id AND ga.name = $3
      WHERE g.realm_id = $1 AND g.parent_group = $2
      GROUP BY g.id`,
    [await db.getRealmId(), getRootGroup().id, ADMIN_ATTRIBUTE],
  )
  return mapValues(groupsResult.rows)
}

export async function countPendingInvitesPerGroupMetrics(): Promise<number[]> {
  const groupsResult = await db.query(
    `SELECT COUNT(ga.group_id)
      FROM keycloak_group g
      LEFT JOIN group_attribute ga ON g.id = ga.group_id AND ga.name = $3
      WHERE g.realm_id = $1 AND g.parent_group = $2
      GROUP BY g.id`,
    [await db.getRealmId(), getRootGroup().id, INVITE_ATTRIBUTE],
  )
  return mapValues(groupsResult.rows)
}

export async function countPendingRequestsPerGroupMetrics(): Promise<number[]> {
  const groupsResult = await db.query(
    `SELECT COUNT(ga.group_id)
      FROM keycloak_group g
      LEFT JOIN group_attribute ga ON g.id = ga.group_id AND ga.name = $3
      WHERE g.realm_id = $1 AND g.parent_group = $2
      GROUP BY g.id
      ORDER BY COUNT(ga.group_id)`,
    [await db.getRealmId(), getRootGroup().id, REQUEST_ATTRIBUTE],
  )
  return mapValues(groupsResult.rows)
}

export async function countTeamsPerGroupMetrics(): Promise<number[]> {
  const groupsResult = await db.query(
    `SELECT COUNT(c_g.parent_group)
      FROM keycloak_group g
      LEFT JOIN keycloak_group c_g ON g.id = c_g.parent_group 
      WHERE g.realm_id = $1 AND g.parent_group = $2
      GROUP BY g.id`,
    [await db.getRealmId(), getRootGroup().id],
  ) as { rows: { count: string }[] }
  return mapValues(groupsResult.rows)
}
