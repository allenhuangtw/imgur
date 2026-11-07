const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.setViewportSize({ width: 1200, height: 800 });

  const baseUrl = process.env.WORKER_DOMAIN || 'https://checkin.twitchevent.workers.dev';
  const obsKey = process.env.OBS_KEY || '';
  
  // 檢查有沒有抓到金鑰（只印出有或無，保護你的隱私）
  console.log('【檢查】WORKER_DOMAIN:', baseUrl);
  console.log('【檢查】OBS_KEY 是否有值:', obsKey ? '有的 (已成功載入)' : '❌ 沒有值 (空的！)');

  const targetUrl = new URL('/checkin.html', baseUrl);
  targetUrl.searchParams.set('preview', 'true');
  if (obsKey) {
    targetUrl.searchParams.set('key', obsKey);
  }

  console.log('正在前往預覽網址進行精準截圖:', targetUrl.toString());
  
  await page.goto(targetUrl.toString(), { 
    waitUntil: 'networkidle',
    timeout: 60000 
  });

  const widgetSelector = '#calendarWidget';
  await page.waitForSelector(widgetSelector, { timeout: 30000 });

  const widgetElement = await page.$(widgetSelector);
  const imagePath = path.join(__dirname, '../checkinpreview.png');
  
  await widgetElement.screenshot({ path: imagePath });

  console.log('日曆卡片精準截圖已成功儲存至:', imagePath);
  await browser.close();
})();
