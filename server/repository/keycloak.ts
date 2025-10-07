import KcAdminClient from '@keycloak/keycloak-admin-client'
import type GroupRepresentation from '@keycloak/keycloak-admin-client/lib/defs/groupRepresentation.js'

const runtimeConfig = useRuntimeConfig()

let rootGroup: Required<GroupRepresentation> | null = null

export const kcClient = new KcAdminClient({
  baseUrl: runtimeConfig.keycloak.internalUrl,
})
const keycloakAdminRealm = runtimeConfig.keycloak.admin.realm || runtimeConfig.public.keycloak.realm
kcClient.setConfig({ realmName: keycloakAdminRealm })

async function setupRootGroup(rootGroupPath: string) {
  if (rootGroupPath !== '/') {
    const rootGroupName = rootGroupPath.split('/').pop() as string
    rootGroup = await kcClient.groups.find({ search: rootGroupName, exact: true }).then((groups) => {
      if (groups.length === 0) {
        throw new Error(`Root group "${rootGroupName}" not found`)
      }
      return groups[0] as Required<GroupRepresentation>
    })
  } else {
    console.log('No root group path set, using "/" as root group')
    rootGroup = {
      id: ' ',
      name: '',
      path: '',
      subGroupCount: 0,
      subGroups: [],
      access: { manage: true, view: true, mapRoles: true },
      attributes: {},
      clientRoles: {},
      realmRoles: [],
      description: '',
    }
  }
}

export async function setupKeycloakClient(retries = 5) {
  try {
    await kcClient.auth({
      clientId: 'admin-cli',
      grantType: 'password',
      username: runtimeConfig.keycloak.admin.username,
      password: runtimeConfig.keycloak.admin.password,
    })
    if (retries !== 5) {
      console.log('Keycloak client reconnected')
    }
    if (!rootGroup) {
      await setupRootGroup(runtimeConfig.public.keycloak.rootGroupPath)
    }
  } catch (error) {
    console.error(error)
    if (!retries) {
      console.error('Unable to Connect to Keycloak')
      process.exit(1)
    }
    console.warn(`Unable to connect to Keycloak, retry in 5 seconds, retries left: ${retries}`)
    setTimeout(() => {
      setupKeycloakClient(retries - 1)
    }, 5000)
    throw error
  }
  const token = JSON.parse(atob(kcClient.accessToken!.split('.')[1]))
  const lifeSpan = Math.floor(token.exp * 1000 - Date.now())
  const nextAuth = lifeSpan * 0.9
  setTimeout(() => {
    setupKeycloakClient()
  }, nextAuth)
}

setupKeycloakClient()

export function getRootGroup(): Required<GroupRepresentation> {
  if (!rootGroup) {
    throw new Error('Root group not set')
  }
  return rootGroup
}
