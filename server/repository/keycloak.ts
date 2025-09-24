import KcAdminClient from '@keycloak/keycloak-admin-client'

const runtimeConfig = useRuntimeConfig()
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

async function start(retries = 5) {
  try {
    await getkcClient()
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
