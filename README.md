# SmartBazaar

AI-powered second-hand marketplace. Built to beat OLX/Facebook Marketplace on trust, AI listing, and rural India reach.

## Running it

### 1. Backend

```bash
cd backend
# First time only:
npm install
cp .env.example .env        # then edit .env and paste your GEMINI_API_KEY
npx prisma db push          # create local SQLite db
# Every run:
npm run dev                 # serves on http://localhost:4000
```

Get a Gemini API key (free): https://aistudio.google.com/apikey

### 2. Mobile

```bash
cd mobile
npm install                 # first time only
npm start                   # opens Expo dev tools
```

Then press `a` for Android emulator, or scan the QR code with the Expo Go app on your phone.

**If running on a physical device**, edit `mobile/app.json` → `expo.extra.apiUrl` and set it to your machine's LAN IP (e.g. `http://192.168.1.5:4000`). The default `10.0.2.2` only works for Android emulator.

## What's built (v1)

- **Phone OTP auth** (dev mode returns the code in the response so you can test without SMS)
- **Listings**: create, browse, search, filter, detail view
- **AI auto-listing**: photo → title + description + category + price via Gemini 1.5 Flash
- **Reverse marketplace** (`/wants`): buyer posts a need, we match active listings
- **Chat**: per-listing buyer ↔ seller messages
- **Trust badges**: per-user trust score + verified flag

## What's next

1. **Image upload** — currently stores local URIs. Wire Supabase Storage or Cloudflare R2.
2. **Real OTP** — swap `/auth/request-otp` to MSG91 or Twilio.
3. **Migrate to Supabase Postgres** — flip `prisma/schema.prisma` provider to `postgresql`, update `DATABASE_URL`, `prisma db push`.
4. **Geo search** — use PostGIS once on Postgres.
5. **Voice search** (regional languages) — the tier-2/3 unlock.
6. **Escrow payments** — Razorpay payment link + hold until buyer confirms.
