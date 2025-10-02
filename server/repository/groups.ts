import { getKcClient, getRootGroup } from './keycloak.js'
import { LEVEL } from '../guards/group.js'
import * as db from './pg.js'
import type { AttributeRow, UserRow } from './types.js'
import type { Attributes } from './utils.js'
import { mergeUniqueGroupAttributes } from './utils.js'

const INVITE_ATTRIBUTE = 'invite'
const REQUEST_ATTRIBUTE = 'request'
const OWNER_ATTRIBUTE = 'owner'
const ADMIN_ATTRIBUTE = 'admin'
export interface GroupSearchResult {
  id: string
  name: string
  attributes: Attributes
}
export interface GroupDetails extends GroupSearchResult {
  members: UserRow[]
  invites: UserRow[]
  requests: UserRow[]
  attributes: Attributes
}

interface SearchParams {
  query: string
  limit: number
  skip: number
  exact?: boolean
}

const realmName = useRuntimeConfig().public.keycloak.realm
export async function searchGroups({ query, limit, skip, exact = false }: SearchParams): Promise<{ groups: (GroupSearchResult & { owners: UserRow[] })[], total: number, next: boolean }> {
  const groupsResult = exact
    ? await db.query(
        'SELECT * FROM keycloak_group WHERE name ILIKE $1 AND realm_id = $2 AND parent_group = $5 LIMIT $3 OFFSET $4',
        [query, await db.getRealmId(), limit, skip, getRootGroup().id],
      )
    : await db.searchFn(query, limit, skip)

  const owners = await db.query(
    `SELECT u.id, u.email, u.username, u.first_name, u.last_name, ga.group_id 
     FROM user_entity u
     JOIN group_attribute ga ON u.id = ga.value
     WHERE ga.name = $1 AND ga.group_id = ANY($2::text[])`,
    [OWNER_ATTRIBUTE, groupsResult.rows.map((g: GroupSearchResult) => g.id)],
  )

  const groups = groupsResult.rows
    .slice(0, limit)
    .map((group: GroupSearchResult) => ({
      id: group.id,
      name: group.name,
      attributes: {},
      owners: owners.rows.filter((owner: { group_id: string }) => owner.group_id === group.id),
    }))
  const total = await db.query(
    'SELECT count(*) FROM keycloak_group WHERE name ILIKE $1 AND realm_id = $2 AND parent_group = $3',
    [`%${query}%`, await db.getRealmId(), getRootGroup().id],
  )
  return { groups, total: total.rows[0].count, next: groupsResult.rows.length > limit }
}

// not exported cause no check on root group hierarchy
async function getGroupAttributesAndMembers(groupId: string): Promise<{ attributes: AttributeRow[], members: UserRow[], invites: UserRow[], requests: UserRow[] }> {
  const attributes = await db.query(
    `SELECT ga.name, ga.value, ga.group_id
     FROM group_attribute ga
     WHERE ga.group_id = $1`,
    [groupId],
  )

  const members = await db.query(
    `SELECT u.username, u.email, u.id, u.first_name, u.last_name
     FROM user_group_membership ugm
     JOIN user_entity u ON u.id = ugm.user_id
     WHERE ugm.group_id = $1`,
    [groupId],
  )

  const invites = await getPendingInvitesForGroup(groupId)
  const requests = await getPendingRequestsForGroup(groupId)
  return { attributes: attributes.rows, members: members.rows, invites, requests }
}

// not exported cause no check on root group hierarchy
async function searchGroupsByAttributes(name: string, value: string): Promise<GroupSearchResult[]> {
  const groups = await db.query(
    `SELECT g.id, g.name, ga.name AS attribute_name, ga.value AS attribute_value
     FROM keycloak_group g
     LEFT JOIN group_attribute ga ON g.id = ga.group_id
     WHERE (ga.name = $1 AND ga.value = $2) AND g.realm_id = $3`,
    [name, value, await db.getRealmId()],
  )
  return groups.rows
}

export async function getGroupByName(name: string): Promise<GroupSearchResult | null> {
  const groups = await db.query(
    `SELECT g.id, g.name
     FROM keycloak_group g
     WHERE g.name ILIKE $1 AND g.realm_id = $2 AND parent_group = $3`,
    [name, await db.getRealmId(), getRootGroup().id],
  )
  if (groups.rows.length === 0) {
    return null
  }
  return { ...groups.rows[0], attributes: {} }
}

