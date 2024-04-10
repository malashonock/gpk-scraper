import { BORDER_CHECKPOINTS } from './constants.mjs';

export const validateBorderCheckpoint = (borderCheckpoint) => {
  if (Object.values(BORDER_CHECKPOINTS).includes(borderCheckpoint)) {
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
