import fs from 'fs';
import path from 'path';
import { parseWorkbook } from './xlsx-parser';
import { replaceAllData, hasAnyData } from './db';

const SEED_PATH = path.join(process.cwd(), 'data', 'seed', 'store-data.xlsx');

let attempted = false;

/**
 * Loads the bundled reference workbook into the DB on first run, so the
 * dashboard has data to show before anyone uploads a file. No-ops once
 * real data exists or after the first attempt in this process.
 */
export async function ensureSeeded(): Promise<void> {
  if (attempted) return;
  attempted = true;

  if (hasAnyData()) return;
  if (!fs.existsSync(SEED_PATH)) return;

  const buffer = fs.readFileSync(SEED_PATH);
  const payload = await parseWorkbook(buffer, 'store-data.xlsx (初期データ)');
  replaceAllData(payload);
}
