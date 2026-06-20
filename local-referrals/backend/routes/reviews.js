const express = require('express');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// GET /api/referrals/:id/reviews — public
router.get('/', (req, res) => {
  const reviews = db
    .prepare(
      `SELECT r.*, u.username FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.referral_id = ?
       ORDER BY r.created_at DESC`
    )
    .all(req.params.id);
  res.json(reviews);
});

// POST /api/referrals/:id/reviews — auth required
router.post('/', requireAuth, (req, res) => {
  const { price_rating, quality_rating, comment } = req.body;
  const referralId = parseInt(req.params.id);

  if (!price_rating || price_rating < 1 || price_rating > 5) {
    return res.status(400).json({ error: 'price_rating must be between 1 and 5' });
  }
  if (!quality_rating || quality_rating < 1 || quality_rating > 5) {
    return res.status(400).json({ error: 'quality_rating must be between 1 and 5' });
  }

  const referral = db.prepare('SELECT id FROM referrals WHERE id = ?').get(referralId);
  if (!referral) return res.status(404).json({ error: 'Referral not found' });

  try {
    const overall = Math.round(((price_rating + quality_rating) / 2) * 10) / 10;

    const result = db
      .prepare(
        'INSERT INTO reviews (referral_id, user_id, rating, price_rating, quality_rating, comment) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(referralId, req.user.id, overall, price_rating, quality_rating, comment || null);

    recalcAverages(referralId);

    const review = db
      .prepare(
        `SELECT r.*, u.username FROM reviews r
         JOIN users u ON r.user_id = u.id WHERE r.id = ?`
      )
      .get(result.lastInsertRowid);
    res.status(201).json(review);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'You have already reviewed this referral' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/referrals/:id/reviews/:reviewId — auth required
router.delete('/:reviewId', requireAuth, (req, res) => {
  const referralId = parseInt(req.params.id);
  const reviewId = parseInt(req.params.reviewId);

  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(reviewId);
  if (!review) return res.status(404).json({ error: 'Review not found' });
  if (review.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

  db.prepare('DELETE FROM reviews WHERE id = ?').run(reviewId);
  recalcAverages(referralId);

  res.json({ message: 'Deleted' });
});

function recalcAverages(referralId) {
  const stats = db
    .prepare(
      `SELECT
        AVG(rating) as avg,
        AVG(price_rating) as avg_price,
        AVG(quality_rating) as avg_quality,
        COUNT(*) as cnt
       FROM reviews WHERE referral_id = ?`
    )
    .get(referralId);

  db.prepare(
    'UPDATE referrals SET avg_rating = ?, avg_price_rating = ?, avg_quality_rating = ?, review_count = ? WHERE id = ?'
  ).run(
    stats.avg ? Math.round(stats.avg * 10) / 10 : 0,
    stats.avg_price ? Math.round(stats.avg_price * 10) / 10 : 0,
    stats.avg_quality ? Math.round(stats.avg_quality * 10) / 10 : 0,
    stats.cnt,
    referralId
  );
}

module.exports = router;
