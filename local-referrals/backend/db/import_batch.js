const db = require('./database');
const fs = require('fs');

// ── CSV parser (handles quoted multi-line fields) ─────────────────────────────
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

function isPhone(str) {
  return str && str.replace(/\D/g, '').length >= 7 && !str.startsWith('http') && !/^[A-Za-z\s,\.]+$/.test(str.trim());
}

function cleanPhone(str) {
  if (!str) return null;
  if (str.startsWith('http') || str.includes('@')) return null;
  const digits = str.replace(/\D/g, '');
  return digits.length >= 7 ? str.trim() : null;
}

const importUser = db.prepare("SELECT id FROM users WHERE email='import@system.local'").get();
const userId = importUser.id;
const insert = db.prepare(`INSERT OR IGNORE INTO referrals (user_id, name, category, description, phone, metro_area) VALUES (?, ?, ?, ?, ?, ?)`);

let totalImported = 0, totalSkipped = 0;

function importFile({ path, headerRows = 1, defaultCategory, sections, nameCol = 0, serviceCol = 1, phoneCol = 2, commentCol = 3, cityCol = 4, referredCol = 5 }) {
  if (!fs.existsSync(path)) { console.log(`  [SKIP] File not found: ${path}`); return; }
  const rows = parseCSV(fs.readFileSync(path, 'utf8')).slice(headerRows);
  let currentCategory = defaultCategory;
  let imported = 0, skipped = 0;

  for (const row of rows) {
    let name = row[nameCol] || '';
    let service = row[serviceCol] || '';
    let phone = row[phoneCol] || '';
    let comments = row[commentCol] || '';
    let city = row[cityCol] || '';
    let referred = row[referredCol] || '';

    // Section header?
    if (sections) {
      const candidate = (name || service).toLowerCase().trim();
      const matched = Object.keys(sections).find(k => candidate === k.toLowerCase());
      if (matched) { currentCategory = sections[matched]; continue; }
    }

    // Skip URL-only rows, empty rows
    if (!name && !service) { skipped++; continue; }
    if ((name.startsWith('http') || name.startsWith('https')) && !phone) { skipped++; continue; }

    // Phone might be in comments or service field
    let resolvedPhone = cleanPhone(phone);
    if (!resolvedPhone && isPhone(service)) { resolvedPhone = service; service = ''; }
    if (!resolvedPhone && isPhone(comments)) { resolvedPhone = comments; comments = ''; }
    // Phone embedded in name: "Name - 123-456-7890"
    const embeddedPhone = name.match(/[-–]\s*([\d][\d\s\-\(\)\.]{7,})$/);
    if (!resolvedPhone && embeddedPhone) {
      resolvedPhone = embeddedPhone[1].trim();
      name = name.replace(embeddedPhone[0], '').trim();
    }

    // Build name
    let finalName = name || service;
    if (!finalName) { skipped++; continue; }
    // Strip URLs from name
    finalName = finalName.replace(/\s*https?:\/\/\S+/g, '').trim();
    if (!finalName) { skipped++; continue; }

    const category = currentCategory || 'Other';
    const metro = city.trim() || 'Bay Area, CA';

    // Description
    const parts = [];
    if (service && service !== finalName && !service.startsWith('http')) parts.push(service);
    if (comments && !comments.startsWith('http') && !isPhone(comments)) parts.push(comments);
    if (referred && !referred.includes('@') && !referred.startsWith('http')) parts.push(`Referred by ${referred}`);
    const description = parts.join(' — ') || null;

    try {
      const res = insert.run(userId, finalName, category, description, resolvedPhone, metro);
      if (res.changes > 0) { console.log(`  + [${category}] ${finalName}`); imported++; }
      else skipped++;
    } catch (e) { skipped++; }
  }

  console.log(`  → ${imported} imported, ${skipped} skipped\n`);
  totalImported += imported; totalSkipped += skipped;
}

// ── Volunteering ──────────────────────────────────────────────────────────────
console.log('📂 Volunteering');
importFile({
  path: "/Users/karthikjanaswami/Downloads/Service directory - Volunteering.csv",
  defaultCategory: 'Volunteering',
  nameCol: 0, serviceCol: 0, phoneCol: 2, commentCol: 3, cityCol: 3, referredCol: 4,
  headerRows: 1
});

// ── Medical / Health ──────────────────────────────────────────────────────────
console.log('📂 Medical / Health');
importFile({
  path: "/Users/karthikjanaswami/Downloads/Service directory - Medical_Health.csv",
  headerRows: 2,
  defaultCategory: 'Healthcare',
  sections: {
    'pediatricians': 'Pediatrician',
    'urgent care': 'Urgent Care',
    'dentists': 'Dentist',
    'physical': 'Physical Therapy',
    'pcp': 'Primary Care',
    'ayurvedic': 'Ayurvedic',
    'homeopathic': 'Homeopathic',
    'eyes': 'Eye Care',
    'accupunture': 'Acupuncture',
    'neurologist': 'Neurologist',
    'visitors in usa': 'Healthcare',
    'physicians (accepting without insurance)': 'Healthcare',
    ',adult care & postnatal mom & baby care': 'Postnatal Care',
    'adult care & postnatal mom & baby care': 'Postnatal Care',
  }
});

// ── Events / Ceremonies / Beauty ──────────────────────────────────────────────
console.log('📂 Events / Beauty');
importFile({
  path: "/Users/karthikjanaswami/Downloads/Service directory - Events_ceremonies_beauty.csv",
  headerRows: 2,
  defaultCategory: 'Events',
  sections: {
    'event locations': 'Event Venue',
    'photographers': 'Photography',
    'digital arts': 'Digital Arts',
    'makeup / henna': 'Makeup & Beauty',
    'guruji/pandit': 'Pandit / Guruji',
    'matrimony resources': 'Matrimony',
    'cakes': 'Bakery / Cakes',
    ',event decorators': 'Event Decor',
    'event decorators': 'Event Decor',
    ',dj / digital photobooth/360 video booth': 'DJ & Entertainment',
    'dj / digital photobooth/360 video booth': 'DJ & Entertainment',
  }
});

// ── Cooking / Catering ────────────────────────────────────────────────────────
console.log('📂 Cooking / Catering');
importFile({
  path: "/Users/karthikjanaswami/Downloads/Service directory - Cooking_catering.csv",
  headerRows: 2,
  defaultCategory: 'Home Kitchen / Tiffin',
  sections: {
    'daily tiffin': 'Home Kitchen / Tiffin',
    'catering': 'Catering',
    'cooks who can come home': 'Home Chef',
    'delivery services from india': 'Indian Grocery Delivery',
    'cakes': 'Bakery / Cakes',
  }
});

// ── Auto Services ─────────────────────────────────────────────────────────────
console.log('📂 Auto Services');
importFile({
  path: "/Users/karthikjanaswami/Downloads/Service directory - Auto Services.csv",
  headerRows: 1,
  defaultCategory: 'Auto Services',
  sections: {
    'vehicle buffing': 'Auto Detailing',
    'auto glass and tint': 'Auto Glass & Tint',
    'airport pick and drop services': 'Transportation',
    'mechanic/auto-shop': 'Mechanic',
  }
});

const total = db.prepare('SELECT COUNT(*) as cnt FROM referrals').get();
console.log(`\n✅ Total imported this run: ${totalImported}, skipped: ${totalSkipped}`);
console.log(`📊 Total referrals in DB: ${total.cnt}`);
