import KcAdminClient from '@keycloak/keycloak-admin-client'
import type GroupRepresentation from '@keycloak/keycloak-admin-client/lib/defs/groupRepresentation.js'

const runtimeConfig = useRuntimeConfig()

let rootGroup: Required<GroupRepresentation> | null = null

const kcClient = new KcAdminClient({
  baseUrl: runtimeConfig.keycloakInternalUrl,
})
kcClient.setConfig({ realmName: runtimeConfig.public.keycloakRealm })

export function getKcClient() {
  if (!rootGroup) {
    throw new Error('Root Group not search yet, please try again later')
  }
  return kcClient
}

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

async function setupKeycloakClient(retries = 5) {
  try {
    await kcClient.auth({
      clientId: 'admin-cli',
      grantType: 'password',
      username: runtimeConfig.keycloakAdmin,
      password: runtimeConfig.keycloakAdminPassword,
    })
    if (retries !== 5) {
      console.log('Keycloak client reconnected')
    }
    if (!rootGroup) {
      await setupRootGroup(runtimeConfig.public.keycloakRootGroupPath)
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
