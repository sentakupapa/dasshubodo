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
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sales_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store TEXT NOT NULL,
      year_type TEXT NOT NULL CHECK (year_type IN ('本年','前年')),
      month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
      item TEXT NOT NULL,
      sales_amount REAL,
      item_count REAL,
      customer_count REAL,
      usage_count REAL,
      UNIQUE(store, year_type, month, item)
    );
    CREATE INDEX IF NOT EXISTS idx_sales_store ON sales_records(store);

    CREATE TABLE IF NOT EXISTS item14_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store TEXT NOT NULL,
      year_type TEXT NOT NULL CHECK (year_type IN ('本年','前年')),
      month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
      item TEXT NOT NULL,
      point_count REAL NOT NULL,
      UNIQUE(store, year_type, month, item)
    );
    CREATE INDEX IF NOT EXISTS idx_item14_store ON item14_records(store);

    CREATE TABLE IF NOT EXISTS processing_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store TEXT NOT NULL,
      month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
      item TEXT NOT NULL,
      point_count REAL NOT NULL,
      UNIQUE(store, month, item)
    );
    CREATE INDEX IF NOT EXISTS idx_processing_store ON processing_records(store);

    CREATE TABLE IF NOT EXISTS uploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      store_count INTEGER NOT NULL,
      sales_rows INTEGER NOT NULL,
      item14_rows INTEGER NOT NULL,
      processing_rows INTEGER NOT NULL,
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

export type YearType = '本年' | '前年';

export type SalesRow = {
  store: string;
  yearType: YearType;
  month: number;
  item: string;
  salesAmount: number | null;
  itemCount: number | null;
  customerCount: number | null;
  usageCount: number | null;
};

export type Item14Row = {
  store: string;
  yearType: YearType;
  month: number;
  item: string;
  pointCount: number;
};

export type ProcessingRow = {
  store: string;
  month: number;
  item: string;
  pointCount: number;
};

export type ImportPayload = {
  filename: string;
  stores: string[];
  sales: SalesRow[];
  item14: Item14Row[];
  processing: ProcessingRow[];
};

export function replaceAllData(payload: ImportPayload): void {
  const db = getDb();

  const insertStore = db.prepare(
    `INSERT INTO stores (name, sort_order) VALUES (?, ?)`
  );
  const insertSales = db.prepare(`
    INSERT INTO sales_records (store, year_type, month, item, sales_amount, item_count, customer_count, usage_count)
    VALUES (@store, @yearType, @month, @item, @salesAmount, @itemCount, @customerCount, @usageCount)
    ON CONFLICT(store, year_type, month, item) DO UPDATE SET
      sales_amount = excluded.sales_amount,
      item_count = excluded.item_count,
      customer_count = excluded.customer_count,
      usage_count = excluded.usage_count
  `);
  const insertItem14 = db.prepare(`
    INSERT INTO item14_records (store, year_type, month, item, point_count)
    VALUES (@store, @yearType, @month, @item, @pointCount)
    ON CONFLICT(store, year_type, month, item) DO UPDATE SET point_count = excluded.point_count
  `);
  const insertProcessing = db.prepare(`
    INSERT INTO processing_records (store, month, item, point_count)
    VALUES (@store, @month, @item, @pointCount)
    ON CONFLICT(store, month, item) DO UPDATE SET point_count = excluded.point_count
  `);
  const insertUpload = db.prepare(`
    INSERT INTO uploads (filename, store_count, sales_rows, item14_rows, processing_rows)
    VALUES (?, ?, ?, ?, ?)
  `);

  const tx = db.transaction((p: ImportPayload) => {
    db.prepare(`DELETE FROM stores`).run();
    db.prepare(`DELETE FROM sales_records`).run();
    db.prepare(`DELETE FROM item14_records`).run();
    db.prepare(`DELETE FROM processing_records`).run();

    p.stores.forEach((name, i) => insertStore.run(name, i));
    for (const row of p.sales) insertSales.run(row);
    for (const row of p.item14) insertItem14.run(row);
    for (const row of p.processing) insertProcessing.run(row);

    insertUpload.run(p.filename, p.stores.length, p.sales.length, p.item14.length, p.processing.length);
  });

  tx(payload);
}

export function listStores(): string[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT name FROM stores ORDER BY sort_order ASC`)
    .all() as { name: string }[];
  if (rows.length > 0) return rows.map((r) => r.name);

  const fallback = db
    .prepare(`SELECT DISTINCT store FROM sales_records ORDER BY store ASC`)
    .all() as { store: string }[];
  return fallback.map((r) => r.store);
}

export function getSalesRecords(store: string): SalesRow[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT store, year_type as yearType, month, item,
              sales_amount as salesAmount, item_count as itemCount,
              customer_count as customerCount, usage_count as usageCount
       FROM sales_records WHERE store = ?`
    )
    .all(store) as SalesRow[];
  return rows;
}

export function getItem14Records(store: string): Item14Row[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT store, year_type as yearType, month, item, point_count as pointCount
       FROM item14_records WHERE store = ?`
    )
    .all(store) as Item14Row[];
}

export function getProcessingRecords(store: string): ProcessingRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT store, month, item, point_count as pointCount
       FROM processing_records WHERE store = ?`
    )
    .all(store) as ProcessingRow[];
}

export function hasAnyData(): boolean {
  const db = getDb();
  const row = db
    .prepare(`SELECT COUNT(*) as c FROM sales_records`)
    .get() as { c: number };
  return row.c > 0;
}
