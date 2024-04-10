import { BORDER_CHECKPOINTS } from './constants.mjs';

export const validateBorderCheckpoint = (checkpointCode) => {
  if (BORDER_CHECKPOINTS[checkpointCode]) {
    return true;
  }

  throw new Error('Unknown checkpoint');
};

export const validateDate = (date) => {
  if (date instanceof Date) {
    return true;
  }

  throw new Error('Invalid date');
};
