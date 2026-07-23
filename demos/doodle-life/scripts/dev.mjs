import { createServer } from 'node:net'
import { readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseEnv } from 'node:util'
import concurrently from 'concurrently'

const demoDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const blankFileValuesThatFallThrough = new Set([
  'OPENAI_API_KEY',
  'AI_PROVIDER',
])
const environment = await configuredEnvironment()
const provider = parseProvider(process.argv.slice(2), environment.AI_PROVIDER)

if (provider === 'help') {
  printUsage()
  process.exit(0)
}

if (provider === 'openai' && !environment.OPENAI_API_KEY?.trim()) {
  fail('The api provider requires OPENAI_API_KEY in the shell, .env, or repository .env.local.')
}

const apiPort = positiveInteger(environment.AI_PORT || environment.PORT, 8787, 'AI_PORT')
const webPort = await selectWebPort(environment.VITE_PORT)
const selectedProvider = provider === 'auto' ? undefined : provider
const apiEnvironment = {
  ...environment,
  AI_PORT: String(apiPort),
  AI_CORS_ORIGINS: corsOrigins(environment.AI_CORS_ORIGINS, webPort),
  ...(selectedProvider ? { AI_PROVIDER: selectedProvider } : {}),
  ...(provider === 'openai' ? {
    AI_TIMEOUT_MS: environment.AI_TIMEOUT_MS?.trim() || '180000',
    SERVER_REQUEST_TIMEOUT_MS: environment.SERVER_REQUEST_TIMEOUT_MS?.trim() || '660000',
  } : {}),
}

const commands = [
  {
    command: 'npm run dev:server',
    name: 'api',
    prefixColor: 'magenta',
    cwd: demoDirectory,
    env: apiEnvironment,
  },
  {
    command: 'npm run dev:client',
    name: 'web',
    prefixColor: 'cyan',
    cwd: demoDirectory,
    env: {
      // Vite only needs browser-safe settings. Do not copy server-only values
      // loaded from repository .env files into the client process.
      ...environmentWithout(process.env, ['OPENAI_API_KEY']),
      AI_PORT: String(apiPort),
      VITE_PORT: String(webPort),
      ...(provider === 'openai' ? {
        VITE_AI_CLIENT_TIMEOUT_MS: environment.VITE_AI_CLIENT_TIMEOUT_MS?.trim() || '720000',
      } : {}),
    },
  },
]

console.log(`Doodle Life provider: ${providerLabel(provider)}`)
const { result } = concurrently(commands, {
  killOthersOn: ['failure', 'success'],
  prefix: 'name',
})

try {
  await result
} catch {
  process.exitCode = 1
}

function parseProvider(args, environmentProvider) {
  let raw = undefined
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    if (argument === '--help' || argument === '-h') return 'help'
    if (argument === '--provider') {
      raw = args[index + 1]
      index += 1
      if (!raw) fail('Missing value after --provider.')
      continue
    }
    if (argument.startsWith('--provider=')) {
      raw = argument.slice('--provider='.length)
      continue
    }
    fail(`Unknown option: ${argument}`)
  }

  const normalized = (raw ?? environmentProvider ?? '').trim().toLowerCase()
  if (normalized === '' || normalized === 'auto') return 'auto'
  if (normalized === 'api' || normalized === 'openai') return 'openai'
  if (normalized === 'mock') return normalized
  fail(`Unsupported provider: ${normalized}`)
}

function environmentWithout(environment, names) {
  const filtered = { ...environment }
  for (const name of names) delete filtered[name]
  return filtered
}

function corsOrigins(configuredOrigins, webPort) {
  return [...new Set([
    ...(configuredOrigins ?? '').split(',').map((origin) => origin.trim()).filter(Boolean),
    `http://localhost:${webPort}`,
    `http://127.0.0.1:${webPort}`,
  ])].join(',')
}

function positiveInteger(value, fallback, name) {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed <= 0) fail(`Invalid ${name}: ${value}`)
  return parsed
}

async function selectWebPort(configuredPort) {
  if (configuredPort) return positiveInteger(configuredPort, 5173, 'VITE_PORT')
  for (let port = 5173; port <= 5193; port += 1) {
    if (await portIsAvailable(port)) return port
  }
  fail('Could not find an available Vite port between 5173 and 5193.')
}

async function portIsAvailable(port) {
  return await new Promise((resolveAvailability) => {
    const probe = createServer()
    probe.unref()
    probe.once('error', () => resolveAvailability(false))
    // Match Vite's localhost binding (often ::1 on macOS), otherwise an IPv6
    // listener can be missed by an IPv4-only probe.
    probe.listen(port, 'localhost', () => {
      probe.close(() => resolveAvailability(true))
    })
  })
}

async function configuredEnvironment() {
  const fileEnvironment = {}
  for (const path of [
    join(demoDirectory, '.env'),
    resolve(demoDirectory, '../../.env.local'),
  ]) {
    try {
      const parsed = parseEnv(await readFile(path, 'utf8'))
      for (const [name, value] of Object.entries(parsed)) {
        if (value === undefined) continue
        const existing = fileEnvironment[name]
        const replacesBlankFallback = blankFileValuesThatFallThrough.has(name)
          && existing !== undefined
          && existing.trim() === ''
          && value.trim() !== ''
        // The demo file wins except for blank credential/provider placeholders;
        // the parent shell always wins when it is spread below.
        if (!Object.hasOwn(fileEnvironment, name) || replacesBlankFallback) {
          fileEnvironment[name] = value
        }
      }
    } catch (error) {
      if (!isMissingFileError(error)) throw error
    }
  }
  return { ...fileEnvironment, ...process.env }
}

function isMissingFileError(error) {
  return typeof error === 'object' && error !== null && error.code === 'ENOENT'
}

function providerLabel(value) {
  if (value === 'openai') return 'OpenAI Responses API'
  if (value === 'mock') return 'deterministic mock'
  return 'automatic (.env / API-key fallback)'
}

function printUsage() {
  console.log(`Usage: npm run dev -- --provider=<mode>

Modes:
  api     Use the OpenAI Responses API (alias: openai)
  mock    Use deterministic local generation without model calls

With no parameter, the existing AI_PROVIDER / API-key fallback is preserved.`)
}

function fail(message) {
  console.error(message)
  printUsage()
  process.exit(1)
}
