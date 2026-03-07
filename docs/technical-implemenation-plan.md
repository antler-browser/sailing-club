# Sailing Club Equipment Booking App

## Context

Transform the existing mini-app starter (a simple meetup check-in app) into a nautical-themed equipment booking app for a sailing club. Members scan a QR code, land in the app (auth handled by Local First Auth), and can browse equipment, view a weekly schedule, and book time slots. Real-time updates via WebSocket ensure all members see booking changes instantly.

**User decisions:**
- No weather strip (removed)
- Equipment seeded via a custom CSV-based script (not migrations)
- Users can cancel their own bookings

---

## 1. Database Schema

**File:** `/server/src/db/schema.ts`

Add two new tables:

### `equipment` table
| Column | Type | Notes |
|--------|------|-------|
| `id` | text, PK | User-provided ID from CSV (e.g., "s1", "k2") |
| `name` | text, not null | e.g., "Sea Breeze" |
| `type` | text, not null | e.g., "Laser", "SUP" |
| `category` | text, not null | "sail", "kayak", or "wind" |
| `status` | text, not null, default "available" | "available" or "maintenance" |
| `sortOrder` | integer, default 0 | Display ordering |

### `bookings` table
| Column | Type | Notes |
|--------|------|-------|
| `id` | integer, PK, autoincrement | |
| `equipmentId` | text, not null | References equipment.id |
| `userDid` | text, not null | References users.did |
| `date` | text, not null | ISO date "2026-03-05" |
| `startSlot` | integer, not null | 0-47 (00:00 = 0, 00:30 = 1, ... 23:30 = 47) |
| `endSlot` | integer, not null | 0-47, inclusive last slot |
| `createdAt` | integer, timestamp | |
| Index | `(equipmentId, date)` | Fast slot lookups |
| Index | `(userDid)` | "My bookings" queries |

**Slot system:** 48 half-hour slots per day (00:00–23:30). Slot 0 = 00:00, Slot 1 = 00:30, ..., Slot 47 = 23:30.

**Generate migration:** `pnpm db:generate-migrations` then `pnpm db:run-migrations`

### Equipment Seed Script

**New file:** `/scripts/seed-equipment.ts`

- Reads a CSV file (`/scripts/equipment.csv`) with columns: `id,name,type,category,status,sortOrder`
- Upserts each row into the `equipment` table via Wrangler D1 CLI
- Usage: `pnpm seed:equipment` (add script to root `package.json`)
- Supports `--remote` flag for production seeding

**New file:** `/scripts/equipment.csv` — pre-populated with the mockup's 12 items:
```
id,name,type,category,status,sortOrder
s1,Sea Breeze,Laser,sail,available,1
s2,Windward,420 Dinghy,sail,available,2
s3,Storm Chaser,Hobie Cat 16,sail,available,3
s4,Dolphin,Sunfish,sail,available,4
s5,Tide Runner,Laser Radial,sail,maintenance,5
k1,River Runner,Single Kayak,kayak,available,1
k2,Tandem Explorer,Double Kayak,kayak,available,2
k3,Paddle Pro,SUP,kayak,available,3
k4,Wave Rider,SUP,kayak,available,4
w1,Gust,Beginner Board,wind,available,1
w2,Typhoon,Advanced Board,wind,available,2
w3,Zephyr,Intermediate Board,wind,available,3
```

---

## 2. Server API Endpoints

**File:** `/server/src/index.ts`

### New Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/equipment` | Public | All equipment with category grouping |
| `GET` | `/api/bookings?date=YYYY-MM-DD` | Public | All bookings for a date, joined with user name/avatar |
| `GET` | `/api/bookings/week?start=YYYY-MM-DD` | Public | All bookings for 7 days starting from `start` |
| `GET` | `/api/bookings/mine` | JWT | Current user's active + upcoming bookings |
| `POST` | `/api/bookings` | JWT | Create booking (with overlap detection) |
| `DELETE` | `/api/bookings/:id` | JWT | Cancel own booking (or admin cancels any) |

### Booking Creation Logic
1. Verify JWT, extract DID
2. Validate: `equipmentId`, `date`, `startSlot` (0-47), `endSlot` (0-47), and that both fall within `BOOKING_START_SLOT`..`BOOKING_END_SLOT`
3. Check overlap: `WHERE equipment_id = ? AND date = ? AND start_slot <= ? AND end_slot >= ?`
4. If overlap -> 409 Conflict
5. Insert booking
6. Broadcast `booking-created` via Durable Object
7. Return booking with user info

### Booking Deletion Logic
1. Verify JWT, extract DID
2. Lookup booking by ID
3. Confirm `userDid` matches OR user is admin
4. Delete booking
5. Broadcast `booking-deleted` via Durable Object

