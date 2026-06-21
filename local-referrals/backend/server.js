require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const authRoutes = require('./routes/auth');
const referralRoutes = require('./routes/referrals');
const reviewRoutes = require('./routes/reviews');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : (process.env.FRONTEND_URL || 'http://localhost:5173')
}));
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
const accessLog = fs.createWriteStream(path.join(logsDir, 'access.log'), { flags: 'a' });
const errorLog = fs.createWriteStream(path.join(logsDir, 'error.log'), { flags: 'a' });

app.use(morgan('dev'));
app.use(morgan('combined', { stream: accessLog }));
app.use(express.json());

// Auto-seed if DB is empty
require('./db/seed');

app.use('/api/auth', authRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/referrals/:id/reviews', reviewRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve built frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/dist/index.html')));
}

app.use((err, req, res, next) => {
  const msg = `[${new Date().toISOString()}] [ERROR] ${req.method} ${req.url}\n${err.stack || err}\n`;
  console.error(msg);
  errorLog.write(msg);
  res.status(500).json({ error: 'Internal server error' });
});

process.on('uncaughtException', (err) => {
  const msg = `[${new Date().toISOString()}] [FATAL] Uncaught exception:\n${err.stack || err}\n`;
  console.error(msg);
  errorLog.write(msg);
});

process.on('unhandledRejection', (err) => {
  const msg = `[${new Date().toISOString()}] [FATAL] Unhandled rejection:\n${err.stack || err}\n`;
  console.error(msg);
  errorLog.write(msg);
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
