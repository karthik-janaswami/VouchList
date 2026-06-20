const db = require('./database');

// Clear existing data and reset autoincrement counters
db.exec('DELETE FROM reviews');
db.exec('DELETE FROM referrals');
db.exec('DELETE FROM users');
db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users','referrals','reviews')");

// Seed users (passwords are all "password123")
const passwordHash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVKkBiKoTu'; // bcrypt of "password123"

const insertUser = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)');
const u1 = insertUser.run('sarah_m', 'sarah@example.com', passwordHash).lastInsertRowid;
const u2 = insertUser.run('joe_h', 'joe@example.com', passwordHash).lastInsertRowid;
const u3 = insertUser.run('priya_k', 'priya@example.com', passwordHash).lastInsertRowid;

// Seed referrals
const insertReferral = db.prepare(`
  INSERT INTO referrals (user_id, name, category, description, phone, email, website, metro_area)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const referrals = [
  // Chicago
  [u1, "Mike's Plumbing & Drain", "Plumber", "Mike has been our go-to plumber for 5 years. Shows up on time, fair pricing, and always fixes it right the first time. Highly recommend for anything from leaky faucets to full pipe replacements.", "(312) 555-0142", "mike@mikesplumbing.com", null, "Chicago"],
  [u2, "Bright Spark Electric", "Electrician", "Carlos and his team rewired our entire kitchen and installed new panel. Professional, clean, and passed inspection first try. Very competitive rates.", "(312) 555-0198", null, null, "Chicago"],
  [u1, "Green Thumb Landscaping", "Landscaper", "Transformed our backyard from a mess to a showpiece. Creative designs and the crew is super reliable. They also do seasonal cleanups.", "(773) 555-0167", "hello@greenthumb.com", "https://greenthumb.example.com", "Chicago"],
  [u3, "Ace Handyman Services", "Handyman", "Tony can fix literally anything around the house. Installed our ceiling fans, patched drywall, and fixed a squeaky staircase all in one afternoon.", "(312) 555-0123", null, null, "Chicago"],
  [u2, "FreshStart Cleaners", "Cleaner", "Deep-cleaned our 3BR condo before we listed it for sale. Absolutely spotless. They use eco-friendly products and the team is trustworthy.", "(312) 555-0177", "book@freshstart.com", null, "Chicago"],

  // New York
  [u1, "Empire HVAC Solutions", "HVAC", "Serviced our ancient central AC unit and got it running like new. Quick response time — came out next day during a heat wave. Saved us!", "(212) 555-0134", null, null, "New York"],
  [u3, "Brooklyn Roofing Co.", "Roofer", "Fixed our leaking roof before the winter. Dave's team was professional, finished in two days, and cleaned up perfectly. No issues since.", "(718) 555-0156", "dave@brooklynroofing.com", null, "New York"],
  [u2, "Rapid Locksmith NYC", "Locksmith", "Got locked out at midnight — they arrived in 20 minutes, no drama, very reasonable fee. Also rekeyed all our locks the next week.", "(646) 555-0189", null, null, "New York"],
  [u1, "Manhattan Painters", "Painter", "Repainted our entire apartment in two days. Clean edges, no drips, and they moved the furniture back exactly as it was. Will hire again.", "(212) 555-0101", null, null, "New York"],

  // Los Angeles
  [u2, "SoCal Plumbing Pros", "Plumber", "Fixed a slab leak that two other plumbers couldn't diagnose. Saved us thousands compared to the other quotes. Very honest and transparent about costs.", "(310) 555-0122", "info@socalplumbing.com", null, "Los Angeles"],
  [u3, "Valley Electric", "Electrician", "Installed EV charger in our garage and added outdoor outlets. Clean work, great communication throughout. Licensed and insured.", "(818) 555-0145", null, null, "Los Angeles"],
  [u1, "PestAway LA", "Pest Control", "Had a bad ant problem. They came out same week, treated the whole house, and offered a 6-month guarantee. Haven't seen a single ant since.", "(323) 555-0133", "schedule@pestawayla.com", null, "Los Angeles"],

  // Austin
  [u2, "Texas Star Handyman", "Handyman", "Built our deck and installed new gutters. Ray does excellent work and is very reasonably priced for Austin. Always returns texts promptly.", "(512) 555-0178", null, null, "Austin"],
  [u3, "Capitol City Movers", "Mover", "Moved our 2BR across town — nothing broken, finished ahead of schedule, and the team was friendly. Way better than the last movers we used.", "(512) 555-0199", "book@capitolmovers.com", null, "Austin"],
  [u1, "Austin AC & Heating", "HVAC", "Replaced our AC unit in the middle of July. Fast, professional, and gave us a 5-year warranty. Can't recommend them enough for Texas summers.", "(512) 555-0155", null, null, "Austin"],
];

const ids = [];
for (const r of referrals) {
  const res = insertReferral.run(...r);
  ids.push(res.lastInsertRowid);
}

// Seed reviews
const insertReview = db.prepare('INSERT INTO reviews (referral_id, user_id, rating, comment) VALUES (?, ?, ?, ?)');
const updateRating = db.prepare('UPDATE referrals SET avg_rating = ?, review_count = ? WHERE id = ?');

const reviews = [
  // Mike's Plumbing (id=ids[0])
  [ids[0], u2, 5, "Absolute lifesaver. Called at 7am about a burst pipe and he was there by 8:30. Fixed it fast and the price was completely fair."],
  [ids[0], u3, 5, "Used Mike twice now. Both times: on time, honest about what needed fixing, and didn't try to upsell anything. Rare find."],

  // Bright Spark Electric (ids[1])
  [ids[1], u1, 5, "Carlos did a fantastic job. Very tidy work and explained everything he was doing. Our kitchen looks amazing."],
  [ids[1], u3, 4, "Good work overall. Took a little longer than quoted but quality was excellent and they were upfront about the delay."],

  // Green Thumb (ids[2])
  [ids[2], u2, 5, "Incredible transformation. They designed and built a pergola plus full garden beds. Always on time and so easy to work with."],
  [ids[2], u3, 5, "Best money we've spent on the house. The crew was fast, professional, and left the place spotless."],

  // Ace Handyman (ids[3])
  [ids[3], u1, 4, "Tony fixed everything on my list in one visit. Reasonable rates and super reliable. Only downside is he books up fast."],
  [ids[3], u2, 5, "Tony is a legend. Fixed our deck, hung all our art, and patched a hole in the wall. What can't this guy do?"],

  // FreshStart Cleaners (ids[4])
  [ids[4], u1, 5, "Hired them for a move-out clean. The landlord literally said it was the cleanest unit he'd seen in years. Got our full deposit back."],
  [ids[4], u3, 4, "Great cleaning team. Very thorough and professional. Would appreciate a little more flexibility with scheduling."],

  // Empire HVAC (ids[5])
  [ids[5], u1, 5, "They came out in under 2 hours during a 95-degree day. Fixed the issue and even cleaned out the ducts. Heroes."],
  [ids[5], u3, 4, "Solid HVAC company. Knowledgeable tech who walked me through everything. Fair price for the work done."],

  // Brooklyn Roofing (ids[6])
  [ids[6], u1, 5, "Dave's crew showed up on time every day, no issues whatsoever. Roof looks great and no leaks after the last big storm."],
  [ids[6], u2, 4, "Did a good job on our flat roof. A little hard to reach by phone at first but once we connected everything went smoothly."],

  // Rapid Locksmith (ids[7])
  [ids[7], u1, 5, "Super fast, super professional. 20 minutes at midnight — can't ask for more than that. Very fair price too."],
  [ids[7], u3, 5, "Also had them rekey the whole apartment. Great service both times."],

  // Manhattan Painters (ids[8])
  [ids[8], u2, 4, "Really clean work. Used low-VOC paint as requested and finished on time. Would use again."],

  // SoCal Plumbing (ids[9])
  [ids[9], u1, 5, "Diagnosed and fixed a slab leak that stumped everyone else. These guys are the real deal."],
  [ids[9], u3, 5, "Saved us from what could have been a disaster. Honest, fast, and fair. Top marks."],

  // Valley Electric (ids[10])
  [ids[10], u1, 5, "EV charger install was flawless. They pulled the permit and handled everything. City inspection passed first try."],
  [ids[10], u2, 4, "Good work on the outdoor outlets. Clean installation and explained the safety features well."],

  // PestAway (ids[11])
  [ids[11], u2, 5, "Ant problem completely gone. Six-month guarantee and they actually honored it when I saw a couple return. No hassle at all."],
  [ids[11], u3, 4, "Effective treatment. Tech was professional and explained what he was using and why. Eco-friendly products is a big plus."],

  // Texas Star (ids[12])
  [ids[12], u1, 5, "Ray built our deck in 3 days and it looks incredible. He even added a couple design touches we hadn't thought of."],
  [ids[12], u3, 4, "Solid handyman work on our gutters. Showed up when he said he would and did what he promised."],

  // Capitol City Movers (ids[13])
  [ids[13], u1, 5, "Moved a 2BR in 4 hours flat. Nothing damaged and they were cheerful the whole time. Way better than our last move experience."],
  [ids[13], u2, 5, "Efficient, careful, and friendly. Would 100% use again. Tipped generously because they earned it."],

  // Austin AC (ids[14])
  [ids[14], u2, 5, "New unit installed in one day. They handled the financing paperwork and warranty registration for us. Zero stress."],
  [ids[14], u3, 5, "They squeezed us in the same week. Tech was knowledgeable and the install team was fast and clean."],
];

for (const [refId, userId, rating, comment] of reviews) {
  insertReview.run(refId, userId, rating, comment);
}

// Recalculate avg_rating and review_count for all referrals
const allStats = db.prepare(`
  SELECT referral_id, AVG(rating) as avg, COUNT(*) as cnt
  FROM reviews GROUP BY referral_id
`).all();

for (const { referral_id, avg, cnt } of allStats) {
  updateRating.run(Math.round(avg * 10) / 10, cnt, referral_id);
}

console.log(`Seeded ${referrals.length} referrals and ${reviews.length} reviews across 4 metro areas.`);
