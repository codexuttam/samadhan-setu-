# Samadhan Setu (समाधान सेतु)

[![CI](https://github.com/codexuttam/samadhan-setu-/actions/workflows/ci.yml/badge.svg)](https://github.com/codexuttam/samadhan-setu-/actions/workflows/ci.yml)

**Samadhan Setu** is a civic grievance redressal, SLA enforcement, and multi-channel municipal operations platform built with React, TypeScript, Express, Prisma, and PostgreSQL. It enables citizens to report, track, and verify local civic issues across Web, PWA, and WhatsApp while giving field officers and administrators deterministic workflows, hierarchical RBAC, AI-assisted triage, and automated multi-level SLA escalations.

---

## Key Features

### Citizen Experience
- **Bilingual Interface (English & Hindi):** Language selection on arrival (`LanguagePreferenceModal`), localized workflow showcases, and bilingual AI assistance.
- **Voice & Location-Aware Filing:** Voice-to-text grievance transcription (`/api/transcribe`), GIS map pinning with Leaflet, and **nearby duplicate issue discovery** (`/api/public/nearby` within 500m).
- **Printable Official Receipt & Live Tracking:** Reference ID tracking (`SS-YYYY-NNNNNN` via `/api/public/track/ref/:reference`), OTP-secured deep links (`/api/public/track/secure/:token`), and downloadable/printable grievance receipts with QR verification.
- **72-Hour Verification & Dispute Loop:** Citizens confirm completed repairs or reopen grievances; uncontested work auto-resolves after 72 hours via background workers.
- **PWA Support:** Web manifest and service worker (`public/sw.js`) for offline shell caching and connectivity banners.

### AI Civic Concierge & Automation (Google Gemini)
- **Samadhan Sahayak (`/api/ai/chat`):** Bilingual conversational concierge that identifies the responsible civic body (MCD, PWD, DJB, BSES, etc.) and pre-fills grievance forms.
- **Multilingual Hazard Triage (`/api/ai/triage`):** Detects critical safety hazards (open manholes, live/sparking wires, gas leaks) across English, Hindi, and Hinglish.
- **Visual Resolution Audit (`/api/ai/verify-resolution`):** Authenticated endpoint that loads `CITIZEN_EVIDENCE` and `COMPLETION_PROOF` images for Gemini Vision verification, with an explicit manual-review fallback when keys or images are absent.

### Two-Way WhatsApp Cloud Integration
- **Inbound Grievance Bot (`/api/whatsapp/webhook`):** Citizens can send text descriptions, photos, or location pins directly on WhatsApp to register complaints and receive tracking references.
- **1-Tap Quick-Reply Verification & Status Queries:** Supports interactive `RESOLVE_*` / `REOPEN_*` quick replies and `SS-YYYY-NNNNNN` status lookups.
- **Targeted Civic Broadcasts:** Deduplicated ward/zone/department WhatsApp announcement engine (`/api/authority/broadcasts`).

### Authority Operations, Security & SLA Engine
- **Deterministic State Machine:** Enforces valid status transitions with optimistic concurrency (`version`) and mandatory completion evidence checks.
- **Hierarchical RBAC & Scope Isolation:** Enforces `WARD`, `ZONE`, `DEPARTMENT`, `DISTRICT`, and `SYSTEM` access boundaries in every query and mutation.
- **Hardened Authority Auth:** Argon2id password hashing, opaque server-side sessions (`__Host-ss_auth` in production), per-session `X-CSRF-Token` validation, account activation tokens, login lockouts, and TOTP 2FA (`POST /api/authority/mfa/setup`, `confirm`, `complete`).
- **Automated SLA & Escalation Workers:** Periodic checks for approaching SLA warnings (12h window), overdue SLA breach escalations (up to Level 4), 72h auto-resolutions, and notification outbox sweeps.
- **Real-Time Event Stream (`/api/events`):** Server-Sent Events (SSE) hub with 25s heartbeats emitting ticket, escalation, and WhatsApp intake updates.
- **Private Media & Audit Trail:** Magic-byte MIME sniffing (`file-type`), optional ClamAV malware scanning, rollback cleanup on failed uploads, short-lived signed URLs (`/api/files/:token`), and immutable `AuditLog` entries.

---

## Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, Leaflet & React-Leaflet, Lucide Icons, Motion, React Hot Toast |
| **Backend** | Node.js 22+, Express 4, TypeScript, Zod, Helmet, Express Rate Limit, Multer, Argon2, OTPLib |
| **Database & Queue** | PostgreSQL, Prisma 6, Redis + BullMQ (with in-process queue fallback for local dev) |
| **Storage & Security** | Local private disk or S3-compatible object storage (`@aws-sdk/client-s3`), ClamAV (`clamd`) |
| **AI & Messaging** | Google Gemini 2.5 Flash API, Meta WhatsApp Cloud API |

---

## Project Structure

```text
├── .github/workflows/ci.yml   # GitHub Actions CI (lint, tests, vite build)
├── prisma/
│   ├── schema.prisma          # PostgreSQL data model & enums
│   └── seed.ts                # Initial departments, wards, roles & SLA rules
├── public/                    # PWA manifest, service worker (sw.js), favicon
├── server/
│   ├── config.ts              # Zod-validated environment configuration
│   ├── lib/                   # Prisma client, crypto, errors, logger, settings, SSE hub
│   ├── modules/               # ai, audit, authority (auth + RBAC), broadcast, escalation,
│   │                          # files, notifications, otp, queue, tickets, tracking, whatsapp
│   ├── routes/                # public, authority, admin, whatsapp Express routers
│   └── tests/                 # Server unit & engine test suites
├── server.ts                  # Express entrypoint, Vite dev/static serving, health & shutdown
├── src/
│   ├── components/            # Navbar, Footer, InteractiveMap, CivicConciergeChat, etc.
│   ├── pages/                 # Home, RaiseComplaint, ComplaintDetails, Citizen/Officer/Admin portals
│   └── data/                  # Client types & local simulator seed data
└── package.json
```

---

## Getting Started

### Prerequisites
- **Node.js** 22+
- **PostgreSQL** (local Postgres or Supabase)
- **Redis** *(optional — uses an in-process queue in development if `REDIS_URL` is omitted)*
- **Google Gemini API Key** *(optional — falls back cleanly if omitted)*

### Installation & Database Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env   # or create .env using the reference below

# 3. Generate Prisma client, push schema, and seed initial data
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

### Environment Variables

All environment variables are validated at startup in `server/config.ts`:

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string (URL-encode special chars like `@` as `%40` in passwords) |
| `DIRECT_URL` | Prisma CLI | Direct PostgreSQL URL used by Prisma migrations/pushes |
| `NODE_ENV` | No | `development` (default), `test`, or `production` |
| `PORT` | No | Server port (default `3000`) |
| `APP_BASE_URL` | Prod | Public base URL (default `http://localhost:3000`) |
| `ALLOWED_ORIGINS` | Prod | Comma-separated CORS allowlist (default `http://localhost:3000`) |
| `TRUST_PROXY` | No | Reverse-proxy hop count for Express `trust proxy` (default `0`) |
| `REDIS_URL` | Recommended | Redis URL for BullMQ background workers |
| `SESSION_SECRET` | Prod (32+ chars) | Secret for sessions, CSRF HMACs, and signed file tokens |
| `LINK_SIGNING_SECRET` | Prod (32+ chars) | Signing secret for citizen tracking/verification tokens |
| `OTP_PEPPER` | Prod (32+ chars) | HMAC pepper for OTP challenges |
| `PHONE_HASH_KEY` | Prod (32+ chars) | Keyed hash secret for citizen phone lookup |
| `DATA_ENCRYPTION_KEY` | Prod (base64 32B) | AES-256-GCM key for encrypted contact phones & TOTP secrets |
| `GEMINI_API_KEY` | Optional | Google Gemini API key for transcription, chat, triage, and vision verification |
| `WHATSAPP_PROVIDER` | Prod (`meta`) | `console` (dev default) or `meta` |
| `WHATSAPP_META_TOKEN` | When `meta` | Meta WhatsApp Cloud API access token |
| `WHATSAPP_META_PHONE_NUMBER_ID` | When `meta` | Meta phone number ID |
| `WHATSAPP_META_APP_SECRET` | When `meta` | App secret for verifying `X-Hub-Signature-256` webhooks |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | When `meta` | Handshake verify token for `GET /api/whatsapp/webhook` |
| `STORAGE_DRIVER` | No | `local` (default) or `s3` |
| `STORAGE_LOCAL_DIR` | No | Local private upload path (default `./storage/private`) |
| `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | When `s3` | S3-compatible object storage configuration |
| `CLAMAV_HOST`, `CLAMAV_PORT` | Optional | ClamAV daemon host/port (default `3310`) for upload scanning |
| `ESCALATION_INTERVAL_SECONDS` | No | Escalation worker cadence (default `300`) |

---

## Running, Testing & Building

```bash
# Start full-stack dev server (Express API + Vite HMR on port 3000)
npm run dev

# TypeScript type-check
npm run lint

# Run all 4 server test suites (escalation, broadcast, WhatsApp webhook, core hardening)
npm test

# Build frontend production bundle into dist/
npm run build
```

---

## API Overview

| Group | Key Endpoints |
| --- | --- |
| **Public** | `GET /api/public/categories`, `GET /api/public/stats`, `GET /api/public/nearby`, `POST /api/public/otp/request`, `POST /api/public/otp/verify-create`, `POST /api/public/otp/verify-track`, `POST /api/public/complaints`, `GET /api/public/track/ref/:reference`, `GET /api/public/track/secure/:token`, `POST /api/public/verify/:token` |
| **Authority** | `POST /api/authority/login`, `POST /api/authority/mfa/complete`, `POST /api/authority/activate`, `POST /api/authority/logout`, `GET /api/authority/me`, `POST /api/authority/mfa/setup`, `POST /api/authority/mfa/confirm`, `GET /api/authority/dashboard`, `GET /api/authority/complaints`, `GET /api/authority/complaints/:id`, `POST /api/authority/complaints/:id/transition`, `GET /api/authority/escalations`, `POST /api/authority/complaints/:id/escalate`, `GET /api/authority/broadcasts/preview`, `POST /api/authority/broadcasts` |
| **Admin** | `GET /api/admin/users`, `POST /api/admin/users`, `PATCH /api/admin/users/:id/status`, `POST /api/admin/users/:id/resend-activation`, `GET /api/admin/org`, `GET /api/admin/rules`, `POST /api/admin/rules`, `DELETE /api/admin/rules/:id`, `GET /api/admin/settings`, `PATCH /api/admin/settings/:key`, `GET /api/admin/audit-logs` |
| **AI & Media** | `POST /api/transcribe`, `POST /api/ai/triage`, `POST /api/ai/chat`, `POST /api/ai/verify-resolution` *(auth)*, `GET /api/files/:token` |
| **WhatsApp** | `GET /api/whatsapp/webhook`, `POST /api/whatsapp/webhook` *(HMAC verified)* |
| **Realtime & Ops** | `GET /api/events` *(SSE)*, `GET /healthz`, `GET /readyz` |

---

## Production Notes

- Dev-only OTP bypasses (`DEMO_VERIFIED_TOKEN`), `/api/whatsapp/simulate`, `/api/dev/outbox`, and simulated offline ticket creation are automatically disabled when `NODE_ENV=production`.
- Production mode enforces distinct 32+ character secrets, `WHATSAPP_PROVIDER=meta`, Helmet CSP, `ALLOWED_ORIGINS` CORS filtering, and graceful `SIGTERM`/`SIGINT` draining of HTTP/SSE connections, BullMQ workers, and Prisma connections.
