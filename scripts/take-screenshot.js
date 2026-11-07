const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 設定畫面大小
  await page.setViewportSize({ width: 1200, height: 800 });

  // 組合你的完整預覽網址（帶有 preview=true 與 key）
  const workerDomain = process.env.WORKER_DOMAIN || 'https://checkin.twitchevent.workers.dev';
  const obsKey = process.env.OBS_KEY || '';
  const targetUrl = `${workerDomain}/checkin.html?preview=true&key=${obsKey}`;

  console.log('正在前往預覽網址進行截圖...');
  await page.goto(targetUrl, { waitUntil: 'networkidle' });

  // 等待實際的日曆或畫面容器載入（如果你的 class 不同可以再調整）
  await page.waitForSelector('body', { timeout: 30000 });

  // 儲存截圖到指定的檔名
  const imagePath = path.join(__dirname, '../checkinpreview.png');
  await page.screenshot({ path: imagePath, fullPage: true });

  console.log('截圖已成功儲存至:', imagePath);
  await browser.close();
})();
