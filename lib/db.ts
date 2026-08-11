import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'app.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

declare global {
  // eslint-disable-next-line no-var
  var __db__: Database.Database | undefined;
}

function createDb(): Database.Database {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      series TEXT NOT NULL,
      period TEXT NOT NULL,
      value REAL NOT NULL,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(series, period)
    );
    CREATE INDEX IF NOT EXISTS idx_records_series ON records(series);
    CREATE TABLE IF NOT EXISTS uploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      row_count INTEGER NOT NULL,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

export function getDb(): Database.Database {
  if (!global.__db__) {
    global.__db__ = createDb();
  }
  return global.__db__;
}

export type RecordRow = {
  series: string;
  period: string;
  value: number;
};

export function upsertRecords(rows: RecordRow[]): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO records (series, period, value)
    VALUES (@series, @period, @value)
    ON CONFLICT(series, period) DO UPDATE SET value = excluded.value
  `);
  const insertMany = db.transaction((items: RecordRow[]) => {
    for (const item of items) stmt.run(item);
  });
  insertMany(rows);
}

export function recordUpload(filename: string, rowCount: number): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO uploads (filename, row_count) VALUES (?, ?)`
  ).run(filename, rowCount);
}

export function listSeries(): string[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT DISTINCT series FROM records ORDER BY series ASC`)
    .all() as { series: string }[];
  return rows.map((r) => r.series);
}

export function getRecordsBySeries(series: string[]): RecordRow[] {
  const db = getDb();
  if (series.length === 0) {
    return db
      .prepare(`SELECT series, period, value FROM records ORDER BY series, period`)
      .all() as RecordRow[];
  }
  const placeholders = series.map(() => '?').join(',');
  return db
    .prepare(
      `SELECT series, period, value FROM records WHERE series IN (${placeholders}) ORDER BY series, period`
    )
    .all(...series) as RecordRow[];
}
