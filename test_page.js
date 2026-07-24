const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('CONSOLE_ERR:', msg.text());
  });
  page.on('pageerror', err => console.log('PAGE_ERR:', err.message));

  await page.goto('http://localhost:3000/dashboard.html?account=794474441@qq.com&role=buyer', { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(2000);

  const btn = page.locator('button:has-text("发布新项目")');
  const count = await btn.count();
  console.log('BTN_COUNT:', count);
  if (count > 0) {
    console.log('BTN_VISIBLE:', await btn.isVisible());
    try {
      await btn.click({ timeout: 3000 });
      await page.waitForTimeout(1000);
      const modal = page.locator('#createProjectModal');
      console.log('MODAL_CLASS:', await modal.getAttribute('class'));
    } catch (e) {
      console.log('CLICK_FAIL:', e.message);
    }
  } else {
    console.log('BTN_NOT_FOUND');
  }

  await page.screenshot({ path: 'C:/Users/linguodong/Documents/Codex/2026-07-07/new-chat-2/debug_screenshot.png' });
  await browser.close();
  console.log('DONE');
})();
