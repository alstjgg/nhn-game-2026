const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8888/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/tmp/darkest-context-demo.png' });
  await browser.close();
  console.log('Screenshot saved');
})();
