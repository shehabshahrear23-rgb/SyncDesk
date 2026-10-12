import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import net from 'node:net'
import path from 'node:path'

const BACKEND_PORT = 8000
const BACKEND_DIR = path.resolve(process.cwd(), 'backend')
const backendState = (globalThis.__syncdeskBackend ??= { child: null, exitHookAdded: false })

const isPortOpen = (port) =>
  new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port })
    socket.once('connect', () => { socket.destroy(); resolve(true) })
    socket.once('error', () => resolve(false))
    socket.setTimeout(1500, () => { socket.destroy(); resolve(false) })
  })

const findPython = () => {
  for (const base of [BACKEND_DIR, process.cwd()]) {
    for (const env of ['venv', '.venv', 'env']) {
      for (const exe of [path.join(base, env, 'Scripts', 'python.exe'), path.join(base, env, 'bin', 'python')]) {
        if (existsSync(exe)) return exe
      }
    }
  }
  return ['python', 'py', 'python3'].find(
    (command) => spawnSync(command, ['--version'], { stdio: 'ignore' }).status === 0
  )
}

function syncdeskBackend() {
  return {
    name: 'syncdesk-backend',
    apply: 'serve',
    async configureServer(server) {
      const log = (message) => server.config.logger.info(`\x1b[36m[SyncDesk]\x1b[0m ${message}`)

      if (backendState.child) return
      if (!existsSync(path.join(BACKEND_DIR, 'app', 'main.py'))) {
        log('No backend/app/main.py found, so the backend was not started.')
        return
      }
      if (await isPortOpen(BACKEND_PORT)) {
        log(`Backend is already running on port ${BACKEND_PORT}.`)
        return
      }

      const python = findPython()
      if (!python) {
        log('Python was not found, so the backend could not be started.')
        return
      }

      log(`Starting the backend on port ${BACKEND_PORT}...`)
      const child = spawn(
        python,
        ['-m', 'uvicorn', 'app.main:app', '--port', String(BACKEND_PORT)],
        { cwd: BACKEND_DIR, stdio: 'inherit' }
      )
      backendState.child = child

      child.once('error', (error) => {
        backendState.child = null
        log(`The backend could not be started: ${error.message}`)
      })
      child.once('exit', (code) => {
        backendState.child = null
        if (code) {
          log(`The backend stopped with an error (code ${code}). The lines above this one say why.`)
        }
      })

      if (!backendState.exitHookAdded) {
        backendState.exitHookAdded = true
        process.once('exit', () => backendState.child?.kill())
        for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
          process.once(signal, () => {
            backendState.child?.kill()
            process.exit()
          })
        }
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), syncdeskBackend()],
  server: {
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${BACKEND_PORT}`,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (error, request, response) => {
            if (!response || typeof response.writeHead !== 'function' || response.headersSent) return
            response.writeHead(503, { 'Content-Type': 'application/json' })
            response.end(JSON.stringify({
              code: 'backend_offline',
              detail: 'The SyncDesk backend is not running. Stop "npm run dev" with Ctrl+C and start it again.',
            }))
          })
        },
      },
    },
  },
})
