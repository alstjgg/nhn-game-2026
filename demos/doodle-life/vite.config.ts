import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  server: {
    port: envPort('VITE_PORT', 5173),
    strictPort: true,
    proxy: {
      '/api': `http://127.0.0.1:${envPort('AI_PORT', envPort('PORT', 8787))}`,
    },
  },
})

function envPort(name: string, fallback: number): number {
  const parsed = Number(process.env[name])
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}
