// The shipped demo uses the request-first Doodle Life vertical slice.
const entry = import('./doodle-life-main.ts')

void entry.catch((error: unknown) => {
  const app = document.querySelector<HTMLDivElement>('#app')
  if (!app) return

  app.innerHTML = `
    <main class="boot-error">
      <p class="eyebrow">Doodle Life</p>
      <h1>정원을 깨우지 못했어요.</h1>
      <p>개발 서버를 다시 시작한 뒤 새로고침해 주세요.</p>
      <button type="button">다시 시도</button>
    </main>
  `
  app.querySelector('button')?.addEventListener('click', () => window.location.reload())
  console.error(error)
})
