const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 1. 設定畫面大小
  await page.setViewportSize({ width: 1200, height: 800 });

  // 2. 讀取環境變數中的網址與金鑰，自動組合完整網址
  const baseUrl = process.env.WORKER_DOMAIN || 'https://checkin.twitchevent.workers.dev';
  const obsKey = process.env.OBS_KEY || '';
  
  const targetUrl = new URL('/checkin.html', baseUrl);
  targetUrl.searchParams.set('preview', 'true');
  if (obsKey) {
    targetUrl.searchParams.set('key', obsKey);
  }

  console.log('正在前往預覽網址進行精準截圖:', targetUrl.toString());
  
  // 3. 前往網頁並等待網路請求完成
  await page.goto(targetUrl.toString(), { 
    waitUntil: 'networkidle',
    timeout: 60000 
  });

  // 4. 改用穩定的 ID `#calendarWidget` 來確保區塊已渲染
  const widgetSelector = '#calendarWidget';
  await page.waitForSelector(widgetSelector, { timeout: 30000 });

  // 5. 針對該元素本身進行局部精準截圖
  const widgetElement = await page.$(widgetSelector);
  const imagePath = path.join(__dirname, '../checkinpreview.png');
  
  await widgetElement.screenshot({ path: imagePath });

  console.log('日曆卡片精準截圖已成功儲存至:', imagePath);
  await browser.close();
})();
