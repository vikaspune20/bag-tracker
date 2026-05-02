# Database Schema

PostgreSQL via Prisma. All models live in [backend/prisma/schema.prisma](../backend/prisma/schema.prisma).

## Tables

### User
| Field | Type | Notes |
|---|---|---|
| `id` | String (uuid) | PK |
| `fullName` | String | |
| `email` | String | unique |
| `phone` | String | |
| `address` | String | |
| `state` | String | |
| `city` | String | |
| `zip` | String? | |
| `country` | String | default `"United States"` |
| `identificationNo` | String | SSN / national id |
| `passwordHash` | String | bcrypt 12 rounds |
| `profilePicUrl` | String? | Cloudinary URL |
| `role` | String | default `"USER"` (also `ADMIN`) |
| `resetToken`, `resetTokenExpiry` | String?, DateTime? | password reset |
| `isPremium` | Boolean | default false |
| `planType` | String? | `MONTHLY_200` / `QUARTERLY_400` / `YEARLY_600` / `DEVICE_BONUS` (new) |
| `subscriptionId` | String? | Stripe subscription ID |
| `expiryDate` | DateTime? | premium end |
| `cancelAtPeriodEnd` | Boolean | default false |
| `stripeCustomerId` | String? | |
| `createdAt`, `updatedAt` | DateTime | |
| Relations | `trips Trip[]`, `notifications Notification[]`, `subscriptions Subscription[]`, `devices TrackingDevice[]` (new), `deviceOrders DeviceOrder[]` (new) | |

### Trip
| Field | Type | Notes |
|---|---|---|
| `id` | String (uuid) | PK |
| `userId` | String | FK → User |
| `flightNumber`, `airlineName` | String | |
| `departureAirport`, `destinationAirport` | String | IATA codes |
| `departureDateTime` | DateTime | |
| `arrivalDateTime` | DateTime? | |
| Indexes | `@@index([userId, departureDateTime])` | |
| Relations | `user User`, `bags Bag[]` | |

### Bag
| Field | Type | Notes |
|---|---|---|
| `id` | String (uuid) | PK |
| `tripId` | String | FK → Trip |
| `tagNumber` | String | airline tag **or** the `deviceId` of an attached `TrackingDevice` |
| `description` | String | |
| `imagePath` | String? | local upload path |
| `weightLbs` | Float | |
| Constraints | `@@unique([tripId, tagNumber])` | |
| Indexes | `@@index([tripId, tagNumber])` | |
| Relations | `trip Trip`, `trackingLogs TrackingLog[]`, `notifications Notification[]` | |

> Bag does **not** have a direct FK to `TrackingDevice`. The link is a string match: `Bag.tagNumber === TrackingDevice.deviceId`, scoped to the same user.

### TrackingLog
| Field | Type | Notes |
|---|---|---|
| `id` | String (uuid) | PK |
| `bagId` | String | FK → Bag |
| `status` | String | `Checked-in`, `In Transit`, `Arrived`, `Delivered`, … |
| `airportLocation` | String? | IATA code |
| `remarks` | String? | |
| `timestamp` | DateTime | default now |
| Indexes | `@@index([bagId, timestamp])` | |

### Notification
| Field | Type | Notes |
|---|---|---|
| `id` | String (uuid) | PK |
| `userId`, `bagId?` | String | FKs |
| `message` | String | |
| `type` | String | e.g. `BAGGAGE_UPDATE` |
| `isRead` | Boolean | default false |
| `createdAt` | DateTime | |
| Indexes | `@@index([userId, createdAt])` | |

### Subscription
| Field | Type | Notes |
|---|---|---|
| `id` | String (uuid) | PK |
| `userId` | String | FK → User |
| `planMonths` | Int | 1 / 3 / 12 |
| `amount` | Int | dollars (history table; payments stored in dollars after `Math.round(.../100)`) |
| `stripePaymentIntentId` | String | unique |
| `status` | String | `active` / `failed` |
| `stripeCustomerId`, `stripeSubscriptionId` | String? | |
| `currentPeriodEnd` | DateTime? | |
| `createdAt`, `updatedAt` | DateTime | |
| Indexes | `@@index([userId, status])` | |

### TrackingDevice (new)
| Field | Type | Notes |
|---|---|---|
| `id` | String (uuid) | PK |
| `userId` | String | FK → User |
| `orderId` | String | FK → DeviceOrder |
| `deviceId` | String | unique, human-readable e.g. `JC-DEV-AB12CD34` |
| `status` | String | `ACTIVE` / `EXPIRED` |
| `purchasedAt` | DateTime | default now |
| `expiresAt` | DateTime | hardware expiry, 1 year from purchase |
| Indexes | `@@index([userId, status])` | |
| Relations | `user User`, `order DeviceOrder` | |

### DeviceOrder (new)
| Field | Type | Notes |
|---|---|---|
| `id` | String (uuid) | PK |
| `userId` | String | FK → User |
| `productSku` | String | from hardcoded catalog |
| `quantity` | Int | |
| `unitAmount`, `totalAmount` | Int | USD cents |
| `currency` | String | default `"usd"` |
| `stripeSessionId`, `stripePaymentIntentId` | String? | both unique |
| `status` | String | `PENDING` → `PAID` / `FAILED` → `SHIPPED` → `DELIVERED` / `CANCELED` |
| `shippingName`, `shippingPhone`, `shippingAddressLine`, `shippingCity`, `shippingState`, `shippingZip`, `shippingCountry` | String | |
| `bonusGranted` | Boolean | tracks one-time premium grant |
| `paidAt` | DateTime? | |
| Indexes | `@@index([userId, status])` | |
| Relations | `user User`, `devices TrackingDevice[]` | |

## Foreign-key map

```
User 1───* Trip 1───* Bag 1───* TrackingLog
User 1───* Notification *───? Bag
User 1───* Subscription
User 1───* TrackingDevice *───1 DeviceOrder *───1 User
Bag <soft link via tagNumber> TrackingDevice.deviceId
```
