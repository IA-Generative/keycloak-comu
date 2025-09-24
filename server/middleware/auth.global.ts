import { createError, defineEventHandler, getHeader } from 'h3'
import { createRemoteJWKSet, jwtVerify } from 'jose'

const runtimeConfig = useRuntimeConfig()
const KEYCLOAK_ISSUER = `${runtimeConfig.public.keycloakUrl}/realms/${runtimeConfig.public.keycloakRealm}`
const JWKS_URI = `${KEYCLOAK_ISSUER}/protocol/openid-connect/certs`
const JWKS = createRemoteJWKSet(new URL(JWKS_URI))

export default defineEventHandler(async (event) => {
  const url = event.node.req.url || ''

  // ⚠️ Définir les routes publiques ici si tu en veux (ex: /api/health)
  if (!url.startsWith('/api')) return

  // Vérifie Authorization: Bearer <token>
  const auth = getHeader(event, 'authorization')

  if (!auth) {
    throw createError({ statusCode: 401, statusMessage: 'Token manquant' })
  }
  if (!auth.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, statusMessage: 'Token malformé' })
  }

  const token = auth.split(' ')[1]

  try {
    const { payload } = await jwtVerify(token, JWKS, { issuer: KEYCLOAK_ISSUER })
    // On attache le user au contexte pour les handlers
    event.context.user = {
      sub: payload.sub,
      username: payload.preferred_username,
    }
  } catch (err) {
    console.log(err)
    throw createError({ statusCode: 401, statusMessage: 'Token invalide' })
  }
})
