import { spawn } from 'node:child_process'

const specUrl = process.env.HEY_API_INPUT ?? 'http://localhost:8080/api/openapi.json'
const deadline = Date.now() + 60_000

async function waitForSpec() {
  while (Date.now() < deadline) {
    try {
      const response = await fetch(specUrl)
      if (response.ok) {
        return true
      }
    } catch {
      // Keep retrying until the backend is ready.
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000))
  }
  return false
}

const ready = await waitForSpec()
if (ready) {
  await new Promise((resolve, reject) => {
    const generate = spawn('npx', ['openapi-ts'], { stdio: 'inherit', shell: true })
    generate.on('exit', (code) => {
      if (code === 0) {
        resolve(undefined)
        return
      }
      reject(new Error(`generate:client exited with code ${code ?? 1}`))
    })
  })
} else {
  console.warn(`OpenAPI endpoint not reachable at ${specUrl}; skipping initial client generation.`)
}

const vite = spawn('npx', ['vite', '--host', '0.0.0.0'], { stdio: 'inherit', shell: true })
vite.on('exit', (code) => process.exit(code ?? 0))
