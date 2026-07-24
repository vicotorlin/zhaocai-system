const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('CONSOLE_ERR:', msg.text());
  });
  page.on('pageerror', err => console.log('PAGE_ERR:', err.message));

  // Login as supplier
  await page.goto('http://localhost:3000/dashboard.html?account=supplier@test.com&role=supplier', { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(2000);

  // Click the bid button in the project table
  const bidBtn = page.locator('button:has-text("报价")');
  const count = await bidBtn.count();
  console.log('BID_BTN_COUNT:', count);
  
  if (count > 0) {
    await bidBtn.first().click();
    await page.waitForTimeout(3000);
    
    // Check if iframe loaded
    const iframe = page.locator('#sfIframe');
    const iframeCount = await iframe.count();
    console.log('IFRAME_COUNT:', iframeCount);
    
    if (iframeCount > 0) {
      const src = await iframe.getAttribute('src');
      console.log('IFRAME_SRC:', src);
      
      // Check if iframe content loaded
      try {
        const iframeEl = await iframe.elementHandle();
        const frame = await iframeEl.contentFrame();
        if (frame) {
          const title = await frame.title();
          console.log('IFRAME_TITLE:', title);
          const bodyText = await frame.evaluate(() => document.body.innerText.substring(0, 200));
          console.log('IFRAME_BODY:', bodyText);
        } else {
          console.log('FRAME_NOT_ACCESSIBLE (cross-origin)');
        }
      } catch (e) {
        console.log('IFRAME_ERROR:', e.message);
      }
    }
  } else {
    console.log('NO_BID_BUTTON');
  }

  await page.screenshot({ path: 'C:/Users/linguodong/Documents/Codex/2026-07-07/new-chat-2/supplier_quote_test.png' });
  await browser.close();
  console.log('DONE');
})();
