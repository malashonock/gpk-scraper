const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
  });

  const page = await browser.newPage();
  await page.goto('https://gpk.gov.by');

  const response = await page.evaluate(() => {
    console.log('Console works');
  });

  await browser.close();
})();
