const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');

const router = express.Router();
const SALT_ROUNDS = 10;

router.post('/register', async (req, res) => {
  const { first_name, last_name, email, password } = req.body;
  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ error: 'First name, last name, email, and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const username = email;
  try {
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = db
      .prepare('INSERT INTO users (username, email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?, ?)')
      .run(username, email, password_hash, first_name, last_name);
    const user = { id: result.lastInsertRowid, username, email, first_name, last_name };
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!row) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const match = await bcrypt.compare(password, row.password_hash);
  if (!match) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const user = { id: row.id, username: row.username, email: row.email, first_name: row.first_name, last_name: row.last_name };
  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user });
});

module.exports = router;
