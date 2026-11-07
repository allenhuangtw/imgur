const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 1. 設定畫面大小
  await page.setViewportSize({ width: 1200, height: 800 });

  // 2. 組合正確的根目錄預覽網址 (帶有 preview=true 與 key)
  const baseUrl = process.env.WORKER_DOMAIN || 'https://checkin.twitchevent.workers.dev';
  const obsKey = process.env.OBS_KEY || '';
  
  const targetUrl = `${baseUrl}/?preview=true&key=${obsKey}`;

  console.log('正在前往正確的預覽網址進行截圖:', targetUrl);
  
  try {
    // 3. 前往網頁
    await page.goto(targetUrl, { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });

    // 4. 【關鍵保險】強行在網頁端執行 JavaScript，確保卡片強制顯示出來
    await page.evaluate(() => {
      const widget = document.getElementById('calendarWidget');
      if (widget) {
        widget.classList.add('show');
      }
    });

    // 5. 稍微等待 2 秒讓渲染與動畫完全完成
    await page.waitForTimeout(2000);

    // 6. 鎖定固定的 ID 進行精準局部截圖
    const widgetSelector = '#calendarWidget';
    const widgetElement = await page.$(widgetSelector);
    
    if (!widgetElement) {
      throw new Error('找不到 #calendarWidget 元素');
    }

    const imagePath = path.join(__dirname, '../checkinpreview.png');
    await widgetElement.screenshot({ path: imagePath });
    
    console.log('✅ 日曆卡片精準截圖成功，已儲存至:', imagePath);

  } catch (err) {
    console.log('❌ 發生錯誤，正在拍攝當前畫面進行診斷...');
    const errImagePath = path.join(__dirname, '../checkinpreview.png');
    await page.screenshot({ path: errImagePath, fullPage: true });
    
    throw err;
  } finally {
    await browser.close();
  }
})();
