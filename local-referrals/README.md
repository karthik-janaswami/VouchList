# VouchList

A community-powered directory of trusted local service providers. Neighbors vouch for plumbers, electricians, notaries, caterers, and more — with price and quality ratings to help you choose.

## What it does

- Browse 37+ service categories (plumber, dentist, notary, catering, etc.)
- Search by name or description with fuzzy matching
- Filter by metro area
- Rate services on price ($$$$) and quality (★) separately
- Submit new referrals with contact info and an initial rating
- Leave reviews on any listing

## Tech Stack

| | |
|---|---|
| **Frontend** | Vue 3, Vite, Pinia, Vue Router, Fuse.js |
| **Backend** | Node.js 26, Express, SQLite (`node:sqlite`), JWT |
| **Hosting** | Railway |

## Running locally

**Prerequisites:** Node.js v26+

```bash
git clone https://github.com/karthik-janaswami/VouchList.git
cd VouchList/local-referrals

# Create .env
echo "JWT_SECRET=your_secret_here" > .env

# Start backend
cd backend && npm install && npm run dev

# Start frontend (new terminal)
cd frontend && npm install && npm run dev
```

Frontend → `http://localhost:5173`
API → `http://localhost:3000`
