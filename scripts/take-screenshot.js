const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 1. 設定畫面大小
  await page.setViewportSize({ width: 1200, height: 800 });

  const baseUrl = process.env.WORKER_DOMAIN || 'https://checkin.twitchevent.workers.dev';
  
  // 🌟 加上 .trim() 自動清除金鑰前後可能不小心多出的空白或換行
  const obsKey = (process.env.OBS_KEY || '').trim();
  
  // 🎯 組合正確的 /checkin.html 網址
  const targetUrl = `${baseUrl}/checkin.html?preview=true&key=${encodeURIComponent(obsKey)}&font=wenkai`;

  console.log('正在前往預覽網址:', `${baseUrl}/checkin.html?preview=true&key=***&font=wenkai`);
  
  try {
    // 2. 前往網頁並等待網路閒置
    await page.goto(targetUrl, { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });

    // 3. 進入後等待 5 秒讓前端完全渲染
    console.log('已進入網頁，正在等待 5 秒鐘讓內容完全渲染...');
    await page.waitForTimeout(5000);

    // 4. 強制讓 #calendarWidget 顯示出來（加上 .show 類別）
    await page.evaluate(() => {
      const widget = document.getElementById('calendarWidget');
      if (widget) {
        widget.classList.add('show');
      }
    });

    // 🌟 5. 將網頁背景清除，改為完全透明
    await page.evaluate(() => {
      document.body.style.backgroundColor = 'transparent';
      const htmlEl = document.documentElement;
      if (htmlEl) htmlEl.style.backgroundColor = 'transparent';
    });

    // 6. 再給 1 秒讓動畫穩定
    await page.waitForTimeout(1000);

    // 7. 🎯 鎖定目標：#calendarWidget 進行精準局部截圖
    const widgetSelector = '#calendarWidget';
    await page.waitForSelector(widgetSelector, { timeout: 15000 });

    const widgetElement = await page.$(widgetSelector);
    const imagePath = path.join(__dirname, '../checkinpreview.png');
    
    // 🌟 關鍵：omitBackground: true 讓截圖背景變成透明（支援 PNG 格式）
    await widgetElement.screenshot({ 
      path: imagePath,
      omitBackground: true 
    });
    
    console.log('✅ 成功鎖定 #calendarWidget，透明背景精準截圖已儲存至:', imagePath);

  } catch (err) {
    console.log('❌ 發生錯誤！目前的網頁標題:', await page.title());
    console.log('目前的網址:', page.url().replace(/key=[^&]*/, 'key=***'));
    
    const errImagePath = path.join(__dirname, '../checkinpreview.png');
    await page.screenshot({ path: errImagePath, fullPage: true });
    
    throw err;
  } finally {
    await browser.close();
  }
})();
