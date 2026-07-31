# Hospital Registration & Queue Management System — Master Build Prompt

> **How to use this document:** This is a complete implementation spec written to be fed directly to an autonomous coding agent (Claude Code, Gemini in Antigravity, etc). It contains architecture, schema, API contracts, Socket.IO events, design tokens, and a phased build order. Follow it top to bottom; do not skip the phase order in Section 12 — later phases depend on earlier ones being functionally complete.

---

## 0. Assumptions & Deployment Decision (read first)

The original brief asked for "Vercel deployment" for the web app. That holds for the **two Next.js frontends**, but the backend cannot live on Vercel:

| Requirement | Why Vercel serverless fails it |
|---|---|
| Persistent Socket.IO connections | Vercel functions are stateless, short-lived, and spin down between invocations |
| Background cron for grace-period token expiry | No long-running process to run `node-cron` / `setInterval` |

**Final deployment split:**
- `patient-app` (Next.js) → **Vercel**
- `admin-app` (Next.js) → **Vercel**
- `api-server` (Express + Socket.IO + MongoDB + cron) → **Railway** or **Render** (persistent Node process, free tier available)
- Database → **MongoDB Atlas** (free M0 cluster is sufficient for this scale)

If you want everything on Vercel regardless, the fallback is polling instead of Socket.IO (30s interval) — not recommended, defeats the "live" requirement.

---

## 1. Project Overview

A three-part system for weekly hospital OPD registration and geofenced queue management, used entirely on smartphones by both patients and hospital staff.

**Repos (3 separate projects, not a monorepo — matches "two separate apps" decision):**
1. `hospital-patient-app` — Next.js, public-facing
2. `hospital-admin-app` — Next.js, staff-facing, mobile-only design
3. `hospital-api-server` — Express + Socket.IO + MongoDB, shared backend for both

---

## 2. Architecture

```text
                     ┌─────────────────────┐
                     │   MongoDB Atlas      │
                     │  (registrations,     │
                     │   tokens, counters)  │
                     └──────────▲───────────┘
                                │
                     ┌──────────┴───────────┐
                     │   api-server          │
                     │  Express + Socket.IO  │
                     │  + node-cron          │
                     │  (Railway / Render)   │
                     └────▲─────────────▲────┘
                REST+WS   │             │  REST+WS
              ┌───────────┘             └───────────┐
   ┌──────────┴─────────┐            ┌───────────────┴──────┐
   │  patient-app         │            │  admin-app             │
   │  Next.js (Vercel)    │            │  Next.js (Vercel)      │
   │  - Register           │            │  - Live queue           │
   │  - Token display       │            │  - Call/Skip/Complete   │
   │  - Background geo ping │            │  - Search registrations │
   └────────────────────┘            └────────────────────────┘
```

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Patient frontend | Next.js 15 (App Router), Tailwind CSS |
| Admin frontend | Next.js 15 (App Router), Tailwind CSS |
| Backend | Node.js, Express |
| Real-time | Socket.IO |
| Database | MongoDB (Mongoose ODM) |
| Scheduled jobs | node-cron (grace-period expiry check) |
| Geolocation | Browser Geolocation API (`watchPosition`) |
| Frontend hosting | Vercel (both apps) |
| Backend hosting | Railway or Render |
| DB hosting | MongoDB Atlas |

---

## 4. Repository Structures

### `hospital-api-server/`
```text
src/
  config/
    db.js
    env.js
  models/
    Registration.js
    QueueToken.js
    Counter.js
  routes/
    registration.routes.js
    queue.routes.js
    admin.routes.js
  controllers/
    registration.controller.js
    queue.controller.js
    admin.controller.js
  services/
    geofence.service.js
    token.service.js
    registrationWindow.service.js
  sockets/
    index.js
    queueNamespace.js
  jobs/
    graceExpiryJob.js
  middleware/
    validateRegistrationWindow.js
    errorHandler.js
  utils/
    haversine.js
  app.js
  server.js
.env.example
package.json
```

### `hospital-patient-app/`
```text
app/
  page.tsx                    # landing / choose New or Old case
  register/new/page.tsx
  register/old/page.tsx
  token/page.tsx               # live token display + geolocation tracking
  not-registered/page.tsx
components/
  RegistrationForm.tsx
  TokenCard.tsx
  StatusBadge.tsx
lib/
  api.ts
  socket.ts
  geolocation.ts
```

