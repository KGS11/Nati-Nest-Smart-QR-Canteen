# Architecture

Nati Nest is a monorepo with a TypeScript Express backend and a TypeScript Next.js frontend.

## Runtime Overview

```text
Next.js App Router frontend
  - Staff dashboards
  - Customer QR journey
  - Zustand stores
  - Axios API client
  - Socket.IO client

Express backend
  - REST routes
  - Zod request validation
  - Prisma services
  - Socket.IO rooms and events
  - JWT and session middleware

PostgreSQL
  - Prisma-managed schema
  - Orders, sessions, staff, menu, payments, feedback, reports
```

## Backend Structure

```text
backend/src/index.ts              App bootstrap, middleware, route mounts, Socket.IO
backend/src/routes/               Express route definitions
backend/src/controllers/          HTTP request handlers
backend/src/services/             Business logic and Prisma operations
backend/src/validators/           Zod schemas
backend/src/middlewares/          Auth, rate limiting, errors, uploads, logging
backend/src/sockets/              Socket.IO authentication and event helpers
backend/prisma/schema.prisma      Database model
backend/prisma/migrations/        Schema migrations
```

## Frontend Structure

```text
frontend/src/app/                 Next.js App Router pages and layouts
frontend/src/components/          Shared UI and feature components
frontend/src/services/            API service modules
frontend/src/stores/              Zustand state stores
frontend/src/context/             Socket provider and app providers
frontend/src/lib/                 API client and utility helpers
frontend/e2e/                     Playwright journeys
frontend/tests/                   Vitest setup
```

## Role-Based Flows

| Role | Frontend Entry | Main Backend APIs |
| --- | --- | --- |
| Customer | `/scan/[tableId]`, `/customer/menu`, `/customer/track`, `/customer/bill`, `/customer/feedback` | `/api/customer`, `/api/customer/orders`, `/api/payments`, `/api/feedback`, `/api/catering` |
| Kitchen | `/kitchen` | `/api/kitchen`, Socket.IO `kitchen` room |
| Server | `/server` | `/api/server`, `/api/payments`, Socket.IO `server` and `waiter:{id}` rooms |
| Admin | `/admin` and child routes | `/api/categories`, `/api/menu`, `/api/tables`, `/api/staff`, `/api/reports`, `/api/settings`, `/api/admin`, `/api/daily-menu`, `/api/catering` |

## Authentication Model

- Staff authenticate through `/api/auth/login` using phone and password.
- Staff access tokens are JWTs with role-based middleware checks.
- Refresh tokens are persisted and revoked through `RefreshToken`.
- Customers receive a session token through QR scan flow and are authorized by active `TableSession`.
- Socket.IO authenticates using the same staff or customer token model during the handshake.

## Real-Time Model

Socket rooms:

- `kitchen`
- `server`
- `session:{sessionId}`
- `table:{tableId}`
- `waiter:{waiterId}`

Representative events:

- `order:new`
- `order:accepted`
- `order:preparing`
- `order:ready`
- `order:delivered`
- `order:cancelled`
- `payment:bill_requested`
- `payment:confirmed`
- `assistance:new`
- `assistance:resolved`
- `daily-menu:item-added`
- `daily-menu:item-removed`
- `feedback:new`
- `lead:new`

## Request Lifecycle

1. Nginx receives browser traffic.
2. Frontend serves pages or calls `/api`.
3. Express applies security middleware, request logging, body limits, and rate limiting.
4. Auth middleware validates staff JWT or customer session JWT when required.
5. Zod validates route input.
6. Controller calls service logic.
7. Service performs Prisma operations, often inside transactions for order and payment flows.
8. Backend emits Socket.IO events for live dashboards.
9. Error middleware returns sanitized client responses and logs detailed backend errors.

