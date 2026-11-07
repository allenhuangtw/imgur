const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 1. 設定畫面大小
  await page.setViewportSize({ width: 1200, height: 800 });

  const baseUrl = process.env.WORKER_DOMAIN || 'https://checkin.twitchevent.workers.dev';
  const obsKey = process.env.OBS_KEY || '';
  
  // 🎯 鎖定正確的 /checkin.html 路徑，並用 encodeURIComponent 保護金鑰
  const targetUrl = `${baseUrl}/checkin.html?preview=true&key=${encodeURIComponent(obsKey)}`;

  console.log('正在前往正確的預覽網址:', targetUrl);
  
  try {
    // 2. 前往網頁並等待網路閒置
    await page.goto(targetUrl, { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });

    // 🌟 聽你的！進入後紮實等待 5 秒，讓所有前端 JS、頭像與樣式完全渲染
    console.log('已進入網頁，正在等待 5 秒鐘讓內容完全渲染...');
    await page.waitForTimeout(5000);

    // 3. 強制讓 #calendarWidget 顯示出來（加上 .show 類別）
    await page.evaluate(() => {
      const widget = document.getElementById('calendarWidget');
      if (widget) {
        widget.classList.add('show');
      }
    });

    // 4. 再給 1 秒讓顯示動畫穩定
    await page.waitForTimeout(1000);

    // 5. 🎯 鎖定目標：#calendarWidget 進行精準局部截圖
    const widgetSelector = '#calendarWidget';
    await page.waitForSelector(widgetSelector, { timeout: 15000 });

    const widgetElement = await page.$(widgetSelector);
    const imagePath = path.join(__dirname, '../checkinpreview.png');
    await widgetElement.screenshot({ path: imagePath });
    
    console.log('✅ 成功鎖定 #calendarWidget，精準截圖已儲存至:', imagePath);

  } catch (err) {
    console.log('❌ 發生錯誤！目前的網頁標題:', await page.title());
    console.log('目前的完整網址:', page.url());
    
    const errImagePath = path.join(__dirname, '../checkinpreview.png');
    await page.screenshot({ path: errImagePath, fullPage: true });
    
    throw err;
  } finally {
    await browser.close();
  }
})();
