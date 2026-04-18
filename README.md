# Baggage Tracking System

Production-style fullstack application:
- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + Prisma
- Database: PostgreSQL
- Auth: JWT
- Email reset: Nodemailer
- Payments: Stripe Payment Element (card + Apple Pay on supported devices)

## Setup

1. Backend env:
   - Copy `backend/.env.example` to `backend/.env`
2. Frontend env:
   - Copy `frontend/.env.example` to `frontend/.env`
3. Install dependencies:
   - `cd backend && npm install`
   - `cd frontend && npm install`
4. Configure PostgreSQL in `backend/.env` (`DATABASE_URL`).
5. Run Prisma:
   - `cd backend`
   - `npx prisma migrate dev --name init_postgres`
   - `npx prisma generate`
6. Start apps:
   - `cd backend && npm run dev`
   - `cd frontend && npm run dev`

## Key API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/profile`
- `PUT /api/auth/profile`
- `POST /api/trips` (trip + bags in one request)
- `GET /api/trips`
- `GET /api/trips/:id`
- `POST /api/bags`
- `GET /api/bags`
- `GET /api/tracking/:bagId`
- `GET /api/tracking/by-tag/:tag`
- `GET /api/notifications`
- `POST /api/subscriptions/create-intent`
- `POST /api/subscriptions/confirm`

## Database

- Prisma schema: `backend/prisma/schema.prisma`
- SQL DDL: `backend/prisma/schema.sql`
