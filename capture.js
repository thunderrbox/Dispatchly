const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const screenshotsDir = path.join(__dirname, 'docs', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // 1. Landing Page
  console.log('Capturing Landing Page...');
  const page1 = await browser.newPage();
  await page1.setViewport({ width: 1280, height: 800 });
  await page1.goto(BASE_URL, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page1.screenshot({ path: path.join(screenshotsDir, 'landing.png') });
  await page1.close();

  // 2. Customer Booking Hub
  console.log('Capturing Customer Hub...');
  const context2 = await browser.createBrowserContext();
  const page2 = await context2.newPage();
  await page2.setViewport({ width: 1280, height: 800 });
  await page2.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await page2.waitForSelector('input[type="email"]');
  await page2.type('input[type="email"]', 'aarav@dispatchly.test');
  await page2.type('input[type="password"]', 'Customer@123');
  await Promise.all([
    page2.click('button[type="submit"]'),
    page2.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);
  // Go to booking create page
  await page2.goto(`${BASE_URL}/customer/orders/create`, { waitUntil: 'networkidle2' });
  await page2.waitForSelector('input[placeholder*="Street"]');
  await page2.type('input[placeholder*="Street"]', '123, Barra Kidwai Nagar');
  await page2.type('input[placeholder*="Recipient"]', '456, Gomti Nagar, Lucknow');
  await page2.focus('input[type="number"]');
  await new Promise(r => setTimeout(r, 3000));
  await page2.screenshot({ path: path.join(screenshotsDir, 'customer_hub.png') });
  await context2.close();

  // 3. Admin Dashboard
  console.log('Capturing Admin Dashboard...');
  const context3 = await browser.createBrowserContext();
  const page3 = await context3.newPage();
  await page3.setViewport({ width: 1280, height: 800 });
  await page3.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await page3.waitForSelector('input[type="email"]');
  await page3.type('input[type="email"]', 'admin@dispatchly.test');
  await page3.type('input[type="password"]', 'Admin@123');
  await Promise.all([
    page3.click('button[type="submit"]'),
    page3.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);
  await page3.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3000));
  await page3.screenshot({ path: path.join(screenshotsDir, 'admin_dashboard.png') });
  await context3.close();

  // 4. Courier Portal
  console.log('Capturing Courier Portal...');
  const context4 = await browser.createBrowserContext();
  const page4 = await context4.newPage();
  await page4.setViewport({ width: 1280, height: 800 });
  await page4.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await page4.waitForSelector('input[type="email"]');
  await page4.type('input[type="email"]', 'amit@dispatchly.test');
  await page4.type('input[type="password"]', 'Agent@123');
  await Promise.all([
    page4.click('button[type="submit"]'),
    page4.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);
  await page4.goto(`${BASE_URL}/agent/orders`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3000));
  await page4.screenshot({ path: path.join(screenshotsDir, 'courier_portal.png') });
  await context4.close();

  await browser.close();
  console.log('All screenshots captured successfully!');
}

run().catch(err => {
  console.error('Error running capture:', err);
  process.exit(1);
});
