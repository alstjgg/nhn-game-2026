import { expect, test, type Page } from 'playwright/test'

// [x9] the door types itself in — `shell/sign-in.ts` in a browser.
//
// THIS IS THE ONLY SPEC THAT SEES THE DOOR. Every other lane goes `page.goto('./')`
// and measures the DESK, and `signInSkipped()` keys off `navigator.webdriver`
// precisely so that they can: a modal curtain over the whole viewport would make
// all of them assert against it. `?signin=show` is the override, and it is the
// first line of every test below.
//
// The arithmetic — which press fills which line, which one arms LOGIN, which keys
// count at all — is proved in a node env by `tests/shell/sign-in.test.ts`, on
// every commit and in milliseconds. What is proved HERE is the half that only a
// browser can answer, and it is the half a player actually experiences:
//
//  · the door really is LOCKED on the first frame, in the DOM sense and the
//    visual one (a red slab with a sweep crossing it is not a locked control);
//  · a press really does land one character, and a TAP does too — which is the
//    difference between a door that opens on a phone and a dead end;
//  · Tab and Enter really are still the button's, not the wells';
//  · and the fifteenth press really does open the way to the desk.

/** The door, forced on. Resolves once the plate is up and locked. */
async function openDoor(page: Page, opts: { reduced?: boolean } = {}): Promise<void> {
  if (opts.reduced) await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('./?signin=show')
  await expect(page.locator('#signin')).toBeVisible()
}

const idValue = (page: Page) => page.locator('#signin .si-field').nth(0).locator('.si-value')
const maskValue = (page: Page) => page.locator('#signin .si-field').nth(1).locator('.si-value')
const idCaret = (page: Page) => page.locator('#signin .si-field').nth(0).locator('.si-caret')
const maskCaret = (page: Page) => page.locator('#signin .si-field').nth(1).locator('.si-caret')
const login = (page: Page) => page.locator('#signin .si-login')

/** `n` presses. The key is deliberately the same one every time — see (b). */
async function press(page: Page, n: number, key = 'a'): Promise<void> {
  for (let i = 0; i < n; i += 1) await page.keyboard.press(key)
}

test.describe('[x9] the door opens locked', () => {
  test('(a) both wells are empty and LOGIN is disabled on the first frame', async ({ page }) => {
    await openDoor(page)
    await expect(idValue(page)).toHaveText('')
    await expect(maskValue(page)).toHaveText('')
    await expect(login(page)).toBeDisabled()
    // The status the locked button reports, and the shortcut it does NOT claim:
    // `↵ ENTER` on a dead button would be an advertised key that does nothing.
    await expect(login(page)).toContainText('인증 대기')
    await expect(login(page)).not.toContainText('ENTER')
  })

  test('(b) `저장됨` is gone, and so is the claim it made', async ({ page }) => {
    await openDoor(page)
    await expect(page.locator('#signin')).not.toContainText('저장됨')
    await expect(page.locator('#signin .si-lock')).toHaveCount(0)
  })

  test('(c) the caret is in the id well and nowhere else', async ({ page }) => {
    await openDoor(page)
    await expect(idCaret(page)).toBeVisible()
    await expect(maskCaret(page)).toBeHidden()
    // The armed class is one class on one row — the label, the ring and the
    // caret all read it, so this is the whole hand-off in a single assertion.
    await expect(page.locator('#signin .si-field.is-armed')).toHaveCount(1)
  })

  test('(d) the locked slab LOOKS dead — greyed, and no invitation sweeping across it', async ({ page }) => {
    await openDoor(page)
    const skin = await login(page).evaluate((el) => ({
      filter: getComputedStyle(el).filter,
      sheen: getComputedStyle(el, '::after').display,
    }))
    // `pointer-events:none` used to be the whole of the locked state, which left
    // the most inviting object on the screen inert.
    expect(skin.filter, 'a disabled LOGIN is still in full seal red').toContain('grayscale')
    expect(skin.sheen, 'the highlight sweep is still running on a dead button').toBe('none')
  })

  test('(e) the membrane holds at the door — no field to type into', async ({ page }) => {
    await openDoor(page)
    await expect(page.locator('#signin input, #signin textarea, #signin select')).toHaveCount(0)
    await expect(page.locator('#signin [contenteditable]')).toHaveCount(0)
    // The one concession to an operator who cannot see the characters land: the
    // id echoes each one, the mask stays quiet. See `field()`.
    await expect(idValue(page)).toHaveAttribute('aria-live', 'polite')
    await expect(maskValue(page)).not.toHaveAttribute('aria-live', /.*/)
  })
})

