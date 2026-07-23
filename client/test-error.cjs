const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:3000/login');
  
  // Login
  await page.type('#username', 'cashier');
  await page.type('#password', '123456');
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 4000));
  await browser.close();
})();
