import { expect, test } from '@playwright/test';

const HARNESS = '/e2e/harness/inference/index.html';

test.describe('in-game inference comparison controls', () => {
  test('switches model/effort and shows safe run telemetry', async ({ page }, testInfo) => {
    await page.goto(HARNESS);

    const panel = page.getByTestId('inference-panel');
    await expect(panel).toBeVisible();
    await expect(page.getByTestId('inference-connection')).toHaveText(
      'LIVE · 요청별 설정',
    );
    await expect(page.locator('select, input, textarea')).toHaveCount(0);

    const nova = page.getByRole('button', { name: 'Nova 2 Lite' });
    const haiku = page.getByRole('button', { name: 'Claude Haiku 4.5' });
    await expect(nova).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: '높음' })).toHaveCount(0);

    await haiku.click();
    await expect(haiku).toHaveAttribute('aria-pressed', 'true');
    const high = page.getByRole('button', { name: '높음' });
    await expect(high).toBeVisible();
    await high.click();
    await expect(high).toHaveAttribute('aria-pressed', 'true');

    await page.evaluate(() => {
      (
        window as unknown as {
          __inference: { finish(fallback?: boolean): void };
        }
      ).__inference.finish(false);
    });
    await expect(page.getByTestId('inference-history')).toContainText(
      'Claude Haiku 4.5 · 높음 · 1.2초 · 입력 200 / 출력 456t · LIVE',
    );
    await page.screenshot({
      path: testInfo.outputPath('inference-panel.png'),
      fullPage: true,
    });
  });
});
