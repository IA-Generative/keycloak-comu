// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxt/test-utils',
    '@nuxtjs/tailwindcss',
    '@nuxt/test-utils/module',
  ],
  ssr: false,
  devtools: {
    enabled: true,
  },
  runtimeConfig: {
    isProd: !(process.env.NODE_ENV !== 'production'),
    public: {
      keycloakUrl: process.env.NUXT_PUBLIC_KEYCLOAK_URL,
      keycloakRealm: process.env.NUXT_PUBLIC_KEYCLOAK_REALM,
      keycloakClientId: process.env.NUXT_PUBLIC_KEYCLOAK_CLIENT_ID,
      keycloakRootGroupPath: process.env.NUXT_PUBLIC_KEYCLOAK_ROOT_GROUP_PATH || '/',
    },
    keycloakAdmin: process.env.NUXT_KEYCLOAK_ADMIN,
    keycloakAdminPassword: process.env.NUXT_KEYCLOAK_ADMIN_PASSWORD,
    keycloakInternalUrl: process.env.NUXT_KEYCLOAK_INTERNAL_URL || process.env.NUXT_PUBLIC_KEYCLOAK_URL,
    enableEmailInvite: process.env.NUXT_ENABLE_EMAIL_INVITE === 'true' || false,
    baseUrl: process.env.NUXT_BASE_URL || 'http://localhost:8080',
    smtp: {
      host: process.env.NUXT_SMTP_HOST || 'mailhog',
      port: process.env.NUXT_SMTP_PORT || '1025',
      from: process.env.NUXT_SMTP_FROM || '<noreply@example.com>',
    },
    database: {
      host: process.env.NUXT_DATABASE_HOST || 'localhost',
      port: process.env.NUXT_DATABASE_PORT || '5432',
      name: process.env.NUXT_DATABASE_NAME || 'keycloak',
      user: process.env.NUXT_DATABASE_USER || 'keycloak',
      password: process.env.NUXT_DATABASE_PASSWORD || 'password',
    },
  },
  devServer: {
    host: '0.0.0.0',
    port: import.meta.env.NUXT_PUBLIC_API_PORT ?? 8080,
  },
  compatibilityDate: '2025-07-15',
  serverHandlers: [
    {
      route: '/api/', // toutes les routes sous /api
      handler: 'server/middleware/auth.global.ts',
    },
  ],
  typescript: {
    strict: true,
  },
  eslint: {
    config: {
      standalone: false,
    },
  },
  nitro: {
    experimental: {
      openAPI: true,
    },
  },
})
