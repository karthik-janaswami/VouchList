const db = require('./database');
const fs = require('fs');
const path = require('path');

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Usage: node import_csv.js <path-to-csv>');
  process.exit(1);
}

const content = fs.readFileSync(csvPath, 'utf8');
const lines = content.split('\n').map(l => l.trim()).filter(Boolean);

// Parse CSV rows (handles quoted fields with commas)
function parseRow(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// Skip header row
const rows = lines.slice(1).map(parseRow);

// Find or create a system user for imported data
let importUser = db.prepare("SELECT id FROM users WHERE email = 'import@system.local'").get();
if (!importUser) {
  const res = db.prepare(
    "INSERT INTO users (username, email, password_hash) VALUES ('imported', 'import@system.local', 'n/a')"
  ).run();
  importUser = { id: res.lastInsertRowid };
}
const userId = importUser.id;

const insertReferral = db.prepare(`
  INSERT INTO referrals (user_id, name, category, description, phone, metro_area)
  VALUES (?, ?, ?, ?, ?, ?)
`);

// Category section tracking
const SECTION_CATEGORIES = {
  'tailors/alterations': 'Tailor & Alterations',
  'clothing': 'Clothing',
  'jewelry': 'Jewelry',
  'soaps': 'Soaps & Body Care',
  'beauty': 'Beauty & Wellness',
};

function detectCategory(shop, service) {
  const text = `${shop} ${service}`.toLowerCase();
  if (text.includes('tailor') || text.includes('alter') || text.includes('blouse') || text.includes('saree') || text.includes('pico')) return 'Tailor & Alterations';
  if (text.includes('soap') || text.includes('body care')) return 'Soaps & Body Care';
  if (text.includes('jewelry') || text.includes('jewel')) return 'Jewelry';
  if (text.includes('mehendi') || text.includes('henna') || text.includes('heena') || text.includes('wax') || text.includes('thread') || text.includes('hair') || text.includes('facial') || text.includes('parlor')) return 'Beauty & Wellness';
  if (text.includes('cloth') || text.includes('ethnic') || text.includes('sari') || text.includes('frills')) return 'Clothing';
  return null;
}

let currentCategory = null;
let imported = 0;
let skipped = 0;

for (const row of rows) {
  const [shop = '', service = '', contact = '', comments = '', city = ''] = row;

  // Detect section headers (rows where service/shop is just a category label)
  const sectionKey = Object.keys(SECTION_CATEGORIES).find(k =>
    shop.toLowerCase() === k || service.toLowerCase() === k
  );
  if (sectionKey) {
    currentCategory = SECTION_CATEGORIES[sectionKey];
    continue;
  }

  // Skip rows with no useful data
  const hasName = shop.length > 0;
  const hasService = service.length > 0;
  const hasContact = contact.length > 0 && /\d{7,}/.test(contact.replace(/[-\s]/g, ''));

  if (!hasName && !hasService && !hasContact) { skipped++; continue; }

  // Build a meaningful name
  let name = shop || service || 'Unknown';
  // If shop is a phone number, skip (it's a malformed row)
  if (/^\d[\d\s\-]{6,}$/.test(name)) { skipped++; continue; }

  const category = detectCategory(shop, service) || currentCategory || 'Other';
  const metro_area = city || 'Bay Area, CA';

  // Build description from service + comments
  const parts = [];
  if (hasService && service !== name) parts.push(service);
  if (comments && !comments.startsWith('http')) parts.push(comments);
  const description = parts.join(' — ') || null;

  // Clean phone
  const phone = hasContact ? contact.replace(/\s+/g, '').replace(/^\+/, '') : null;

  try {
    insertReferral.run(userId, name, category, description, phone, metro_area);
    console.log(`  + [${category}] ${name}`);
    imported++;
  } catch (err) {
    console.warn(`  ! Skipped "${name}": ${err.message}`);
    skipped++;
  }
}

console.log(`\nDone: ${imported} imported, ${skipped} skipped.`);
