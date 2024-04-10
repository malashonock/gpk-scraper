import { parseArgs } from './args.mjs';
import { getStats } from './main.mjs';
import { saveAllToCsv } from './csv.mjs';

(async () => {
  try {
    const { dateFromAsText, dateToAsText, checkpointCodes, outputDir } =
      parseArgs();
    const stats = await getStats(dateFromAsText, dateToAsText, checkpointCodes);
    await saveAllToCsv(stats, outputDir);
  } catch (error) {
    console.error(error);
  }
})();
