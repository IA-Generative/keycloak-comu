import { kcClient } from './keycloak.js'
import * as db from './pg.js'
import { realmName, stb } from './utils.js'

const AUTO_ACCEPT_INVITES_ATTRIBUTE = 'keycloak-comu.autoAcceptInvites'

interface UserAttributesRow {
  name: string
  value: string
}

// async function getRealm() {
//   const realm = await kcClient.components.find({
//     type: 'org.keycloak.userprofile.UserProfileProvider',
//     realm: realmName,
//   })
//   console.log(JSON.parse(realm[0].config.['kc.user.profile.config'][0]).unmanagedAttributePolicy)
// }
// setTimeout(() =>
//   getRealm(), 2000)

async function getUserAttributes(userId: string): Promise<UserAttributesRow[]> {
  const attributesRows = await db.query(
    `SELECT name, value
     FROM user_attribute ua
     WHERE ua.user_id = $1`,
    [userId],
  )
  return attributesRows.rows
}

export async function getUserSettings(userId: string): Promise<UserSettings> {
  const userAttributes = await getUserAttributes(userId)
  const autoAcceptInvitesAttribute = userAttributes.find(row => row.name === AUTO_ACCEPT_INVITES_ATTRIBUTE)?.value

  return {
    autoAcceptInvites: stb(autoAcceptInvitesAttribute),
  }
}

export async function setUserSettings(userId: string, settings: Partial<UserSettings>) {
  for (const [key, value] of Object.entries(settings)) {
    await setAttribute(userId, key as keyof UserSettings, [value === null ? '' : value.toString()])
  }
}

// UTILS
async function setAttribute(userId: string, name: keyof UserSettings, values: string[]): Promise<void> {
  const user = await kcClient.users.findOne({
    id: userId,
    realm: realmName,
  })
  if (!user) {
    throw new Error('User not found')
  }

  await kcClient.users.update({
    id: userId,
    realm: realmName,
  }, {
    ...user,
    attributes: {
      ...user.attributes,
      [AUTO_ACCEPT_INVITES_ATTRIBUTE]: values,
    },
  })
}
