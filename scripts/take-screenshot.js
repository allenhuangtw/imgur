const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 設定畫面大小
  await page.setViewportSize({ width: 1200, height: 800 });

  const baseUrl = process.env.WORKER_DOMAIN || 'https://checkin.twitchevent.workers.dev';
  const obsKey = process.env.OBS_KEY || '';
  
  const targetUrl = new URL('/checkin.html', baseUrl);
  targetUrl.searchParams.set('preview', 'true');
  if (obsKey) {
    targetUrl.searchParams.set('key', obsKey);
  }

  console.log('正在前往預覽網址:', targetUrl.toString());
  
  try {
    // 前往網頁
    await page.goto(targetUrl.toString(), { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });

    // 嘗試等待日曆元件
    const widgetSelector = '#calendarWidget';
    await page.waitForSelector(widgetSelector, { timeout: 15000 });

    // 成功找到就進行精準截圖
    const widgetElement = await page.$(widgetSelector);
    const imagePath = path.join(__dirname, '../checkinpreview.png');
    await widgetElement.screenshot({ path: imagePath });
    console.log('✅ 日曆卡片精準截圖成功！');

  } catch (err) {
    console.log('❌ 發生超時或找不到元素，正在拍攝當前畫面進行診斷...');
    
    // 就算失敗也把當前畫面拍下來存成圖片，讓你看看 GitHub 看到什麼
    const errImagePath = path.join(__dirname, '../checkinpreview.png');
    await page.screenshot({ path: errImagePath, fullPage: true });
    
    // 把當前網頁的 HTML 原始碼印出來
    const htmlContent = await page.content();
    console.log('--- 實際載入的網頁 HTML 開始 ---');
    console.log(htmlContent.substring(0, 1500)); // 印出前 1500 個字元
    console.log('--- 實際載入的網頁 HTML 結束 ---');
    
    throw err; // 讓 Actions 保持失敗以便查看完整日誌
  } finally {
    await browser.close();
  }
})();
