import { defineEventHandler, getHeader } from 'h3'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import createResponseError from '../utils/error.js'

const runtimeConfig = useRuntimeConfig()
const KEYCLOAK_ISSUER = `${runtimeConfig.public.keycloak.url}/realms/${runtimeConfig.public.keycloak.realm}`
const KEYCLOAK_INTERNAL_ISSUER = `${runtimeConfig.keycloak.internalUrl}/realms/${runtimeConfig.public.keycloak.realm}`
const JWKS_URI = `${KEYCLOAK_INTERNAL_ISSUER}/protocol/openid-connect/certs`
const JWKS = createRemoteJWKSet(new URL(JWKS_URI))

export default defineEventHandler(async (event) => {
  const url = event.node.req.url || ''

  // ⚠️ Définir les routes publiques ici si tu en veux (ex: /api/health)
  if (!url.startsWith('/api')) return

  // Vérifie Authorization: Bearer <token>
  const authHeader = getHeader(event, 'authorization')
  const authCookie = getCookie(event, 'KEYCLOAK_TOKEN')
  const tokenFromCookie = authCookie && !Array.isArray(authCookie) ? authCookie : null

  const tokenToVerify = authHeader || tokenFromCookie

  if (!tokenToVerify) {
    throw createResponseError({ statusCode: 401, data: 'TOKEN_MISSING' })
  }
  if (!tokenToVerify.startsWith('Bearer ')) {
    throw createResponseError({ statusCode: 403, data: 'TOKEN_MALFORMED' })
  }
  const token = tokenToVerify?.split(' ')[1]
  if (!token) {
    throw createResponseError({ statusCode: 403, data: 'TOKEN_MALFORMED' })
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, { issuer: KEYCLOAK_ISSUER })
    // On attache le user au contexte pour les handlers
    event.context.user = {
      sub: payload.sub,
      username: payload.preferred_username,
    }
    if (tokenToVerify !== tokenFromCookie) {
      setCookie(event, 'KEYCLOAK_TOKEN', tokenToVerify, { httpOnly: true, sameSite: 'strict' })
    }
  } catch (err) {
    console.log(err)
    throw createResponseError({ statusCode: 401, data: 'TOKEN_INVALID' })
  }
})
