# Existing Features

## Trip management

### Workflow
1. **Create.** From `/trips`, user clicks "Add Trip" → modal opens. They enter flight info, airports, dates/times, and **at least one bag** (each bag has tagNumber, weight, description, optional image). Submit posts multipart to `POST /api/trips`.
2. **Persist.** Backend creates the `Trip` row, then iterates the parsed `bags` JSON in a single `prisma.$transaction`. For each bag it stores the row, attaches the matching `image_<i>` file from `req.files`, and creates an initial `TrackingLog { status: 'Checked-in', airportLocation: departureAirport }`.
3. **List.** `GET /api/trips` returns trips ordered by `departureDateTime` desc, each including its bags and the latest `TrackingLog` for status badges.
4. **Detail.** `GET /api/trips/:id` returns one trip with **all** tracking logs per bag.
5. **History.** `/history` page shows past trips (those with `arrivalDateTime` in the past).

### Files
- Backend: [trip.controller.ts](../backend/src/controllers/trip.controller.ts), [trip.routes.ts](../backend/src/routes/trip.routes.ts).
- Frontend: [pages/Trips.tsx](../frontend/src/pages/Trips.tsx), [pages/TripHistory.tsx](../frontend/src/pages/TripHistory.tsx).

## Baggage management

### Workflow
1. **Standalone Add.** From `/bags` → "Add Bag" modal → choose existing trip, enter tag number, weight, description, optional image → `POST /api/bags`. A `TrackingLog { Checked-in, departureAirport }` is created.
2. **List.** `GET /api/bags` returns the user's bags (joined to their trip), each with its tracking logs ordered desc.
3. **Detail.** `GET /api/bags/:id` returns the bag with all tracking logs ordered asc — used by the timeline view.
4. **Delete.** `DELETE /api/bags/:id` cascades to its `TrackingLog`s and `Notification`s.

### Files
- Backend: [bag.controller.ts](../backend/src/controllers/bag.controller.ts), [bag.routes.ts](../backend/src/routes/bag.routes.ts).
- Frontend: [pages/Bags.tsx](../frontend/src/pages/Bags.tsx).

## Tracking

### Workflow
- Tracking events are **admin-only**. `POST /api/tracking { bagId, status, airportLocation, remarks }` appends a `TrackingLog` and creates a `Notification` for the bag's owner ("Your bag (TAG) status changed to STATUS at LOC.").
- Users read timelines via `GET /api/tracking/:bagId` or `GET /api/tracking/by-tag/:tag`.
- The frontend `/tracking` page renders a vertical timeline. A simulation hook (`useTrackingSimulation.ts`) is available for demos.

### Files
- Backend: [tracking.controller.ts](../backend/src/controllers/tracking.controller.ts), [tracking.routes.ts](../backend/src/routes/tracking.routes.ts).
- Frontend: [pages/Tracking.tsx](../frontend/src/pages/Tracking.tsx).

## Notifications
- Generated automatically by tracking events.
- `GET /api/notifications` lists by `createdAt` desc.
- `PATCH /api/notifications/:id/read` and `/mark-all-read` toggle the read flag.

## Dashboard
- `GET /api/dashboard` returns aggregate counts: `totalTrips`, `upcomingTrips`, `registeredBags`, `activeTracking`, `progress` (% delivered).

## Subscription (Stripe)

### Plans
| Plan | Stripe price env | Months |
|---|---|---|
| `MONTHLY_200` | `STRIPE_PRICE_MONTHLY_200` | 1 |
| `QUARTERLY_400` | `STRIPE_PRICE_QUARTERLY_400` | 3 |
| `YEARLY_600` | `STRIPE_PRICE_YEARLY_600` | 12 |

### Workflow
1. **Checkout.** `POST /api/subscriptions/checkout-session { priceId }` → creates Stripe customer if missing → creates `mode: 'subscription'` checkout session → returns `{ url }`. Frontend redirects via `window.location.href`.
2. **Return.** Stripe redirects to `/subscription-result?session_id=...`. Page mounts and posts `POST /api/subscriptions/sync-session { sessionId }`.
3. **Activation.** Backend retrieves the session, verifies completion, retrieves the subscription, maps `priceId → planType`, computes `expiryDate` from `current_period_end`, updates user (`isPremium=true`, `planType`, `subscriptionId`, `expiryDate`), upserts a `Subscription` row.
4. **Webhook.** `POST /api/stripe/webhook` (raw body) is the authoritative path:
   - `invoice.payment_succeeded` → activate.
   - `invoice.payment_failed` → deactivate + record `failed` row.
   - `customer.subscription.updated` → sync `cancelAtPeriodEnd`, `expiryDate`.
   - `customer.subscription.deleted` → clear premium fields.
5. **Cancel / Reactivate.** Sets `cancel_at_period_end` flag in Stripe + DB. Reactivate flips it back. Both gated by `requirePremium`.
6. **History.** `GET /api/subscriptions/history` → last 20 `Subscription` rows for the billing-history table.

### Files
- Backend: [subscription.controller.ts](../backend/src/controllers/subscription.controller.ts), [subscription.routes.ts](../backend/src/routes/subscription.routes.ts), [stripe.routes.ts](../backend/src/routes/stripe.routes.ts).
- Frontend: [pages/Subscription.tsx](../frontend/src/pages/Subscription.tsx), [pages/SubscriptionResult.tsx](../frontend/src/pages/SubscriptionResult.tsx).

## Auth & onboarding

- **Register/Login** — see [AUTH_SYSTEM.md](AUTH_SYSTEM.md).
- **Profile** — `GET / PUT /api/auth/profile`. Profile picture is uploaded via Cloudinary (multer-storage-cloudinary), 5 MB cap, auto-resized to 400×400.
- **Forgot/Reset password** — Token-based via SMTP (15-minute expiry).

## Current user flows (top of funnel)

```
Landing
  → Register / Login
    → Dashboard
      → Subscribe (Stripe) ──→ Active premium
      → Add Trip (with embedded bags) ──→ Tracking timeline
      → Add Bag (standalone) ──────────┘
      → Notifications
      → Profile
```
