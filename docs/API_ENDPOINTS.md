# API Endpoints

Base URL: `http://localhost:5000/api` (dev) / `https://api.jcsmartbag.com/api` (prod). All routes JSON unless noted.

Auth = `Authorization: Bearer <jwt>` issued by `POST /api/auth/login`. Premium-gated routes additionally require `User.isPremium && expiryDate > now`.

## Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | – | Liveness probe |

## Auth (`/api/auth`)

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/register` | – | `{ fullName, email, phone, address, state, city, zip, country?, identificationNo?, password }` | Returns `{ message, email, requiresOtp: true }` — no token. User must verify via OTP. |
| POST | `/verify-otp` | – | `{ email, otp }` | On success returns `{ user, token }`. Sends welcome email. |
| POST | `/resend-otp` | – | `{ email }` | Always 200. Re-issues a fresh OTP if the user is unverified. |
| POST | `/login` | – | `{ email, password }` | Returns `{ user, token }` if email is verified. If unverified, 403 `{ requiresOtp: true, email }` and a fresh OTP is emailed. |
| POST | `/forgot-password` | – | `{ email }` | Always 200 (no enumeration) |
| POST | `/reset-password` | – | `{ token, password }` | |
| GET | `/profile` | JWT | – | `{ user }` |
| PUT | `/profile` | JWT | multipart `profilePic` + fields | Cloudinary upload |
| GET | `/app-version` | – | – | `{ minVersion }` |

## Trips (`/api/trips`)

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/` | JWT + **Premium** + **OwnsDevice** | multipart: `flightNumber`, `airlineName`, `departureAirport`, `destinationAirport`, `departureDate`, `departureTime`, `arrivalDate`, `arrivalTime`, `bags` (JSON), `image_<i>` files | Each bag may set `tagNumber` to a device's `deviceId` to attach a tracking device. Sends a TRIP_UPDATE notification + email on success. |
| GET | `/` | JWT | – | `{ trips: [...] }`, each bag includes synthetic `device` field |
| GET | `/:id` | JWT | – | `{ data: trip }` |

## Bags (`/api/bags`)

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/` | JWT + **Premium** + **OwnsDevice** | multipart `tripId`, `tagNumber`, `weight`, `description`, `image` | tagNumber may equal a device's `deviceId` |
| GET | `/` | JWT | – | `{ bags: [...] }` with synthetic `device` |
| GET | `/:id` | JWT | – | `{ bag }` |
| PATCH | `/:id` | JWT + **Premium** | `{ tagNumber?, description?, weight? }` | Re-validates device on tagNumber change |
| DELETE | `/:id` | JWT | – | Detaches by deletion |

## Tracking (`/api/tracking`)

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/` | JWT + ADMIN | `{ bagId, status, airportLocation?, remarks? }` | Creates Notification too |
| GET | `/:bagId` | JWT + **Premium** | – | Timeline events |
| GET | `/by-tag/:tag` | JWT + **Premium** | – | Lookup by tag number |

## Notifications (`/api/notifications`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | JWT | List own notifications |
| PATCH | `/mark-all-read` | JWT | |
| PATCH | `/:id/read` | JWT | |

## Subscriptions (`/api/subscriptions`)

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| GET | `/status` | JWT | – | `{ active, planType, subscriptionId, expiryDate, cancelAtPeriodEnd, source, hasDevice, deviceCount }` (`source`: `STRIPE` / `DEVICE_BONUS`) |
| GET | `/history` | JWT | – | last 20 Subscription rows |
| POST | `/checkout-session` | JWT | `{ priceId }` | Creates Stripe subscription session |
| POST | `/sync-session` | JWT | `{ sessionId }` | Idempotent activation fallback |
| POST | `/cancel` | JWT + Premium | – | Sets `cancel_at_period_end=true` |
| POST | `/reactivate` | JWT + Premium | – | Sets `cancel_at_period_end=false` |

## Devices (`/api/devices`) (new)

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| GET | `/catalog` | JWT | – | Hardcoded product list |
| POST | `/checkout-session` | JWT | `{ sku, quantity, shipping:{name, phone, addressLine, city, state, zip, country?} }` | Creates `DeviceOrder` PENDING + Stripe one-time session, returns `{ url, orderId }` |
| POST | `/sync-session` | JWT | `{ sessionId }` | Idempotent: marks order PAID, generates devices, grants 1-month premium on first PAID order |
| GET | `/` | JWT | `?available=true` filter | `{ devices: [...] }` with `available` flag and current `bag` reference |
| GET | `/orders` | JWT | – | `{ orders: [...] }` |
| GET | `/orders/:id/invoice` | JWT | – | `{ order, items, totals, customer }` payload for printable invoice |

## Internal cron (`/api/internal`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/run-expiry-reminders` | `Authorization: Bearer ${CRON_SECRET}` | Sends 7-day-out and day-of expiry emails + creates Notification rows. Idempotent: tracked via `User.expiryReminder7SentAt` / `expiryReminder0SentAt`. Returns `{ ok, sevenDay, dayOf, runAt }`. |

## Stripe Webhook

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/stripe/webhook` | Stripe signature | `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`, `checkout.session.completed` (device-orders), `payment_intent.payment_failed` (device-orders) |

## Static

| Method | Path | Notes |
|---|---|---|
| GET | `/uploads/<file>` | Public bag image serving |

## Error envelope

`{ "message": "<human readable>", "error"?: "<original error msg>" }`. Validation: `422 { message, errors:[{field,message}] }`.
