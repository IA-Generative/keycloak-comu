import { defineEventHandler, getHeader } from 'h3'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import createResponseError from '../utils/error.js'

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
    throw createResponseError({ statusCode: 401, data: 'TOKEN_MISSING' })
  }
  if (!auth.startsWith('Bearer ')) {
    throw createResponseError({ statusCode: 401, data: 'TOKEN_MALFORMED' })
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
    throw createResponseError({ statusCode: 401, data: 'TOKEN_INVALID' })
  }
})
