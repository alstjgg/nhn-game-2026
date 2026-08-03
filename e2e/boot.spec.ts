import { expect, test } from 'playwright/test'

// Scaffold smoke: the harness itself must be a real pass, not an empty suite.
// u11 replaces this with the spec §7 acceptance run-through.
test('the app root mounts at the 1280×800 minimum viewport', async ({ page }) => {
  await page.goto('./')
  await expect(page.locator('#app')).toBeAttached()
  expect(page.viewportSize()).toEqual({ width: 1280, height: 800 })
})
