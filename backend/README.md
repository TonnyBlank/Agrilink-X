# AgriLink X – Backend API

Node.js + Express + TypeScript REST API backed by Supabase.

## Project Structure

```
Agrixl/
├── agrilink-ecosystem/   → React frontend (Vite)
├── backend/              → THIS – Node.js/Express REST API
│   ├── src/
│   │   ├── index.ts                ← Server entry point
│   │   ├── lib/supabase.ts         ← Supabase admin client
│   │   ├── middleware/
│   │   │   ├── auth.ts             ← JWT verification
│   │   │   └── errorHandler.ts     ← Global error handler
│   │   └── routes/
│   │       ├── products.ts         ← /api/products
│   │       ├── orders.ts           ← /api/orders
│   │       ├── messages.ts         ← /api/messages
│   │       ├── cropEvents.ts       ← /api/crop-events
│   │       ├── profiles.ts         ← /api/profiles
│   │       └── idVerification.ts   ← /api/id-verification
│   ├── package.json
│   └── tsconfig.json
└── supabase/             → Supabase config & migrations
    ├── config.toml
    └── migrations/
        └── 001_initial_schema.sql
```

## Setup

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
# from: https://supabase.com/dashboard/project/_/settings/api
```

### 3. Run the database migration
- Open your [Supabase SQL editor](https://supabase.com/dashboard/project/_/sql)
- Paste and run `supabase/migrations/001_initial_schema.sql`

### 4. Start the backend
```bash
npm run dev      # development (hot-reload)
npm run build    # build TypeScript
npm start        # production
```

Server runs at: **http://localhost:3001**

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/health` | Health check | — |
| GET | `/api/products` | All marketplace products | — |
| GET | `/api/products/mine` | My products | ✅ |
| POST | `/api/products` | Create product | ✅ |
| PATCH | `/api/products/:id` | Update product | ✅ |
| DELETE | `/api/products/:id` | Delete product | ✅ |
| POST | `/api/products/upload-video` | Upload product video | ✅ |
| GET | `/api/orders/selling` | My selling orders | ✅ |
| GET | `/api/orders/buying` | My buying orders | ✅ |
| POST | `/api/orders` | Place order | ✅ |
| PATCH | `/api/orders/:id/status` | Update order status | ✅ |
| GET | `/api/messages/conversations` | My conversations | ✅ |
| GET | `/api/messages/conversations/:id` | Messages in conversation | ✅ |
| POST | `/api/messages/conversations` | Start conversation | ✅ |
| POST | `/api/messages/conversations/:id/send` | Send message | ✅ |
| GET | `/api/crop-events` | My crop calendar events | ✅ |
| POST | `/api/crop-events` | Create crop event | ✅ |
| PATCH | `/api/crop-events/:id` | Update/mark done | ✅ |
| DELETE | `/api/crop-events/:id` | Delete event | ✅ |
| GET | `/api/profiles/me` | My profile | ✅ |
| GET | `/api/profiles/:userId` | Any user's profile | — |
| PATCH | `/api/profiles/me` | Update my profile | ✅ |
| GET | `/api/id-verification` | My verification status | ✅ |
| POST | `/api/id-verification/upload` | Upload ID document | ✅ |

**Auth:** All protected routes require `Authorization: Bearer <supabase_jwt>` header.
