# Auth System

## Tokens
- Stateless **JWT** signed with `process.env.JWT_SECRET` (fallback `supers3cr3tjwtk3y` in dev — must be overridden in prod).
- Issued on register / login. Payload: `{ id: <userId>, role: "USER" | "ADMIN" }`. Expires in 7 days.
- Sent on every protected request as `Authorization: Bearer <token>`.

## Backend

### Middleware ([backend/src/middlewares/auth.middleware.ts](../backend/src/middlewares/auth.middleware.ts))
```ts
export const authenticateToken = (req: AuthRequest, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = decoded;
    next();
  });
};
```
- Mounted via `router.use(authenticateToken)` per resource router (trips, bags, tracking, notifications, subscriptions, devices).
- `AuthRequest.user = { id, role }` is the canonical principal.

### Premium gate ([backend/src/middlewares/premium.middleware.ts](../backend/src/middlewares/premium.middleware.ts))
```ts
const active = Boolean(user.isPremium && user.expiryDate && user.expiryDate > now);
if (!active) return res.status(402).json({ message: 'Premium subscription required' });
```
- Applied **on top of** `authenticateToken` for trip/bag creation, tracking reads, and `cancel`/`reactivate` subscription routes.
- A `DEVICE_BONUS` planType (granted on first device purchase) sets `isPremium = true` with `expiryDate = now + 30d`, so the same gate works for the bonus.

### Roles
- `USER` (default) — full access to own data.
- `ADMIN` — additionally allowed to call `POST /api/tracking` and read other users' bags/trips. Role check is inline in controllers (`req.user.role !== 'ADMIN'`), no dedicated middleware.

## Frontend

### Store ([frontend/src/store/authStore.ts](../frontend/src/store/authStore.ts))
Zustand store holding:
| Field | Purpose |
|---|---|
| `user: User \| null` | sanitized user from `/auth/profile` |
| `token: string \| null` | JWT (also persisted to `localStorage`) |
| `isAuthenticated: boolean` | derived |
| `authReady: boolean` | true once `checkAuth()` finishes — prevents redirect flicker |
| `login(user, token)` | persists token, sets state |
| `logout()` | clears token + redirects `/login` |
| `checkAuth()` | on mount: reads token from localStorage, calls `/auth/profile`, hydrates user |

### Axios interceptor ([frontend/src/utils/api.ts](../frontend/src/utils/api.ts))
Injects `Authorization: Bearer <token>` from `localStorage` on every outbound request — no manual handling needed in components.

### Route guard ([frontend/src/components/Layout.tsx](../frontend/src/components/Layout.tsx))
Wraps protected routes. While `authReady === false && hasToken`, it renders a spinner. After hydration, redirects to `/login` if there is no `user`.

## User model exposed to frontend

Sanitized in `auth.controller.sanitizeUser()` — strips `passwordHash`, `resetToken*`, `subscriptionId`, etc. Fields: `id, fullName, email, phone, address, city, state, zip, country, identificationNo, profilePicUrl, role`.

## Login / registration flow

1. `POST /auth/register` → server hashes password (bcrypt rounds=12) → creates `User` → signs JWT → returns `{ user, token }`.
2. Frontend `Register.tsx` → `authStore.login(user, token)` → persists to `localStorage` → routes to `/dashboard`.
3. On reload, `App.tsx` calls `authStore.checkAuth()` which `GET /auth/profile` to refresh user state.
4. `Logout` clears the token and sends user to `/login`.

## Password reset

- `POST /auth/forgot-password` → server stores random token + 15-min expiry → emails reset link via SMTP.
- `POST /auth/reset-password` → validates `token` + `password`, hashes and saves, clears token fields.

## Notes / gotchas

- The validation middleware (`registerValidation`, etc.) is *defined* but not currently registered on the routes — register/login go straight to controllers. Keep this in mind if adding strict server-side validation.
- `JWT_SECRET` fallback is unsafe; production deploys must set it.
