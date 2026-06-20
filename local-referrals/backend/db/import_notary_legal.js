const db = require('./database');
const fs = require('fs');

const CSV_PATH = '/Users/karthikjanaswami/Downloads/Service directory - Notary_Tax_Law_Financial.csv';
const content = fs.readFileSync(CSV_PATH, 'utf8');

function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (ch === '"') { if (inQuotes && next === '"') { cell += '"'; i++; } else inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { row.push(cell.trim()); cell = ''; }
    else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && next === '\n') i++;
      row.push(cell.trim()); cell = '';
      if (row.some(c => c)) rows.push(row);
      row = [];
    } else { cell += ch; }
  }
  if (cell || row.length) { row.push(cell.trim()); if (row.some(c => c)) rows.push(row); }
  return rows;
}

const SECTIONS = {
  'taxes': 'Tax Services',
  'notary': 'Notary',
  'will and trust': 'Will & Trust',
  'financial services': 'Financial Services',
};

const rows = parseCSV(content).slice(2); // skip 2-line header

const importUser = db.prepare("SELECT id FROM users WHERE email = 'import@system.local'").get();
const userId = importUser.id;

const insert = db.prepare(`
  INSERT OR IGNORE INTO referrals (user_id, name, category, description, phone, metro_area)
  VALUES (?, ?, ?, ?, ?, ?)
`);

function extractPhone(str) {
  const digits = str.replace(/\D/g, '');
  return digits.length >= 7 ? str.trim() : null;
}

// Extract phone embedded in name like "Kanika Sachdeva - 925-640-5882"
function splitNamePhone(str) {
  const m = str.match(/^(.+?)\s*[-–]\s*([\d][\d\s\-\(\)\.]{6,})$/);
  if (m) return { name: m[1].trim(), phone: m[2].trim() };
  return { name: str, phone: null };
}

let currentCategory = null;
let imported = 0, skipped = 0;

for (const row of rows) {
  let [name = '', service = '', contact = '', comments = '', city = '', referredBy = ''] = row;

  // Section header detection
  const sectionKey = Object.keys(SECTIONS).find(k =>
    name.toLowerCase().trim() === k || service.toLowerCase().trim() === k
  );
  if (sectionKey) { currentCategory = SECTIONS[sectionKey]; continue; }

  // Skip empty rows
  if (!name && !contact) { skipped++; continue; }

  // Handle phone embedded in name
  let phone = null;
  const split = splitNamePhone(name);
  if (split.phone) { name = split.name; phone = split.phone; }

  // Try contact field for phone
  if (!phone) phone = extractPhone(contact);

  // Skip if contact is a person name (not a phone) — e.g. "Connie Yi"
  // Skip URL-only contacts
  if (!phone && (contact.startsWith('http') || /^[A-Za-z\s]+$/.test(contact.trim()))) {
    contact = '';
  }

  if (!name) { skipped++; continue; }

  // Clean up name — remove trailing price info like "$5"
  name = name.replace(/\s*\$\d+\s*$/,'').trim();

  // Remove "(https://...)" from name
  name = name.replace(/\s*\(https?:\/\/[^\)]+\)/,'').trim();

  const category = currentCategory || 'Legal Services';
  const metro_area = city.trim() || 'Bay Area, CA';

  // Build description
  const descParts = [];
  if (service && service !== name && !/^(notary|taxes)$/i.test(service)) descParts.push(service);
  // Include price info from comments if it's a rate
  if (comments && comments.match(/^\$\d/)) descParts.push(comments);
  else if (comments && !comments.startsWith('http')) descParts.push(comments);
  if (referredBy && !referredBy.includes('@')) descParts.push(`Referred by ${referredBy}`);
  const description = descParts.join(' — ') || null;

  try {
    const res = insert.run(userId, name, category, description, phone, metro_area);
    if (res.changes > 0) {
      console.log(`  + [${category}] ${name}${phone ? ` (${phone})` : ''}`);
      imported++;
    } else { skipped++; }
  } catch (err) {
    console.warn(`  ! ${name}: ${err.message}`);
    skipped++;
  }
}

const total = db.prepare('SELECT COUNT(*) as cnt FROM referrals').get();
console.log(`\nDone: ${imported} imported, ${skipped} skipped. Total referrals: ${total.cnt}`);
