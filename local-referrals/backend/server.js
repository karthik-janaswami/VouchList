require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const referralRoutes = require('./routes/referrals');
const reviewRoutes = require('./routes/reviews');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : (process.env.FRONTEND_URL || 'http://localhost:5173')
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/referrals/:id/reviews', reviewRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve built frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/dist/index.html')));
}

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
