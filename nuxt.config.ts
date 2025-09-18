// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxt/test-utils',
  ],
  devtools: {
    enabled: true,
  },
  devServer: {
    host: '0.0.0.0',
    port: import.meta.env.API_PORT ?? 8080,
  },
  compatibilityDate: '2025-07-15',
  typescript: {
    strict: true,
  },
  eslint: {
    config: {
      stylistic: true,
      formatters: false,
      typescript: true,
      standalone: false,
    },
  },
})
