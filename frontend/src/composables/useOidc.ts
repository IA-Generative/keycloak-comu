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

const CLE_QUERY_AVANT_CONNEXION = 'comu.query-avant-connexion'

/** La query gardée avant la connexion, consommée une fois (vide s'il n'y en a pas). */
export function queryAvantConnexion(): string {
  try {
    const q = sessionStorage.getItem(CLE_QUERY_AVANT_CONNEXION) || ''
    sessionStorage.removeItem(CLE_QUERY_AVANT_CONNEXION)
    return q
  } catch {
    return ''
  }
}

export async function getCurrentUser(): Promise<User | null> {
  return (await getManager()).getUser().then((user) => {
    return user
  })
}

export async function login(opts?: Parameters<typeof UserManager.prototype.signinRedirect>[0]): Promise<void> {
  if (!opts) {
    opts = {}
  }
  if (!opts.redirect_uri) {
    opts.redirect_uri = window.location.origin + window.location.pathname
  }
  // La query d'arrivée (?q=, ?retour=…) ne survit pas à l'aller-retour vers Keycloak : on la garde
  // ici, handleOidcCallbackIfPresent la remet dans l'adresse au retour.
  try {
    if (window.location.search && !window.location.search.includes('code=')) {
      sessionStorage.setItem(CLE_QUERY_AVANT_CONNEXION, window.location.search)
    }
  } catch {
    /* sans stockage, la query se perd : comme avant */
  }
  await (await getManager()).signinRedirect(opts)
}

export async function logout(): Promise<void> {
  await (await getManager()).signoutRedirect()
}

export async function handleOidcCallbackIfPresent(): Promise<User | null> {
  if (!window.location.search.includes('code=')) {
    return null
  }

  const user = await (await getManager()).signinRedirectCallback()
  window.history.replaceState({}, document.title, window.location.pathname + queryAvantConnexion())
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


export async function isLoggedIn(): Promise<boolean> {
  const user = await getCurrentUser()
  if (user?.expired) {
    return false
  }
  if (!user) {
    return false
  }
  if (user?.access_token) {
    return true
  }
  return false
}