import { ADMIN_ATTRIBUTE, EXPIRES_AT_ATTRIBUTE, INVITE_ATTRIBUTE, OWNER_ATTRIBUTE, REQUEST_ATTRIBUTE } from './groups.js'
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
      GROUP BY ugm.group_id
      ORDER BY COUNT(*)`,
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
      GROUP BY g.id
      ORDER BY COUNT(ga.group_id)`,
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
      GROUP BY g.id
      ORDER BY COUNT(ga.group_id)`,
    [await db.getRealmId(), getRootGroup().id, ADMIN_ATTRIBUTE],
  )
  return mapValues(groupsResult.rows)
}

export async function countGroupWithoutExpiration(): Promise<number> {
  const result = await db.query(
    `SELECT COUNT(*)
      FROM keycloak_group g
      LEFT JOIN group_attribute ga_exp ON g.id = ga_exp.group_id AND ga_exp.name = $3
      WHERE g.realm_id = $1 AND g.parent_group = $2
      AND ga_exp.value IS NULL`,
    [await db.getRealmId(), getRootGroup().id, EXPIRES_AT_ATTRIBUTE],
  )
  return Number.parseInt(result.rows[0].count, 10)
}

export async function countPendingInvitesPerGroupMetrics(): Promise<number[]> {
  const groupsResult = await db.query(
    `SELECT COUNT(ga.group_id)
      FROM keycloak_group g
      LEFT JOIN group_attribute ga ON g.id = ga.group_id AND ga.name = $3
      WHERE g.realm_id = $1 AND g.parent_group = $2
      GROUP BY g.id
      ORDER BY COUNT(ga.group_id)`,
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

// Get group expiring in before timestamp
export async function countExpiringGroups(): Promise<number[]> {
  const groups = await db.query(
    `SELECT g.id, ga_exp.value
      FROM keycloak_group g
      LEFT JOIN group_attribute ga_exp
        ON g.id = ga_exp.group_id
        AND ga_exp.name = '${EXPIRES_AT_ATTRIBUTE}'
      WHERE ga_exp.value IS NOT NULL
      AND g.realm_id = $1`,
    [await db.getRealmId()],
  ) as { rows: { id: string, value: string }[] }
  const results = groups.rows.map((group) => {
    if (!group.value) {
      return 0
    }
    const expiresAt = new Date(Number.parseInt(group.value, 10))
    const now = new Date()
    const diffInMonths = (expiresAt.getFullYear() - now.getFullYear()) * 12 + (expiresAt.getMonth() - now.getMonth())
    return diffInMonths >= 0 ? diffInMonths : 0
  })
  return results
}
