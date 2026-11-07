const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 設定畫面大小
  await page.setViewportSize({ width: 1200, height: 800 });

  const baseUrl = process.env.WORKER_DOMAIN || 'https://checkin.twitchevent.workers.dev';
  const obsKey = process.env.OBS_KEY || '';
  
  // 組合出跟你在瀏覽器成功打開一模一樣的完整正確網址
  const targetUrl = `${baseUrl}/checkin.html?preview=true&key=${obsKey}`;

  console.log('正在前往正確的預覽網址進行截圖:', targetUrl);
  
  try {
    await page.goto(targetUrl, { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });

    // 鎖定固定 ID 的日曆卡片
    const widgetSelector = '#calendarWidget';
    await page.waitForSelector(widgetSelector, { timeout: 15000 });

    // 進行局部精準截圖
    const widgetElement = await page.$(widgetSelector);
    const imagePath = path.join(__dirname, '../checkinpreview.png');
    await widgetElement.screenshot({ path: imagePath });
    
    console.log('✅ 日曆卡片精準截圖成功，已儲存至:', imagePath);

  } catch (err) {
    console.log('❌ 發生超時或找不到元素，正在拍攝當前畫面進行診斷...');
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