### `hospital-admin-app/`
```text
app/
  page.tsx                    # live queue dashboard
  registrations/page.tsx        # search/manage registrations
  registrations/[id]/page.tsx
components/
  QueueBoard.tsx
  RegistrationCard.tsx
  ActionButtons.tsx            # Call Next / Skip / Complete
lib/
  api.ts
  socket.ts
```

---

## 5. Environment Variables

**`hospital-api-server/.env`**
```env
PORT=4000
MONGODB_URI=mongodb+srv://...
CORS_ORIGIN_PATIENT=https://patient.yourdomain.com
CORS_ORIGIN_ADMIN=https://admin.yourdomain.com
GEOFENCE_RADIUS_METERS=70
GRACE_PERIOD_MINUTES=3
ADMIN_JWT_SECRET=change_me
```

**`hospital-patient-app/.env.local`**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
```

**`hospital-admin-app/.env.local`**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
```

---

## 6. Database Schema (Mongoose)

### `Registration`
```js
{
  caseType: { type: String, enum: ['new', 'old'], required: true },
  // New case fields
  name: { type: String, required: function () { return this.caseType === 'new'; } },
  villageName: { type: String, required: function () { return this.caseType === 'new'; } },
  phoneNumber: { type: String, required: true, index: true }, // required for both, used as device identifier
  // Old case field
  caseNumber: { type: String, required: function () { return this.caseType === 'old'; } },

  registrationWindowId: { type: String, required: true }, // e.g. "2026-W31" to scope to a specific Sat–Sun window
  status: {
    type: String,
    enum: ['registered', 'arrived', 'in_queue', 'in_consultation', 'completed', 'cancelled'],
    default: 'registered'
  },
  createdAt: { type: Date, default: Date.now }
}
```
> Note: the brief lists Old Case as collecting only Case Number. Phone number is added as a required field regardless of case type so the patient's device/session can be identified on arrival without a login system. Flag this to the user if it conflicts with existing paper-record conventions.

### `QueueToken`
```js
{
  registrationId: { type: ObjectId, ref: 'Registration', required: true },
  tokenNumber: { type: Number, required: true },       // sequential, resets per registrationWindowId
  registrationWindowId: { type: String, required: true },
  status: {
    type: String,
    enum: ['active', 'grace_period', 'cancelled', 'called', 'in_consultation', 'completed', 'skipped'],
    default: 'active'
  },
  lastPingAt: { type: Date, default: Date.now },        // last geofence heartbeat
  geofenceExitAt: { type: Date, default: null },         // set when patient leaves 70m radius
  calledAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
}
```

### `Counter` (atomic token number generator, per window)
```js
{
  registrationWindowId: { type: String, required: true, unique: true },
  sequence: { type: Number, default: 0 }
}
```
Use `findOneAndUpdate` with `$inc` for atomic increments — never generate token numbers by counting documents (race condition risk under concurrent arrivals).

---

## 7. Registration Window Logic

- `registrationWindowId` format: derive from the current Saturday's date, e.g. `2026-08-01` (the Saturday that starts the window).
- Middleware `validateRegistrationWindow.js` checks current server time is between Sat 06:00 and Sun 06:00 **in the hospital's local timezone** (make timezone configurable — do not hardcode UTC).
- Outside the window: `POST /api/registrations` returns `403` with a clear message; the admin panel remains fully readable regardless of window state (per spec: "existing registrations remain available").

---

## 8. REST API Endpoints

### Patient-facing
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/registrations` | Create new registration (New or Old case). Blocked outside window. |
| GET | `/api/registrations/me?phoneNumber=` | Fetch a patient's own registration status |
| POST | `/api/queue/checkin` | Called when device enters 70m geofence → verifies registration, issues token |
| POST | `/api/queue/ping` | Heartbeat while inside/near geofence (every ~20–30s) — updates `lastPingAt`, resolves grace period |
| GET | `/api/queue/token/:tokenId` | Get current token + live position in queue |

### Admin-facing (require `ADMIN_JWT_SECRET`-signed session)
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/admin/login` | Staff login |
| GET | `/api/admin/registrations` | List/search all registrations (filter by window, case type, status) |
| PATCH | `/api/admin/registrations/:id` | Edit a registration |
| DELETE | `/api/admin/registrations/:id` | Delete (optional per spec) |
| GET | `/api/admin/queue/live` | Current live queue, ordered by tokenNumber |
| POST | `/api/admin/queue/:tokenId/call-next` | Mark token as called (also auto-selects next if no id given) |
| POST | `/api/admin/queue/:tokenId/skip` | Skip token, moves to end or marks skipped per your policy |
| POST | `/api/admin/queue/:tokenId/complete` | Mark consultation completed |

