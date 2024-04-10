import puppeteer from 'puppeteer';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import process from 'node:process';

import { validateBorderCheckpoint } from './validators.mjs';
import { BORDER_CHECKPOINTS } from './constants.mjs';
import { saveAllToCsv } from './csv.mjs';
import { getISODateString } from './utils/date.utils.mjs';

(async () => {
  const argv = yargs(hideBin(process.argv)).argv;

  if (!argv.from) {
    throw new Error('No start date (--from arg) specified');
  }

  const dateFromAsText = argv.from;
  const dateToAsText = argv.to || getISODateString(new Date());

  if (new Date(dateToAsText) < new Date(dateFromAsText)) {
    throw new Error('End date cannot be earlier than start date');
  }

  const checkpointCodes = [];

  if (!argv.checkpoint) {
    checkpointCodes.push(...Object.values(BORDER_CHECKPOINTS));
  } else if (Array.isArray(argv.checkpoint)) {
    for (const checkpointCode of argv.checkpoint) {
      validateBorderCheckpoint(checkpointCode);
      checkpointCodes.push(checkpointCode);
    }
  } else {
    const checkpointCode = argv.checkpoint;
    validateBorderCheckpoint(checkpointCode);
    checkpointCodes.push(checkpointCode);
  }

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

  await saveAllToCsv(stats);
})();
