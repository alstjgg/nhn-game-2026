import './style.css'

/**
 * Placeholder render loop.
 *
 * Purpose: prove the full build → GitHub Pages deploy pipeline works visually,
 * before any engine/genre decision is made. Replace freely once the engine lands.
 *
 * This is the only module in the repo allowed to touch the DOM — see the
 * physical architecture §3.2. `engine`, `composer`, and `shared` are compiled
 * without the DOM lib, so the same restriction is enforced by the compiler
 * rather than by convention.
 */
export function mountPlaceholder(): void {
  const app = document.querySelector<HTMLDivElement>('#app')
  if (!app) throw new Error('#app root not found')

  const canvas = document.createElement('canvas')
  canvas.width = 480
  canvas.height = 270
  app.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas context unavailable')

  let t = 0
  function frame(): void {
    if (!ctx) return
    t += 0.02
    // Pulsing background so it's obvious the loop is live, not a static image.
    const pulse = Math.round(24 + 12 * Math.sin(t))
    ctx.fillStyle = `rgb(${pulse}, ${pulse + 8}, ${pulse + 20})`
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = '#4fc3f7'
    ctx.fillRect(200, 105, 80, 60)

    ctx.fillStyle = '#ffffff'
    ctx.font = '20px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('hello, nhn-game-2026', canvas.width / 2, 50)
    ctx.font = '12px system-ui, sans-serif'
    ctx.fillStyle = '#8a9bb0'
    ctx.fillText('deploy pipeline OK · engine TBD', canvas.width / 2, 240)

    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}
