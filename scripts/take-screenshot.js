const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 1. 設定瀏覽器視窗大小（確保畫面寬裕）
  await page.setViewportSize({ width: 1200, height: 800 });

  // 2. 組合完整預覽網址 (自動帶入 key)
  const baseUrl = process.env.WORKER_DOMAIN || 'https://checkin.twitchevent.workers.dev';
  const obsKey = process.env.OBS_KEY || '';
  
  const targetUrl = new URL('/checkin.html', baseUrl);
  targetUrl.searchParams.set('preview', 'true');
  if (obsKey) {
    targetUrl.searchParams.set('key', obsKey);
  }

  console.log('正在前往預覽網址進行精準截圖:', targetUrl.toString());
  
  // 3. 前往網頁並等待載入完成
  await page.goto(targetUrl.toString(), { 
    waitUntil: 'networkidle',
    timeout: 60000 
  });

  // 4. 鎖定固定的 ID，確保網頁完全渲染
  const widgetSelector = '#calendarWidget';[cite: 10]
  await page.waitForSelector(widgetSelector, { timeout: 30000 });

  // 5. 抓取該元素本身，進行「局部精準截圖」
  const widgetElement = await page.$(widgetSelector);
  const imagePath = path.join(__dirname, '../checkinpreview.png');
  
  await widgetElement.screenshot({ path: imagePath });

  console.log('日曆卡片精準截圖已成功儲存至:', imagePath);
  await browser.close();
})();
