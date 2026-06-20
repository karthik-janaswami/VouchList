const db = require('./database');
const fs = require('fs');

const CSV_PATH = '/Users/karthikjanaswami/Downloads/Service directory - Home Services.csv';
const content = fs.readFileSync(CSV_PATH, 'utf8');

// Full CSV parser — handles quoted multi-line fields
function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') { cell += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      row.push(cell.trim()); cell = '';
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && next === '\n') i++;
      row.push(cell.trim()); cell = '';
      if (row.some(c => c)) rows.push(row);
      row = [];
    } else {
      cell += ch;
    }
  }
  if (cell || row.length) { row.push(cell.trim()); if (row.some(c => c)) rows.push(row); }
  return rows;
}

const rows = parseCSV(content).slice(1); // skip header

// Section header → category mapping
const SECTION_MAP = {
  'gardening': 'Gardening',
  'garage door': 'Garage Door',
  'home cleaning services': 'Home Cleaning',
  'electrician': 'Electrician',
  'plumber': 'Plumber',
  'handyman': 'Handyman',
  'painting': 'Painter',
  'contractor': 'Contractor',
  'pest control': 'Pest Control',
  'water softener': 'Water Softener',
  'insulation': 'Insulation',
  'roofing': 'Roofer',
  'movers': 'Mover',
  'tv wall mount': 'TV Wall Mount',
  'mold remediation and large water leaks': 'Mold Remediation',
  'vehicle buffing': 'Auto Detailing',
  'other interests': 'Other',
  'snake removal': 'Pest Control',
  'auto glass and tint': 'Auto Glass & Tint',
  'realtor': 'Realtor',
  'structural engineer': 'Structural Engineer',
  'notary': 'Notary',
  'ac / furnace': 'HVAC',
  'locksmith': 'Locksmith',
  'airport pick and drop services': 'Transportation',
  'ducts n dryer vent cleaning': 'HVAC',
};

// Names/rows to explicitly skip (not recommended or no useful info)
const SKIP_NAMES = new Set(['brandon', 'farmin', 'tim', 'louis', 'tripti jain', 'pawmate']);
const SKIP_SERVICES = new Set(['\\']);

function cleanPhone(raw) {
  if (!raw) return null;
  if (raw.startsWith('http') || raw.includes('@') || raw.includes('whatsapp')) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 7) return raw.replace(/\s+/g, '');
  return null;
}

function isPhoneNumber(str) {
  return /^[\d\s\-\(\)\+]{7,}$/.test(str.trim());
}

function isSectionHeader(row) {
  const [name, service] = row;
  const candidate = (name || service || '').toLowerCase().trim();
  return !!SECTION_MAP[candidate];
}

// Get or create the import system user
let importUser = db.prepare("SELECT id FROM users WHERE email = 'import@system.local'").get();
if (!importUser) {
  const res = db.prepare(
    "INSERT INTO users (username, email, password_hash) VALUES ('imported', 'import@system.local', 'n/a')"
  ).run();
  importUser = { id: res.lastInsertRowid };
}
const userId = importUser.id;

const insertReferral = db.prepare(`
  INSERT OR IGNORE INTO referrals (user_id, name, category, description, phone, metro_area)
  VALUES (?, ?, ?, ?, ?, ?)
`);

let currentCategory = null;
let imported = 0, skipped = 0;

for (const row of rows) {
  // Columns: name, service, contact, comments, addl_comments, city, referred_by, rate
  let [name = '', service = '', contact = '', comments = '', addl = '', city = '', referredBy = ''] = row;

  // Detect section header
  const sectionKey = Object.keys(SECTION_MAP).find(k =>
    name.toLowerCase().trim() === k || service.toLowerCase().trim() === k
  );
  if (sectionKey) { currentCategory = SECTION_MAP[sectionKey]; continue; }

  // Skip explicitly bad entries
  if (SKIP_NAMES.has(name.toLowerCase().trim())) { skipped++; continue; }
  if (SKIP_SERVICES.has(service.trim())) { skipped++; continue; }

  // Handle case where phone landed in column 1 instead of 2 (e.g. Ray row)
  if (!cleanPhone(contact) && cleanPhone(service)) {
    contact = service; service = '';
  }

  // Handle case where name is a phone number (e.g. row 36: 9254759972,Electrician)
  if (isPhoneNumber(name) && !cleanPhone(contact)) {
    contact = name; name = '';
  }

  // Skip rows with no name AND no contact
  const phone = cleanPhone(contact);
  if (!name && !phone) { skipped++; continue; }

  // Skip URL-only rows
  if (!name && (contact.startsWith('http') || service.startsWith('http'))) { skipped++; continue; }

  // Build a clean name
  // Remove "-- Highly recommended" markers, keep the note in description
  let isHighlyRecommended = false;
  if (/highly rec/i.test(name)) {
    isHighlyRecommended = true;
    name = name.replace(/--?\s*highly\s*rec\w*/i, '').trim();
  }

  // If name is still empty, use service as name
  if (!name && service) { name = service; service = ''; }
  if (!name) { skipped++; continue; }

  const category = currentCategory || 'Other';
  const metro_area = city.trim() || 'Bay Area, CA';

  // Build description
  const descParts = [];
  if (service && service !== name) descParts.push(service);
  if (isHighlyRecommended) descParts.push('Highly recommended');
  if (comments && !comments.startsWith('http')) descParts.push(comments);
  if (addl && !addl.startsWith('http') && addl.toLowerCase() !== 'he is') descParts.push(addl);
  if (referredBy) descParts.push(`Referred by ${referredBy}`);
  const description = descParts.join(' — ') || null;

  try {
    const res = insertReferral.run(userId, name, category, description, phone, metro_area);
    if (res.changes > 0) {
      console.log(`  + [${category}] ${name}${phone ? ` (${phone})` : ''}`);
      imported++;
    } else {
      skipped++;
    }
  } catch (err) {
    console.warn(`  ! Skipped "${name}": ${err.message}`);
    skipped++;
  }
}

console.log(`\nDone: ${imported} imported, ${skipped} skipped.`);
