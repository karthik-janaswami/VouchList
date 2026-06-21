const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'referrals.db');
const db = new DatabaseSync(dbPath);

db.exec(`PRAGMA journal_mode = WAL`);
db.exec(`PRAGMA foreign_keys = ON`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS referrals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    metro_area TEXT NOT NULL,
    avg_rating REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referral_id INTEGER REFERENCES referrals(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(referral_id, user_id)
  );

  CREATE INDEX IF NOT EXISTS idx_referrals_metro_area ON referrals(metro_area);
  CREATE INDEX IF NOT EXISTS idx_referrals_category ON referrals(category);
`);

// Migrations — safe to run on existing DB
const migrations = [
  'ALTER TABLE reviews ADD COLUMN price_rating INTEGER',
  'ALTER TABLE reviews ADD COLUMN quality_rating INTEGER',
  'ALTER TABLE referrals ADD COLUMN avg_price_rating REAL DEFAULT 0',
  'ALTER TABLE referrals ADD COLUMN avg_quality_rating REAL DEFAULT 0',
  'ALTER TABLE referrals ADD COLUMN city TEXT',
  'ALTER TABLE referrals ADD COLUMN referred_by TEXT',
  'ALTER TABLE users ADD COLUMN first_name TEXT',
  'ALTER TABLE users ADD COLUMN last_name TEXT',
  'ALTER TABLE reviews ADD COLUMN reviewer_name TEXT',
  'ALTER TABLE referrals ADD COLUMN submitted_by TEXT',
];
for (const sql of migrations) {
  try { db.exec(sql) } catch { /* column already exists */ }
}

module.exports = db;
