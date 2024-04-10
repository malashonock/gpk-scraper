import fs from 'fs/promises';

export const saveToCsv = async (stats) => {
  try {
    await fs.writeFile(`./data/.csv`, stats, 'utf-8');
  } catch (error) {
    console.error(error);
  }
};