All admin mutation endpoints emit a corresponding Socket.IO event (Section 10) immediately after the DB write succeeds.

---

## 9. Geofencing & Grace Period Logic

**Arrival (`POST /api/queue/checkin`):**
1. Client sends `{ registrationId, lat, lng }`.
2. Server computes distance via Haversine formula (`utils/haversine.js`) from hospital's fixed coordinates (store in `env.js`).
3. If `distance <= GEOFENCE_RADIUS_METERS`:
   - If registration not found/invalid → return `404` → client shows "Not registered" screen.
   - Else create `QueueToken` (atomic counter increment), set `Registration.status = 'arrived'`, emit `queue:new-token` to admin namespace.
4. If outside radius → `409` with distance info (client can show "Move closer to hospital").

**Heartbeat (`POST /api/queue/ping`)** — client calls this every 20–30s while the token is active:
1. Compute distance again.
2. If inside radius: `lastPingAt = now`, `geofenceExitAt = null`, status stays `active`/`in_queue`.
3. If outside radius and `geofenceExitAt` is null: set `geofenceExitAt = now`, status → `grace_period`.
4. If outside radius and already in `grace_period`: leave as is (the cron job in Section 9b handles expiry, not this endpoint).
5. If a ping arrives from inside radius while status is `grace_period`: clear `geofenceExitAt`, revert status to `active` — patient "returned within grace period."

**Grace expiry job (`jobs/graceExpiryJob.js`, node-cron every 30s):**
```js
// pseudocode
const expired = await QueueToken.find({
  status: 'grace_period',
  geofenceExitAt: { $lte: new Date(Date.now() - GRACE_PERIOD_MINUTES * 60000) }
});
for (const token of expired) {
  token.status = 'cancelled';
  await token.save();
  io.to('admin').emit('queue:token-cancelled', { tokenId: token._id });
}
```
If a cancelled patient returns later, they call `/api/queue/checkin` again and receive a **new token at the end of the queue** — do not resurrect the old token number.

---

## 10. Socket.IO Events

Use two rooms/namespaces: `admin` and `patient:{registrationId}`.

**Server → Admin room:**
| Event | Payload | When |
|---|---|---|
| `queue:new-token` | `{ token, registration }` | New arrival checked in |
| `queue:updated` | `{ tokenId, status }` | Any status change (grace period entered, called, completed, skipped) |
| `queue:token-cancelled` | `{ tokenId }` | Grace period expired |
| `registration:created` | `{ registration }` | New registration submitted (optional live feed) |

**Server → Patient room:**
| Event | Payload | When |
|---|---|---|
| `token:issued` | `{ tokenNumber, queuePosition }` | On successful checkin |
| `token:position-update` | `{ queuePosition }` | Queue moves (someone ahead completed/skipped) |
| `token:called` | `{ tokenNumber }` | Admin calls this token — trigger vibration/sound in UI |
| `token:cancelled` | `{ reason }` | Grace period expired, or admin removed |

**Client → Server:**
| Event | Payload | Purpose |
|---|---|---|
| `join:admin` | — | Admin app subscribes to admin room on load |
| `join:patient` | `{ registrationId }` | Patient app subscribes to its own room after checkin |

---

## 11. Design System — Minimal, Functional (per brief)

The brief explicitly calls for minimal design. Given the real-world context — staff glancing at a phone screen in daylight, patients checking a token number at a glance — the design should prioritize **legibility and speed over decoration**. No gradients, no drop shadows stacked for depth, no more than one accent color per app.

**Signature element:** the token number is treated like a departure-board counter — large tabular-figure monospace digits — since that's the one number both patient and staff actually need to read fast, from a distance, possibly in sunlight.

### Color tokens
| Token | Hex | Use |
|---|---|---|
| `--bg` | `#FAFAFA` | App background |
| `--surface` | `#FFFFFF` | Cards |
| `--ink` | `#14181C` | Primary text |
| `--ink-muted` | `#5B6470` | Secondary text |
| `--border` | `#E4E7EB` | Dividers, card borders |
| `--accent` | `#0E7C7B` | Primary actions, active token, links |
| `--danger` | `#C0362C` | Skip, cancel, delete |
| `--success` | `#15803D` | Completed status |

### Typography
- UI text: **Inter** (system fallback: `-apple-system, Segoe UI, sans-serif`)
- Token numbers: **JetBrains Mono** (or system `ui-monospace`), `font-variant-numeric: tabular-nums`, weight 700, sized at minimum `48px` on the patient token screen and `32px` per row on the admin queue board.
- Scale: `12 / 14 / 16 / 20 / 28 / 48` px — no in-between sizes.

