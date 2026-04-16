import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: process.env.HEY_API_INPUT ?? 'http://localhost:8080/api/openapi.json',
  output: 'src/client',
  plugins: [
    '@hey-api/client-fetch',
    '@hey-api/sdk',
  ],
})
