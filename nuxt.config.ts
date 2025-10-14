import pkg from './package.json'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxt/test-utils',
    '@nuxtjs/tailwindcss',
    '@nuxt/test-utils/module',
    '@artmizu/nuxt-prometheus',
    '@scalar/nuxt',
  ],
  ssr: false,
  devtools: {
    enabled: true,
  },
  runtimeConfig: {
    isProd: !(process.env.NODE_ENV !== 'production'),
    public: {
      version: pkg.version,
      keycloak: {
        url: process.env.NUXT_PUBLIC_KEYCLOAK_URL,
        realm: process.env.NUXT_PUBLIC_KEYCLOAK_REALM,
        clientId: process.env.NUXT_PUBLIC_KEYCLOAK_CLIENT_ID,
        rootGroupPath: process.env.NUXT_PUBLIC_KEYCLOAK_ROOT_GROUP_PATH || '/',
      },
    },
    keycloak: {
      admin: {
        password: process.env.NUXT_KEYCLOAK_ADMIN_PASSWORD,
        realm: process.env.NUXT_KEYCLOAK_ADMIN_REALM || process.env.NUXT_PUBLIC_KEYCLOAK_REALM,
        username: process.env.NUXT_KEYCLOAK_ADMIN_USERNAME,
      },
      internalUrl: process.env.NUXT_KEYCLOAK_INTERNAL_URL || process.env.NUXT_PUBLIC_KEYCLOAK_URL,
    },
    baseUrl: process.env.NUXT_BASE_URL || 'http://localhost:8080',
    smtp: {
      enable: process.env.NUXT_SMTP_ENABLE === 'true',
      host: process.env.NUXT_SMTP_HOST || 'mailhog',
      port: process.env.NUXT_SMTP_PORT || '1025',
      from: process.env.NUXT_SMTP_FROM || '<noreply@example.com>',
      authType: process.env.NUXT_SMTP_AUTH_TYPE || 'LOGIN',
      user: process.env.NUXT_SMTP_USER || '',
      pass: process.env.NUXT_SMTP_PASS || '',
      secure: process.env.NUXT_SMTP_SECURE === 'true',
      ignoreTLS: process.env.NUXT_SMTP_IGNORE_TLS === 'true',
    },
    database: {
      host: process.env.NUXT_DATABASE_HOST || 'localhost',
      port: process.env.NUXT_DATABASE_PORT || '5432',
      name: process.env.NUXT_DATABASE_NAME || 'keycloak',
      user: process.env.NUXT_DATABASE_USER || 'keycloak',
      password: process.env.NUXT_DATABASE_PASSWORD || 'password',
    },
    instanceId: process.env.NUXT_INSTANCE_ID || process.env.HOSTNAME || 'unknown',
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
  prometheus: {
    verbose: false,
    healthCheck: false,
  },
  scalar: {
    pathRouting: {
      basePath: '/docs',
    },
    title: 'Keycloak Group Manager',
  },
})
