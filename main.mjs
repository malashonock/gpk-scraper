import puppeteer from 'puppeteer';

import { BORDER_CHECKPOINTS } from './constants.mjs';

export const getStats = async (
  dateFromAsText,
  dateToAsText,
  checkpointCodes
) => {
  const browser = await puppeteer.launch({
    headless: true,
  });

  const page = await browser.newPage();
  await page.goto('https://gpk.gov.by', {
    waitUntil: 'domcontentloaded',
  });

  const stats = await page.evaluate(
    async (
      dateFromAsText,
      dateToAsText,
      checkpointCodes,
      BORDER_CHECKPOINTS
    ) => {
      const dateFrom = new Date(dateFromAsText);
      const dateTo = new Date(dateToAsText);
      const downloadTasks = [];
      const stats = [];

      const downloadFn = async (checkpointCode, date) => {
        const response = await fetch(
          'https://gpk.gov.by/local/ajax/order-archive.php',
          {
            method: 'POST',
            body: new URLSearchParams({
              ppr: checkpointCode,
              date: date.toLocaleDateString('ru-RU'),
            }),
          }
        );

        const content = await response.json();

        return content.ITEMS.map((entry) => {
          const [date, time] = entry.NAME.split(' ');
          const queueLength =
            +entry[`PROPERTY_${checkpointCode.toUpperCase()}_OUT_L_VALUE`];

          return {
            borderCheckpoint: BORDER_CHECKPOINTS[checkpointCode],
            date,
            time,
            queueLength,
          };
        });
      };

      for (
        let date = dateFrom;
        date <= dateTo;
        date.setDate(date.getDate() + 1)
      ) {
        for (const checkpointCode of checkpointCodes) {
          const downloadTask = downloadFn(checkpointCode, date);
          downloadTasks.push(downloadTask);
        }
      }

      try {
        const downloadResults = await Promise.all(downloadTasks);
        downloadResults.map((dayStats) => {
          stats.push(...dayStats);
        });
      } catch (error) {
        console.error(error);
      }

      return stats;
    },
    dateFromAsText,
    dateToAsText,
    checkpointCodes,
    BORDER_CHECKPOINTS
  );

  await browser.close();

  return stats;
};