test.describe('[x9] one press, one character', () => {
  test('(a) the first press writes O — not the key that was pressed', async ({ page }) => {
    await openDoor(page)
    await page.keyboard.press('z')
    // The whole mechanic in one assertion: `z` went in, `O` came out. What the
    // player pressed never reaches what the terminal wrote.
    await expect(idValue(page)).toHaveText('O')
    await expect(idValue(page)).not.toHaveText('z')
  })

  test('(b) seven presses fill the badge and move the caret to the mask', async ({ page }) => {
    await openDoor(page)
    await press(page, 7)
    await expect(idValue(page)).toHaveText('OP-2291')
    await expect(maskValue(page)).toHaveText('')
    // The seventh press does two things, and the second one is this: the caret
    // does not sit at the end of a finished line waiting for the eighth.
    await expect(idCaret(page)).toBeHidden()
    await expect(maskCaret(page)).toBeVisible()
    await expect(login(page)).toBeDisabled()
  })

  test('(c) fourteen presses do NOT open the door', async ({ page }) => {
    await openDoor(page)
    await press(page, 14)
    await expect(maskValue(page)).toHaveText('*******')
    await expect(login(page), 'a half-typed card armed LOGIN').toBeDisabled()
    await expect(maskCaret(page)).toBeVisible()
  })

  test('(d) the fifteenth arms LOGIN, takes focus, and drops the caret', async ({ page }) => {
    await openDoor(page)
    await press(page, 15)
    await expect(maskValue(page)).toHaveText('********')
    await expect(login(page)).toBeEnabled()
    // Focus IS the announcement — the only one this door makes, and the only one
    // it owes. An operator who cannot see the flash hears the button instead.
    await expect(login(page)).toBeFocused()
    await expect(login(page)).toContainText('ENTER')
    await expect(page.locator('#signin .si-field.is-armed')).toHaveCount(0)
    await expect(idCaret(page)).toBeHidden()
    await expect(maskCaret(page)).toBeHidden()
  })

  test('(e) the flash settles onto the resting red rather than pinning a filter', async ({ page }) => {
    await openDoor(page)
    await press(page, 15)
    // `siArm` carries no fill mode on purpose: filled, it would hold
    // `filter:none` forever and `:hover`/`:active` — which are nothing but a
    // filter and a transform — would never be seen again.
    await expect(async () => {
      const skin = await login(page).evaluate((el) => getComputedStyle(el).filter)
      expect(skin).toBe('none')
    }).toPass({ timeout: 3000 })
  })

  test('(f) a sixteenth press changes nothing — the layer has stopped listening', async ({ page }) => {
    await openDoor(page)
    await press(page, 15)
    await expect(login(page)).toBeEnabled()
    await press(page, 4)
    await expect(idValue(page)).toHaveText('OP-2291')
    await expect(maskValue(page)).toHaveText('********')
  })
})

test.describe('[x9] which presses the door hears', () => {
  test('(a) Tab and Enter are the button’s keyboard, never the wells’', async ({ page }) => {
    await openDoor(page)
    await press(page, 3, 'Tab')
    await press(page, 3, 'Enter')
    await press(page, 2, 'ArrowRight')
    await press(page, 2, 'Shift')
    // If any named key also typed, the last press of the card would fire the
    // button it had just enabled.
    await expect(idValue(page)).toHaveText('')
    await expect(login(page)).toBeDisabled()
  })

  test('(b) a tap counts as a press — the door is not a dead end without a keyboard', async ({ page }) => {
    await openDoor(page)
    // There is no focused field here to summon a soft keyboard, so on a phone
    // `keydown` never fires at all. This is the same gesture by another
    // instrument, and it is what keeps the deployed site openable on a touch
    // screen.
    await page.locator('#signin .si-well').first().click()
    await expect(idValue(page)).toHaveText('O')
    // And it pays again on a desktop: the player who reaches for the dead button
    // is taught the mechanic by the character that appears when they press it.
    await page.locator('#signin .si-login').click({ force: true })
    await expect(idValue(page)).toHaveText('OP')
  })

  test('(c) ⌘/⌃ presses belong to the browser', async ({ page }) => {
    await openDoor(page)
    await page.keyboard.press('Control+c')
    await page.keyboard.press('Control+a')
    await expect(idValue(page)).toHaveText('')
  })
})

test.describe('[x9] and then the desk', () => {
  test('(a) fifteen presses and one click hand the operator over', async ({ page }) => {
    await openDoor(page)
    await press(page, 15)
    await login(page).click()
    // The readout runs its five lines and its tail (2.4 s) and the layer fades
    // out over another 0.5 s. What is asserted is the hand-over itself: the
    // curtain is gone, `body.signin` is off (which is what replays the top bar's
    // drop), and the desk it was covering is there.
    await expect(page.locator('#signin')).toHaveCount(0, { timeout: 15_000 })
    await expect(page.locator('body.signin')).toHaveCount(0)
    await expect(page.locator('.win')).toHaveCount(3)
  })

  test('(b) reduced motion keeps the caret — it is the affordance now', async ({ page }) => {
    await openDoor(page, { reduced: true })
    // C18, and the outcome half of a guarantee that rests on two ABSENCES:
    // `base.css` collapses every animation to a 1 ms pass, and the caret survives
    // it only because `siBlink` carries no fill mode and because shown/hidden is
    // `display` rather than the opacity the blink is using. Both are pinned at
    // source in `tests/shell/sign-in.test.ts`; this is the same claim measured
    // where it matters — a still caret, on screen, on the row taking the press.
    await expect(idCaret(page)).toBeVisible()
    const shown = await idCaret(page).evaluate((el) => Number(getComputedStyle(el).opacity))
    expect(shown, 'the caret settled on the blink’s dark half').toBeGreaterThan(0.5)
    // The mechanic still works with the motion off.
    await press(page, 15)
    await expect(login(page)).toBeEnabled()
  })
})