### New WebSocket Message Types
| Type | Description |
|------|-------------|
| `booking-created` | Broadcast when a booking is made (includes booking + user data) |
| `booking-deleted` | Broadcast when a booking is cancelled (includes bookingId, equipmentId, date) |

### Shared Slot Constants

**File:** `/shared/src/slots.ts` — Shared between client and server

```typescript
export const TOTAL_SLOTS = 48           // 00:00–23:30
export const BOOKING_START_SLOT = 18    // 09:00
export const BOOKING_END_SLOT = 34      // 17:00 (last bookable slot is 16:30 = slot 33)
```

These constants are used by the server for validation and by the client for UI rendering. To change the allowed booking window (e.g., open at 07:00), just change `BOOKING_START_SLOT` to 14.

### New Model Files
- `/server/src/db/models/equipment.ts` — `getAllEquipment()`, `getEquipmentById()`
- `/server/src/db/models/bookings.ts` — `getBookingsByDate()`, `getBookingsByWeek()`, `getBookingsByUser()`, `createBooking()`, `deleteBooking()`, `checkOverlap()`
- `/server/src/db/models/index.ts` — re-export new models

### Existing Files to Keep
- `POST /api/add-user`, `POST /api/add-avatar`, `GET /api/users` — unchanged (still needed for auth flow)
- `GET /api/ws` — unchanged (WebSocket upgrade)
- Durable Object `Broadcaster` — unchanged (already supports arbitrary event broadcasting)
- `decodeAndVerifyJWT` from `@starter/shared` — reused for all JWT-protected endpoints

---

## 3. Client Architecture

### Theme & Styling

**File:** `/client/src/index.css` — Replace entirely with nautical theme

Tailwind v4 `@theme` block with:
- Colors: `--color-navy: #0A1628`, `--color-navy-mid: #12243D`, `--color-navy-light: #1A3355`, `--color-cream: #F5F0E6`, `--color-brass: #C4973B`, `--color-brass-light: #D4AD5A`, `--color-green: #2D8B5F`, `--color-red: #A0413A`, `--color-text-secondary: #8B9BB8`, `--color-text-dim: #5A6A85`
- Fonts: `--font-display: 'DM Serif Display', serif`, `--font-body: 'DM Sans', sans-serif`

`@layer components` for:
- `.rope-divider` — repeating linear gradient pattern
- Animations: `fadeUp`, `pulseGlow`
- Radial gradient background texture

**File:** `/client/index.html` — Add Google Fonts link for DM Serif Display + DM Sans

### Layout Changes

**File:** `/client/src/app.tsx` — Modify layout:
- Mobile-first single column, max-width 430px centered
- Dark navy background with radial gradient overlay
- Keep QRCodePanel for desktop (left column)
- Keep onboarding modal
- Remove reset modal (not needed for booking app)

### Navigation: State-Based Screen Switching

**File:** `/client/src/routes/home.tsx` — Rewrite as screen state machine:

```typescript
type Screen =
  | { type: 'home' }
  | { type: 'category'; categoryId: string }
  | { type: 'detail'; equipment: Equipment; categoryId: string }
```

State managed via `useState<Screen>`. No URL routing between screens.

### New Components

All in `/client/src/components/`:

| Component | Description |
|-----------|-------------|
| `HomeScreen.tsx` | Greeting, your bookings, category cards, schedule timeline |
| `CategoryScreen.tsx` | Equipment list for a category with status badges |
| `DetailScreen.tsx` | Equipment detail + day nav + slot picker + booking confirmation |
| `ScheduleTimeline.tsx` | Weekly timeline with equipment rows and color-coded booking blocks |
| `BookingCard.tsx` | Single booking card (active/upcoming) |
| `CategoryCard.tsx` | Category tile with availability count |
| `EquipmentListItem.tsx` | Equipment row in category view |
| `SlotPicker.tsx` | Half-hour slots (filtered to allowed booking window via `BOOKING_START_SLOT`/`BOOKING_END_SLOT`) with contiguous range selection |
| `ConfirmationOverlay.tsx` | Booking confirmation modal |
| `StatusBadge.tsx` | Status pill (available/in_use/reserved/maintenance) |

### New Hooks

| Hook | File | Description |
|------|------|-------------|
| `useEquipment` | `/client/src/hooks/useEquipment.ts` | Fetch all equipment, group by category |
| `useBookings` | `/client/src/hooks/useBookings.ts` | Fetch bookings by date/week, my bookings; handle real-time updates |

### Modified Hooks

**File:** `/client/src/hooks/useWebSockets.ts`
- Add callback handlers for `booking-created` and `booking-deleted` messages
- Accept an `onBookingCreated` and `onBookingDeleted` callback

