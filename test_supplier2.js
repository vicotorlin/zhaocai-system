const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('CONSOLE_ERR:', msg.text());
  });
  page.on('pageerror', err => console.log('PAGE_ERR:', err.message));

  await page.goto('http://localhost:3000/dashboard.html?account=supplier@test.com&role=supplier', { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(2000);

  console.log('CURRENT_VIEW:', await page.evaluate(() => {
    const active = document.querySelector('.view.active');
    return active ? active.id : 'none';
  }));

  // Find the bid button in the supplier projects table
  const bidBtns = page.locator('button[data-action="supplier-bid"]');
  const btnCount = await bidBtns.count();
  console.log('SUPPLIER_BID_BTN_COUNT:', btnCount);
  
  if (btnCount > 0) {
    const pid = await bidBtns.first().getAttribute('data-pid');
    console.log('PID:', pid);

    // Manually trigger the openSupplierBid function
    await page.evaluate((p) => {
      window.openSupplierBid(p);
    }, pid);
    
    await page.waitForTimeout(2000);

    // Check if iframe has src
    const iframeSrc = await page.evaluate(() => {
      const iframe = document.getElementById('sfIframe');
      return iframe ? iframe.src : 'no iframe';
    });
    console.log('IFRAME_SRC:', iframeSrc);

    // Check the select value
    const selectVal = await page.evaluate(() => {
      const sel = document.getElementById('sfProjectSelect');
      return sel ? sel.value : 'no select';
    });
    console.log('SELECT_VAL:', selectVal);

    // Check which view is active
    const activeView = await page.evaluate(() => {
      const active = document.querySelector('.view.active');
      return active ? active.id : 'none';
    });
    console.log('ACTIVE_VIEW:', activeView);
  }

  await page.screenshot({ path: 'C:/Users/linguodong/Documents/Codex/2026-07-07/new-chat-2/supplier_test2.png' });
  await browser.close();
  console.log('DONE');
})();
