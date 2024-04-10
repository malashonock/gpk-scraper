import puppeteer from 'puppeteer';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import process from 'node:process';

import { validateBorderCheckpoint } from './validators.mjs';
import { BORDER_CHECKPOINTS } from './constants.mjs';
import { saveAllToCsv } from './csv.mjs';

(async () => {
  const argv = yargs(hideBin(process.argv)).argv;

  if (!argv.from) {
    throw new Error('No start date (--from arg) specified');
  }

  const dateFromAsText = argv.from;
  const dateToAsText = argv.to || new Date().toISOString().slice(0, 10);

  if (new Date(dateToAsText) < new Date(dateFromAsText)) {
    throw new Error('End date cannot be earlier than start date');
  }

  const borderCheckpoints = [];

  if (!argv.checkpoint) {
    borderCheckpoints.push(...Object.values(BORDER_CHECKPOINTS));
  } else if (Array.isArray(argv.checkpoint)) {
    for (const borderCheckpoint of argv.checkpoint) {
      validateBorderCheckpoint(borderCheckpoint);
      borderCheckpoints.push(borderCheckpoint);
    }
  } else {
    const borderCheckpoint = argv.checkpoint;
    validateBorderCheckpoint(borderCheckpoint);
    borderCheckpoints.push(borderCheckpoint);
  }

  const browser = await puppeteer.launch({
    headless: true,
  });

  const page = await browser.newPage();
  await page.goto('https://gpk.gov.by', {
    waitUntil: 'domcontentloaded',
  });

  const stats = await page.evaluate(
    async (dateFromAsText, dateToAsText, borderCheckpoints) => {
      const dateFrom = new Date(dateFromAsText);
      const dateTo = new Date(dateToAsText);
      const downloadTasks = [];
      const stats = [];

      const downloadFn = async (borderCheckpoint, date) => {
        const response = await fetch('https://gpk.gov.by/local/ajax/order-archive.php', {
          method: 'POST',
          body: new URLSearchParams({
            ppr: borderCheckpoint,
            date: date.toLocaleDateString('ru-RU'),
          }),
        });

        const content = await response.json();

        return content.ITEMS.map((entry) => {
          const [dateRu, time] = entry.NAME.split(' ');
          const date = new Date(dateRu).toISOString().slice(0, 10);
          const queueLength = +entry[`PROPERTY_${borderCheckpoint.toUpperCase()}_OUT_L_VALUE`];

          return {
            borderCheckpoint,
            date,
            time,
            queueLength,
          };
        });
      };

      for (let date = dateFrom; date <= dateTo; date.setDate(date.getDate() + 1)) {
        for (const borderCheckpoint of borderCheckpoints) {
          const downloadTask = downloadFn(borderCheckpoint, date);
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
    borderCheckpoints
  );

  await browser.close();

  await saveAllToCsv(stats);
})();