export async function createGroup(name: string): Promise<GroupSearchResult> {
  const kcClient = getKcClient()
  const rootGroup = getRootGroup()
  const result = rootGroup.id !== ' '
    ? await kcClient.groups.createChildGroup({
        id: rootGroup.id,
        realm: realmName,
      }, { name })
    : await kcClient.groups.create({
        name,
        realm: realmName,
      })

  return {
    id: result.id,
    name,
    attributes: { owner: [], invite: [], admin: [] },
  }
}

// not exported cause no check on root group hierarchy
async function getAttribute(groupId: string, name: string): Promise<string[]> {
  const kcClient = getKcClient()
  const group = await kcClient.groups.findOne({
    id: groupId,
    realm: realmName,
  })
  if (!group) {
    throw new Error('Group not found')
  }
  return group.attributes?.[name] || []
}

// not exported cause no check on root group hierarchy
async function setAttribute(groupId: string, name: string, values: string[]): Promise<void> {
  const kcClient = getKcClient()
  const group = await kcClient.groups.findOne({
    id: groupId,
    realm: realmName,
  })
  if (!group) {
    throw new Error('Group not found')
  }

  await kcClient.groups.update({ id: groupId }, {
    name: group.name,
    attributes: {
      ...group.attributes,
      [name]: values,
    },
  })
}

// not exported cause no check on root group hierarchy
async function getPendingInvitesForGroup(groupId: string): Promise<UserRow[]> {
  const users = await db.query(
    `SELECT u.id, u.email, u.username, u.first_name, u.last_name
     FROM user_entity u
     JOIN group_attribute ga ON ga.value = u.id
     WHERE ga.group_id = $1 AND ga.name = $2`,
    [groupId, INVITE_ATTRIBUTE],
  )
  return users.rows
}

// not exported cause no check on root group hierarchy
async function getPendingRequestsForGroup(groupId: string): Promise<UserRow[]> {
  const users = await db.query(
    `SELECT u.id, u.email, u.username, u.first_name, u.last_name
     FROM user_entity u
     JOIN group_attribute ga ON ga.value = u.id
     WHERE ga.group_id = $1 AND ga.name = $2`,
    [groupId, REQUEST_ATTRIBUTE],
  )
  return users.rows
}

export async function listGroupsForUser(userId: string): Promise<{ invited: GroupSearchResult[], joined: GroupSearchResult[], requested: GroupSearchResult[] }> {
  const realmId = await db.getRealmId()
  const groups = await db.query(
    `SELECT g.id, g.name
     FROM keycloak_group g
     JOIN user_group_membership ugm ON g.id = ugm.group_id
     WHERE ugm.user_id = $1 AND g.realm_id = $2 AND g.parent_group = $3`,
    [userId, realmId, getRootGroup().id],
  )
  const invited = await searchGroupsByAttributes(INVITE_ATTRIBUTE, userId)
  const requested = await searchGroupsByAttributes(REQUEST_ATTRIBUTE, userId)

  return { invited, joined: groups.rows, requested }
}

export async function getGroupDetails(groupId: string): Promise<GroupDetails | null> {
  const groupRes = await db.query(
    `SELECT g.id, g.name
     FROM keycloak_group g
     WHERE g.id = $1 AND g.realm_id = $2 AND g.parent_group = $3`,
    [groupId, await db.getRealmId(), getRootGroup().id],
  )
  if (groupRes.rowCount === 0) {
    return null
  }
  const group = groupRes.rows[0]
  const { attributes, members, invites, requests } = await getGroupAttributesAndMembers(groupId)
  return {
    id: group.id,
    name: group.name,
    attributes: mergeUniqueGroupAttributes(attributes),
    members,
    invites,
    requests,
  }
}

export async function deleteGroup(id: string): Promise<void> {
  const kcClient = getKcClient()
  const group = await kcClient.groups.findOne({ id })
  if (!group || !group.path?.startsWith(getRootGroup().path)) {
    throw new Error('Group not found')
  }
  await kcClient.groups.del({
    id,
    realm: realmName,
  })
}

// exported but no check on root group hierarchy, cause you're supposed to check it before
export async function addMemberToGroup(userId: string, groupId: string): Promise<void> {
  const kcClient = getKcClient()
  await kcClient.users.addToGroup({
    id: userId,
    groupId,
    realm: realmName,
  })
}

