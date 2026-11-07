const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.setViewportSize({ width: 1200, height: 800 });

  const baseUrl = process.env.WORKER_DOMAIN || 'https://checkin.twitchevent.workers.dev';
  const obsKey = process.env.OBS_KEY || '';
  
  // 直接使用根目錄，不加 /checkin.html
  const targetUrl = new URL(baseUrl);
  targetUrl.searchParams.set('preview', 'true');
  if (obsKey) {
    targetUrl.searchParams.set('key', obsKey);
  }

  console.log('正在前往根目錄預覽網址:', targetUrl.toString());
  
  try {
    await page.goto(targetUrl.toString(), { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });

    const widgetSelector = '#calendarWidget';
    await page.waitForSelector(widgetSelector, { timeout: 15000 });

    const widgetElement = await page.$(widgetSelector);
    const imagePath = path.join(__dirname, '../checkinpreview.png');
    await widgetElement.screenshot({ path: imagePath });
    console.log('✅ 日曆卡片精準截圖成功！');

  } catch (err) {
    console.log('❌ 發生超時，印出當前畫面原始碼進行診斷...');
    const errImagePath = path.join(__dirname, '../checkinpreview.png');
    await page.screenshot({ path: errImagePath, fullPage: true });
    
    const htmlContent = await page.content();
    console.log('--- 實際載入的網頁 HTML 開始 ---');
    console.log(htmlContent.substring(0, 1500));
    console.log('--- 實際載入的網頁 HTML 結束 ---');
    
    throw err;
  } finally {
    await browser.close();
  }
})();
