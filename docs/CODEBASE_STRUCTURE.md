# Codebase Structure

## Repository layout

```
bag-tracker/
├── backend/                       Express + TypeScript API
│   ├── src/
│   │   ├── controllers/           Business logic per resource
│   │   │   ├── auth.controller.ts
│   │   │   ├── trip.controller.ts
│   │   │   ├── bag.controller.ts
│   │   │   ├── tracking.controller.ts
│   │   │   ├── notification.controller.ts
│   │   │   ├── subscription.controller.ts (also handles Stripe webhook)
│   │   │   ├── dashboard.controller.ts
│   │   │   └── device.controller.ts        (new)
│   │   ├── routes/                Express routers (one per resource)
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts          JWT auth + AuthRequest type
│   │   │   └── premium.middleware.ts       requirePremium gate
│   │   ├── config/
│   │   │   └── devices.catalog.ts          (new) hardcoded shop catalog
│   │   ├── utils/prisma.ts        Prisma client singleton
│   │   ├── utils/cloudinaryUpload.ts  Shared `bagUpload` multer instance (Cloudinary `bag-photos/` folder, 8 MB cap, 1200×1200 limit)
│   │   └── index.ts               App bootstrap + route mounting
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── package.json
│
├── frontend/                      React + Vite + TS SPA
│   ├── src/
│   │   ├── pages/                 Route-level pages (Trips, Bags, Tracking, Subscription, …)
│   │   ├── components/
│   │   │   ├── Layout.tsx                  App shell + sidebar nav
│   │   │   ├── SubscriptionGate.tsx        (new) blocks Add-Trip / Add-Bag / Tracking when premium lapsed
│   │   │   ├── common/                     Inputs, dialogs
│   │   │   └── landing/                    Marketing sections
│   │   ├── store/authStore.ts     Zustand auth state (user, token, checkAuth)
│   │   ├── hooks/
│   │   │   └── useSubscriptionStatus.ts    (new)
│   │   ├── utils/api.ts           Axios instance with JWT interceptor
│   │   ├── App.tsx                Router config
│   │   └── main.tsx               Vite entry
│   └── package.json
│
├── docs/                          (this folder)
├── deploy/amplify/                Amplify deployment config
├── docker-compose*.yml            Local + prod compose files
└── BagTracker-API.postman_collection.json
```

## Tech stack

### Backend (`backend/package.json`)
| Concern | Library / Version |
|---|---|
| Runtime | Node.js + TypeScript 5.3.3 |
| HTTP server | Express 4.18.2 |
| ORM / DB | Prisma 5.9.1 + PostgreSQL (`pg` 8.11.3) |
| Auth | JWT (`jsonwebtoken` 9.0.2) + bcryptjs |
| Validation | express-validator |
| File upload | multer + multer-storage-cloudinary (Cloudinary for **all** bag + profile photos; no local disk) |
| Payments | Stripe 18.5.0 |
| Email | nodemailer |
| Misc | cors, helmet, morgan |
| Dev | nodemon, ts-node |

### Frontend (`frontend/package.json`)
| Concern | Library / Version |
|---|---|
| Framework | React 18.2 + react-router-dom 6.22 |
| Build | Vite 5.1 + TypeScript 5.2 |
| State | Zustand 4.5 |
| Forms | react-hook-form 7.50 + zod 3.22 |
| HTTP | axios 1.6 |
| Styling | Tailwind CSS 3.4, lucide-react icons, clsx, tailwind-merge |
| Payments | @stripe/react-stripe-js, @stripe/stripe-js |
| Misc | date-fns, country-state-city, airports, jwt-decode |

## Module purposes

| Module | Purpose |
|---|---|
| `controllers/auth` | Register, login, profile, password reset |
| `controllers/trip` | Create trip with bags (multipart), list, fetch |
| `controllers/bag` | CRUD on individual bags, multer disk upload |
| `controllers/tracking` | Admin posts events; users read timelines |
| `controllers/notification` | List + mark-as-read for user notifications |
| `controllers/subscription` | Stripe checkout, sync, cancel/reactivate, webhook |
| `controllers/dashboard` | Aggregate counts for dashboard |
| `controllers/device` | (new) Catalog, checkout, sync, list devices, orders, invoice |
| `pages/Trips` | Create / list trips with embedded bag rows |
| `pages/Bags` | Standalone Add Bag flow |
| `pages/Tracking` | Timeline view per bag |
| `pages/Subscription` | Plans, billing history, cancel/reactivate |
| `pages/DeviceShop`, `MyDevices`, `DeviceOrders`, `DeviceCheckout`, `DeviceOrderResult`, `DeviceInvoice` | (new) device shop UX |
