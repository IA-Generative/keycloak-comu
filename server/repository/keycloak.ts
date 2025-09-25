import KcAdminClient from '@keycloak/keycloak-admin-client'
import type GroupRepresentation from '@keycloak/keycloak-admin-client/lib/defs/groupRepresentation.js'

const runtimeConfig = useRuntimeConfig()

let rootGroup: Required<GroupRepresentation> | null = null

export async function getkcClient() {
  const kcClient = new KcAdminClient({
    baseUrl: `${runtimeConfig.public.keycloakUrl}`,
  })
  await kcClient.auth({
    clientId: 'admin-cli',
    grantType: 'password',
    username: runtimeConfig.keycloakAdmin,
    password: runtimeConfig.keycloakAdminPassword,
  })
  kcClient.setConfig({ realmName: runtimeConfig.public.keycloakRealm })

  return kcClient
}

async function setupRootGroup({
  kcClient,
  rootGroupPath,
}: { kcClient: KcAdminClient, rootGroupPath: string }) {
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
      id: '',
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
  console.log('Root group set to:', rootGroup?.path || '<empty>')
}

async function start(retries = 5) {
  try {
    const kcClient = await getkcClient()

    await setupRootGroup({ kcClient, rootGroupPath: runtimeConfig.public.keycloakRootGroupPath })
    console.log('Keycloak client started')
  } catch (_error: unknown) {
    if (retries > 0) {
      console.log(`Retrying to connect to keycloak... (${retries} retries left)`)
      setTimeout(() => start(retries - 1), 5000)
      return
    }
    console.log('Could not connect to keycloak, exiting.')
    throw new Error('Failed to start keycloak client, EXITING !')
  }
}
start()

export function getRootGroup(): Required<GroupRepresentation> {
  if (!rootGroup) {
    throw new Error('Root group not set')
  }
  return rootGroup
}