// exported but no check on root group hierarchy, cause you're supposed to check it before
export async function removeMemberFromGroup(userId: string, groupId: string): Promise<void> {
  const kcClient = getKcClient()
  await kcClient.users.delFromGroup({
    id: userId,
    groupId,
    realm: realmName,
  })
  // remove from roles if any
  await setUserLevelInGroup(userId, groupId, LEVEL.GUEST)
}

// exported but no check on root group hierarchy, cause you're supposed to check it before
export async function setUserLevelInGroup(userId: string, groupId: string, level: number): Promise<void> {
  const [ownerValues, adminValues] = await Promise.all([
    getAttribute(groupId, OWNER_ATTRIBUTE),
    getAttribute(groupId, ADMIN_ATTRIBUTE),
  ])
  const isOwner = ownerValues?.includes(userId)
  const isAdmin = adminValues?.includes(userId)

  // add to attributes if needed
  await Promise.all([
    level === LEVEL.OWNER && await setAttribute(groupId, OWNER_ATTRIBUTE, [...ownerValues, userId]),
    level === LEVEL.ADMIN && await setAttribute(groupId, ADMIN_ATTRIBUTE, [...adminValues, userId]),
  ])

  // remove from attributes if needed
  await Promise.all([
    (isOwner && level !== LEVEL.OWNER) && setAttribute(groupId, OWNER_ATTRIBUTE, ownerValues.filter(id => id !== userId)),
    (isAdmin && level !== LEVEL.ADMIN) && setAttribute(groupId, ADMIN_ATTRIBUTE, adminValues.filter(id => id !== userId)),
  ])
}

// exported but no check on root group hierarchy, cause you're supposed to check it before
export async function inviteMemberToGroup(userId: string, groupId: string): Promise<void> {
  const invites = await getAttribute(groupId, INVITE_ATTRIBUTE) || []

  if (!invites.includes(userId)) {
    invites.push(userId)
    await setAttribute(groupId, INVITE_ATTRIBUTE, invites)
  }
}

// exported but no check on root group hierarchy, cause you're supposed to check it before
export async function uninviteMemberFromGroup(userId: string, groupId: string): Promise<void> {
  const invites = await getAttribute(groupId, INVITE_ATTRIBUTE) || []
  const index = invites.indexOf(userId)
  if (index !== -1) {
    invites.splice(index, 1)
    await setAttribute(groupId, INVITE_ATTRIBUTE, invites)
  }
}

// exported but no check on root group hierarchy, cause you're supposed to check it before
export async function requestJoinToGroup(userId: string, groupId: string): Promise<void> {
  const requests = await getAttribute(groupId, REQUEST_ATTRIBUTE) || []

  if (!requests.includes(userId)) {
    requests.push(userId)
    await setAttribute(groupId, REQUEST_ATTRIBUTE, requests)
  }
}

// exported but no check on root group hierarchy, cause you're supposed to check it before
export async function cancelRequestJoinToGroup(userId: string, groupId: string): Promise<void> {
  const requests = await getAttribute(groupId, REQUEST_ATTRIBUTE) || []
  const index = requests.indexOf(userId)
  if (index !== -1) {
    requests.splice(index, 1)
    await setAttribute(groupId, REQUEST_ATTRIBUTE, requests)
  }
}

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  const users = await db.query(
    `SELECT u.username, u.email, u.id, u.first_name, u.last_name
     FROM user_entity u
     WHERE u.email = $1 AND u.realm_id = $2`,
    [email, await db.getRealmId()],
  )
  return users.rows[0] || null
}

export async function getUserById(id: string): Promise<UserRow | null> {
  const users = await db.query(
    `SELECT u.username, u.email, u.id, u.first_name, u.last_name
     FROM user_entity u
     WHERE u.id = $1 AND u.realm_id = $2`,
    [id, await db.getRealmId()],
  )
  return users.rows[0] || null
}

// USERS SECTION
export async function searchUsers(options: { query: string, excludeGroupId?: string }): Promise<UserRow[]> {
  const excludedMembers: string[] = []
  if (options.excludeGroupId) {
    const groupDetails = await getGroupDetails(options.excludeGroupId)
    if (groupDetails) {
      excludedMembers.push(...groupDetails.members.map(m => m.id), ...groupDetails.invites.map(i => i.id))
    }
  }
  return (await db.searchUsersFn(options.query, 10, 0, excludedMembers)).rows
}
