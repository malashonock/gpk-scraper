const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
  });

  const page = await browser.newPage();
  await page.goto('https://gpk.gov.by', {
    timeout: 60_000,
    waitUntil: 'domcontentloaded',
  });

  await page.evaluate(async () => {
    const response = await fetch('https://gpk.gov.by/local/ajax/order-archive.php', {
      method: 'POST',
      body: new URLSearchParams({
        ppr: 'brest',
        date: '08.04.2024',
      }),
    });

    const content = await response.json();
    console.log(content);
  });

  await browser.close();
})();
