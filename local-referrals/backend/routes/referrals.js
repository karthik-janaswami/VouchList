const express = require('express');
const db = require('../db/database');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/referrals — public, supports ?metro_area=&city=&category=&search=
router.get('/', (req, res) => {
  const { metro_area, city, category, search } = req.query;

  let query = 'SELECT * FROM referrals WHERE 1=1';
  const params = [];

  if (metro_area) {
    query += ' AND metro_area = ?';
    params.push(metro_area);
  }
  if (city) {
    query += ' AND city = ?';
    params.push(city);
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term);
  }

  query += ' ORDER BY avg_rating DESC, created_at DESC';

  const referrals = db.prepare(query).all(...params);
  res.json(referrals);
});

// GET /api/referrals/meta — public, returns distinct metro areas, cities and categories
router.get('/meta', (req, res) => {
  const metro_areas = db.prepare('SELECT DISTINCT metro_area FROM referrals ORDER BY metro_area').all().map(r => r.metro_area);
  const cities = db.prepare('SELECT DISTINCT city FROM referrals WHERE city IS NOT NULL ORDER BY city').all().map(r => r.city);
  const categories = db.prepare('SELECT DISTINCT category FROM referrals ORDER BY category').all().map(r => r.category);
  res.json({ metro_areas, cities, categories });
});

// GET /api/referrals/:id — public
router.get('/:id', (req, res) => {
  const referral = db.prepare('SELECT * FROM referrals WHERE id = ?').get(req.params.id);
  if (!referral) return res.status(404).json({ error: 'Referral not found' });
  res.json(referral);
});

// POST /api/referrals — open (auth optional)
router.post('/', optionalAuth, (req, res) => {
  const { name, category, description, phone, email, website, metro_area, city, referred_by, submitted_by } = req.body;
  if (!name || !category || !metro_area) {
    return res.status(400).json({ error: 'name, category, and metro_area are required' });
  }
  if (!submitted_by || !submitted_by.trim()) {
    return res.status(400).json({ error: 'Your name is required' });
  }
  const result = db
    .prepare(
      'INSERT INTO referrals (user_id, name, category, description, phone, email, website, metro_area, city, referred_by, submitted_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(req.user?.id || null, name, category, description || null, phone || null, email || null, website || null, metro_area, city || null, referred_by || null, submitted_by.trim());
  const referral = db.prepare('SELECT * FROM referrals WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(referral);
});

// DELETE /api/referrals/:id — auth required, only own referrals
router.delete('/:id', requireAuth, (req, res) => {
  const referral = db.prepare('SELECT * FROM referrals WHERE id = ?').get(req.params.id);
  if (!referral) return res.status(404).json({ error: 'Referral not found' });
  if (referral.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
  db.prepare('DELETE FROM referrals WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