### New Utilities

| File | Contents |
|------|----------|
| `/client/src/utils/slots.ts` | `halfToTime(slot)`, `getTimeGreeting()`, `getCurrentWeekDays()`, `formatDuration(slotCount)`, constants: `BOOKING_START_SLOT`, `BOOKING_END_SLOT` (configurable allowed booking window, default 09:00–17:00 = slots 18–34), `TOTAL_SLOTS = 48` |
| `/client/src/utils/memberColors.ts` | `getMemberColor(did)` — deterministic hash of DID to pick from a palette of 8-10 colors |

### Key Behaviors

**Slot selection (in SlotPicker):**
- Tap an available slot to start selection
- Tap an adjacent available slot to extend range
- Tap a non-adjacent slot to restart selection
- Tap first/last selected slot to shrink range
- Day change resets selection

**Equipment status derivation:**
- `available` = equipment.status is "available" AND no booking covers current time
- `in_use` = equipment.status is "available" AND a booking covers current time slot
- `reserved` = equipment.status is "available" AND a booking exists for later today
- `maintenance` = equipment.status is "maintenance"

**Schedule timeline (member colors):**
- Deterministic hash of user DID -> palette index
- Current user (self) always gets brass/gold (#C4973B)
- Legend shows all members who have bookings in the visible day

**Week navigation:**
- Dynamically compute Mon-Sun from current date
- "Today" badge on current day
- Arrow buttons navigate days

### Files to Keep Unchanged
- `/client/src/hooks/useLocalFirstAuth.tsx` — core auth, unchanged
- `/client/src/components/QRCodePanel.tsx` — desktop QR code, unchanged
- `/client/src/components/Avatar.tsx` — reuse for member avatars (may adjust border color to brass)
- `/client/src/main.tsx` — entry point, unchanged

---

## 4. Implementation Sequence

### Phase 1: Database
1. Add `equipment` and `bookings` tables to `/server/src/db/schema.ts`
2. Generate migration: `pnpm db:generate-migrations` (from `/server/`)
3. Run migration: `pnpm db:run-migrations`
4. Create `/server/src/db/models/equipment.ts`
5. Create `/server/src/db/models/bookings.ts`
6. Update `/server/src/db/models/index.ts`

### Phase 2: Seed Script
7. Create `/scripts/equipment.csv`
8. Create `/scripts/seed-equipment.ts`
9. Add `seed:equipment` script to root `package.json`
10. Run: `pnpm seed:equipment`

### Phase 3: API Endpoints
11. Add equipment endpoints to `/server/src/index.ts`
12. Add booking endpoints with overlap detection
13. Add WebSocket broadcasts for booking events

### Phase 4: Client Theme
14. Add Google Fonts to `/client/index.html`
15. Rewrite `/client/src/index.css` with nautical theme
16. Update `/client/src/app.tsx` for mobile-first dark layout

### Phase 5: Client Utilities & Hooks
17. Create `/client/src/utils/slots.ts`
18. Create `/client/src/utils/memberColors.ts`
19. Create `/client/src/hooks/useEquipment.ts`
20. Create `/client/src/hooks/useBookings.ts`
21. Extend `/client/src/hooks/useWebSockets.ts` with booking events

### Phase 6: Client Screens
22. Build `StatusBadge.tsx`, `BookingCard.tsx`, `CategoryCard.tsx`
23. Build `ScheduleTimeline.tsx`
24. Build `HomeScreen.tsx`
25. Build `EquipmentListItem.tsx`, `CategoryScreen.tsx`
26. Build `SlotPicker.tsx`, `ConfirmationOverlay.tsx`, `DetailScreen.tsx`
27. Rewrite `/client/src/routes/home.tsx` as screen state machine
28. Update `/client/src/components/Avatar.tsx` border color

### Phase 7: Polish
29. Update `/client/public/local-first-auth-manifest.json` metadata

---

## 5. Verification

1. **Start dev server:** `pnpm run dev:simulator`
2. **Seed equipment:** `pnpm seed:equipment`
3. **Check home screen:** Greeting, empty bookings section, 3 category cards with counts, empty schedule
4. **Browse category:** Tap a category card -> see equipment list with status badges
5. **Book a slot:** Tap equipment -> select time slots -> confirm -> booking appears in "Your Bookings"
6. **Real-time test:** Open two browser tabs, book in one, verify the other updates instantly
7. **Cancel booking:** Tap a booking, cancel it, verify it disappears from both tabs
8. **Schedule timeline:** Verify bookings appear as colored blocks, day navigation works
9. **DB verification:** `pnpm wrangler d1 execute sailing-club-dev-db --local --command "SELECT * FROM bookings;"`
