const { chromium } = require('playwright');
const path = require('path');

(async () => {
  // 啟動無頭瀏覽器
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 500, height: 700 },
    deviceScaleFactor: 2, // 2倍率高畫質截圖
  });

  // 請把這裡換成你實際的 Cloudflare Worker 網址
  const workerDomain = process.env.WORKER_DOMAIN || 'https://你的專案網址.workers.dev';
  const obsKey = process.env.OBS_KEY;
  
  // 組裝帶有 key、預覽模式、以及你喜歡的棉花糖風格與小橘貓裝飾的網址
  const targetUrl = `${workerDomain}/checkin.html?key=${obsKey}&preview=true&role=broadcaster&theme=cotton-candy&decoration=cat`;
  
  console.log(`正在前往預覽網址進行截圖...`);
  await page.goto(targetUrl, { waitUntil: 'networkidle' });

  // 等待 widget 顯示與動畫載入完成
  await page.waitForSelector('.widget-wrapper.show');
  await page.waitForTimeout(1500); // 預留 1.5 秒讓印章與光特效動畫完整呈現

  // 精準對準整個 widget 容器進行截圖
  const element = await page.$('.widget-wrapper');
  
  // 覆蓋你原本的預覽圖片檔名（請確保檔名跟你在專案裡用的一致）
  const imagePath = path.join(__dirname, '../checkinpreview.png');
  await element.screenshot({
    path: imagePath,
    omitBackground: true // 保留透明背景
  });

  console.log(`✅ 每日預覽截圖更新成功！儲存至: ${imagePath}`);
  await browser.close();
})();
