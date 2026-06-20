# VouchList

**Vouched By Your Local Community**

A neighborhood service directory where community members share and rate trusted local service providers — plumbers, electricians, notaries, caterers, and more.

---

## Features

- Browse 37+ service categories with a visual tile grid
- Fuzzy search across all referrals
- Price ($$$$) and Quality (★) ratings per referral
- Submit new referrals with an initial rating
- Leave reviews with separate price and quality scores
- Filter by metro area
- Mobile-first responsive design

---

## Tech Stack

**Backend**
- Node.js 26 + Express
- SQLite via built-in `node:sqlite`
- JWT authentication
- bcrypt password hashing

**Frontend**
- Vue 3 + Vite
- Pinia (state management)
- Vue Router
- Axios
- Fuse.js (fuzzy search)

---

## Local Development

### Prerequisites
- Node.js v26+

### Setup

```bash
# Clone the repo
git clone https://github.com/karthik-janaswami/VouchList.git
cd VouchList/local-referrals

# Create .env file
echo "JWT_SECRET=your_secret_here" > .env

# Install and start backend
cd backend
npm install
npm run dev

# In a separate terminal — install and start frontend
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`
Backend API runs at `http://localhost:3000`

---

## Deployment

Deployed on [Railway](https://railway.app).

### Environment Variables

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Secret key for JWT signing |
| `NODE_ENV` | Set to `production` |
| `DB_PATH` | Path to SQLite file (e.g. `/app/db/referrals.db`) |

### Build

Railway uses:
- **Root Directory**: `local-referrals/backend`
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
