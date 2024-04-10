import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import process from 'node:process';

import { getISODateString } from './date-utils.mjs';
import { BORDER_CHECKPOINTS } from './constants.mjs';

export const parseArgs = () => {
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
    checkpointCodes.push(...Object.keys(BORDER_CHECKPOINTS));
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

  const outputDir = argv.out ?? './data';

  return {
    dateFromAsText,
    dateToAsText,
    checkpointCodes,
    outputDir,
  };
};
