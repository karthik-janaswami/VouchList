const db = require('./database');
const data = require('./seed_data');

const count = db.prepare('SELECT COUNT(*) as n FROM referrals').get().n;
if (count > 0) {
  console.log(`Seed skipped — ${count} referrals already exist.`);
  process.exit(0);
}

const insert = db.prepare(`
  INSERT INTO referrals (name, category, description, phone, email, website, metro_area, city, referred_by)
  VALUES (@name, @category, @description, @phone, @email, @website, @metro_area, @city, @referred_by)
`);

db.exec('BEGIN');
try {
  for (const item of data) insert.run(item);
  db.exec('COMMIT');
} catch (e) {
  db.exec('ROLLBACK');
  throw e;
}
console.log(`Seeded ${data.length} referrals.`);
