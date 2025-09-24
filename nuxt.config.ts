// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxt/test-utils',
    '@nuxtjs/tailwindcss',
  ],
  ssr: false,
  devtools: {
    enabled: true,
  },
  runtimeConfig: {
    public: {
      keycloakUrl: process.env.KEYCLOAK_URL,
      keycloakRealm: process.env.KEYCLOAK_REALM,
      keycloakClientId: process.env.KEYCLOAK_CLIENT_ID,
    },
    keycloakAdmin: process.env.KEYCLOAK_ADMIN,
    keycloakAdminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD,
  },
  devServer: {
    host: '0.0.0.0',
    port: import.meta.env.API_PORT ?? 8080,
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
      stylistic: {
        braceStyle: 'stroustrup',
      },
      formatters: false,
      typescript: true,
      standalone: false,
    },
  },
})
