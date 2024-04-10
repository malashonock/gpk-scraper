import { createObjectCsvWriter } from 'csv-writer';
import { access, mkdir, rm } from 'fs/promises';

import { parseDateRu } from './utils/date.utils.mjs';

export const saveAllToCsv = async (stats, outputDir) => {
  const statsByDate = stats.reduce((aggregation, stat) => {
    const date = parseDateRu(stat.date);
    const currentDayStats = aggregation.get(date) ?? [];
    return aggregation.set(date, [...currentDayStats, stat]);
  }, new Map());

  const saveTasks = [];

  for (const [date, dayStats] of statsByDate) {
    const saveTask = saveDayStats(date, dayStats, outputDir);
    saveTasks.push(saveTask);
  }

  try {
    return await Promise.all(saveTasks);
  } catch (error) {
    console.error(error);
  }
};

const saveDayStats = async (date, dayStats, outputDir) => {
  const filePath = `${outputDir}/${date}.csv`;

  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: 'borderCheckpoint', title: 'Погран. переход' },
      { id: 'date', title: 'Дата' },
      { id: 'time', title: 'Время' },
      { id: 'queueLength', title: 'Очередь на выезд' },
    ],
    encoding: 'utf-8',
    fieldDelimiter: ';',
  });

  try {
    await checkDirExists(outputDir);
    await removeExistingFile(filePath);
    await csvWriter.writeRecords(dayStats);
  } catch (error) {
    console.error(error);
  }
};

const checkDirExists = async (dir) => {
  try {
    await access(dir);
  } catch (error) {
    await mkdir(dir);
  }
};

const removeExistingFile = async (filePath) => {
  try {
    await access(filePath);
    await rm(filePath);
  } catch (error) {
    return; // It's ok, file doesn't exits
  }
};
