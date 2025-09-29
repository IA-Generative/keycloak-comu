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
