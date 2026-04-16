import { UserManager, WebStorageStateStore, type User } from 'oidc-client-ts'
import { getAuthConfig } from './useBackend'

let managerPromise: Promise<UserManager> | undefined

async function getManager(): Promise<UserManager> {
  if (!managerPromise) {
    managerPromise = getAuthConfig().then(
      (config) =>
        new UserManager({
          validateSubOnSilentRenew: true,
          authority: config.issuer_url,
          client_id: config.client_id,
          redirect_uri: window.location.origin,
          post_logout_redirect_uri: window.location.origin,
          response_type: 'code',
          automaticSilentRenew: true,
          userStore: new WebStorageStateStore({ store: window.sessionStorage }),
        }),
    ).catch((err) => {
      managerPromise = undefined
      throw err
    })
  }
  return managerPromise
}

export async function getCurrentUser(): Promise<User | null> {
  return (await getManager()).getUser().then((user) => {
    return user
  })
}

export async function login(): Promise<void> {
  await (await getManager()).signinRedirect()
}

export async function logout(): Promise<void> {
  await (await getManager()).signoutRedirect()
}

export async function handleOidcCallbackIfPresent(): Promise<User | null> {
  if (!window.location.search.includes('code=')) {
    return null
  }

  const user = await (await getManager()).signinRedirectCallback()
  window.history.replaceState({}, document.title, window.location.pathname)
  return user
}

export async function getBearerToken(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.access_token ?? null
}

export async function getUserId(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.profile?.sub ?? null
}
