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

  // Click the button to open modal
  const btn = page.locator('button:has-text("发布新项目")');
  await btn.click();
  await page.waitForTimeout(1000);

  // Fill the form
  await page.fill('#cpName', '测试项目-自动化设备采购');
  await page.fill('#cpPlan', '这是一条测试项目企划内容');
  await page.fill('#cpChannelVolume', '渠道A：预计采购100台');
  await page.fill('#cpTechParams', '参数1：电压220V');
  await page.fill('#cpDeadline', '2026-09-30');
  await page.waitForTimeout(500);

  // Click the publish button in the modal (exact match)
  const pubBtn = page.locator('button:has-text("发布"):not(:has-text("新项目"))');
  const c = await pubBtn.count();
  console.log('PUB_BTN_COUNT:', c);
  
  try {
    await pubBtn.click({ timeout: 5000 });
    await page.waitForTimeout(2000);
  } catch (e) {
    console.log('PUBLISH_CLICK_FAIL:', e.message);
  }

  // Check if modal closed
  const modal = page.locator('#createProjectModal');
  const cls = await modal.getAttribute('class');
  console.log('MODAL_CLASS_AFTER:', cls);

  // Check toast
  const toastCount = await page.locator('.toast').count();
  console.log('TOAST_COUNT:', toastCount);
  if (toastCount > 0) {
    const txt = await page.locator('.toast').first().textContent();
    console.log('TOAST_TEXT:', txt);
  }

  await page.screenshot({ path: 'C:/Users/linguodong/Documents/Codex/2026-07-07/new-chat-2/test_publish2.png' });
  await browser.close();
  console.log('DONE');
})();
