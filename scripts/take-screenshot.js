const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 1. 設定畫面大小
  await page.setViewportSize({ width: 1200, height: 800 });

  const baseUrl = process.env.WORKER_DOMAIN || 'https://checkin.twitchevent.workers.dev';
  const obsKey = process.env.OBS_KEY || '';
  
  // 🌟 關鍵修正：使用 encodeURIComponent 完美保護金鑰中的特殊符號（如 +、/ 等）
  const targetUrl = `${baseUrl}/checkin.html?preview=true&key=${encodeURIComponent(obsKey)}`;

  console.log('正在前往預覽網址:', targetUrl);
  
  try {
    // 2. 前往正確的 /checkin.html 頁面
    await page.goto(targetUrl, { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });

    // 3. 強制讓日曆元件顯示出來
    await page.evaluate(() => {
      const widget = document.getElementById('calendarWidget');
      if (widget) {
        widget.classList.add('show');
      }
    });

    // 4. 等待 2 秒讓動畫完成
    await page.waitForTimeout(2000);

    // 5. 鎖定 ID 進行精準截圖
    const widgetSelector = '#calendarWidget';
    const widgetElement = await page.$(widgetSelector);
    
    if (!widgetElement) {
      throw new Error('找不到 #calendarWidget 元素');
    }

    const imagePath = path.join(__dirname, '../checkinpreview.png');
    await widgetElement.screenshot({ path: imagePath });
    
    console.log('✅ 日曆卡片精準截圖成功，已儲存至:', imagePath);

  } catch (err) {
    console.log('❌ 發生錯誤，正在印出當前網頁內容進行診斷...');
    const htmlContent = await page.content();
    console.log('--- 實際載入的網頁 HTML 開始 ---');
    console.log(htmlContent.substring(0, 1500));
    console.log('--- 實際載入的網頁 HTML 結束 ---');
    
    throw err;
  } finally {
    await browser.close();
  }
})();