### Layout & components
- Single column, full-width cards on mobile — never assume more than ~390px width.
- Buttons: minimum `48px` tap height, full-width on primary actions (Call Next, Register).
- No modals for core queue actions (Call/Skip/Complete) — use inline confirmation states, since staff are moving quickly.
- Status shown via a colored left-border on cards, not full-color badges — keeps the interface calm at a glance across a long queue list.
- Motion: one micro-interaction only — the token number briefly pulses when `token:called` fires. No other animation.

---

## 12. Screens

### Patient App
1. **Landing** — "New Case" / "Old Case" buttons, nothing else.
2. **Register (New)** — Name, Village Name, Phone Number. Disabled with a countdown message if outside registration window.
3. **Register (Old)** — Case Number, Phone Number.
4. **Token screen** — large token number once issued; queue position; live-updating via socket; "Not registered" state if geofence check-in fails; background geolocation permission prompt with a plain-language explanation of why it's needed.
5. **Not Registered** — clear message, link back to registration if window is open.

### Admin App
1. **Login** — phone/PIN or simple credentials, staff-only.
2. **Live Queue (home)** — ordered list of active tokens, color-coded left border by status, "Call Next" as the dominant action.
3. **Registrations** — searchable list (by name, phone, case number), edit/delete actions.
4. **Registration Detail** — full record, manual status override if needed.

---

## 13. Security & Validation

- Rate-limit `POST /api/registrations` and `/api/queue/checkin` per phone number/IP to prevent spam tokens.
- Validate phone numbers server-side (format + required).
- Admin routes behind JWT middleware; short-lived tokens, refresh on activity.
- Sanitize all search queries (admin registration search) to prevent NoSQL injection — never pass raw query params into Mongoose `find()` without whitelisting fields.
- CORS locked to the two known frontend origins only.

---

## 14. Deployment Steps

1. **MongoDB Atlas** — create free M0 cluster, get connection string, whitelist Railway/Render's IP (or `0.0.0.0/0` for simplicity in MVP).
2. **api-server → Railway/Render** — connect repo, set env vars from Section 5, confirm `node-cron` job logs firing every 30s, confirm Socket.IO CORS allows both Vercel domains.
3. **patient-app → Vercel** — set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` to the deployed backend URL.
4. **admin-app → Vercel** — same env vars.
5. Confirm HTTPS everywhere (required for Geolocation API to work on mobile browsers).
6. Test the full loop end-to-end on two real phones before the first live Saturday window.

---

## 15. Build Order (for the coding agent)

Build and verify each phase before moving to the next:

1. **Phase 1 — Backend foundation:** Express app, MongoDB connection, `Registration` + `Counter` models, registration window middleware, `POST /api/registrations` with validation.
2. **Phase 2 — Patient registration UI:** Landing + New/Old case forms wired to Phase 1 API.
3. **Phase 3 — Queue & tokens:** `QueueToken` model, Haversine util, `/checkin` and `/ping` endpoints, atomic token counter.
4. **Phase 4 — Socket.IO:** admin/patient rooms, wire `queue:new-token`, `token:issued` events end-to-end.
5. **Phase 5 — Patient token screen:** live token display, geolocation `watchPosition` sending pings, socket subscription.
6. **Phase 6 — Admin live queue:** list + real-time updates via socket, Call Next / Skip / Complete actions wired to endpoints.
7. **Phase 7 — Grace period cron job:** implement and test with a short artificial grace period (e.g. 15s) before setting production value.
8. **Phase 8 — Admin registrations management:** search, edit, delete.
9. **Phase 9 — Design pass:** apply the token system from Section 11 consistently across both apps.
10. **Phase 10 — Deployment:** follow Section 14, test on real devices.

---

## 16. Definition of Done

- [ ] Registration only accepted Sat 06:00–Sun 06:00, correctly timezone-aware
- [ ] New and Old case forms both validated and stored correctly
- [ ] Token only issued within 70m of hospital coordinates
- [ ] Token disappears from admin queue if patient leaves radius past grace period
- [ ] Returning patient after cancellation gets a new token at the end of the queue, not the old one
- [ ] Admin queue updates in real time with no manual refresh
- [ ] Admin can call next, skip, and complete without page reload
- [ ] Both frontends usable one-handed on a phone, no horizontal scrolling
- [ ] All admin mutation endpoints require authentication
