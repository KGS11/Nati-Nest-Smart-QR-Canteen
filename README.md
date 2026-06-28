# Nati Nest Smart QR Canteen Management System

Nati Nest is a full-stack QR canteen management system for sports club canteens and restaurant-style operations. Customers scan a table QR code, browse the live menu, place orders, request assistance, pay, and submit feedback. Kitchen, server, and admin staff operate from role-specific dashboards with real-time Socket.IO updates.

## Current Source-Verified Stack

| Layer | Implementation |
| --- | --- |
| Frontend | Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Zustand, Axios, Socket.IO Client |
| Backend | Node.js, Express 5, TypeScript, Prisma ORM, PostgreSQL, Socket.IO, Zod |
| Security | JWT staff auth, customer session JWT, refresh tokens, token revocation, Helmet, rate limiting, upload validation, CORS, CSP headers |
| Testing | Vitest, Supertest, React Testing Library, Playwright |
| Deployment | Docker, Docker Compose, Nginx reverse proxy, GitHub Actions CI/deploy workflows |

## Main Capabilities

- Customer QR session creation, menu browsing, cart, order placement, bill request, payment status, feedback, and catering enquiry.
- Kitchen order board with accept, prepare, ready, release, item rejection, and real-time order updates.
- Server dashboard for ready orders, assistance requests, payment verification, table assignments, and delivery.
- Admin dashboard for menu, categories, tables, staff, reports, settings, catering leads, daily menu, and assignment controls.
- PostgreSQL-backed audit-friendly data model with Prisma migrations and seed data.
- Dockerized production runtime with health checks and Nginx proxying.

## Repository Layout

```text
backend/      Express API, Prisma schema, Socket.IO, tests
frontend/     Next.js application, stores, services, components, tests, E2E
docs/         Technical, operations, security, and handover documentation
nginx/        Reverse proxy configuration
scripts/      Backup and restore scripts
.github/      CI and deployment workflows
```

## Quick Start

1. Copy `.env.example` to `.env` and fill real secrets.
2. Start Docker Desktop.
3. Run:

```bash
docker compose build --no-cache
docker compose up -d
docker compose ps
```

4. Apply migrations and seed the database from the backend environment when required:

```bash
cd backend
npm ci
npx prisma migrate deploy
npx prisma db seed
```

Default seed accounts are documented in [docs/admin-credentials.md](docs/admin-credentials.md).

## Essential Documentation

- [Installation](docs/INSTALLATION.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Environment](docs/ENVIRONMENT.md)
- [API Reference](docs/API_REFERENCE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database](docs/DATABASE.md)
- [Security](docs/SECURITY.md)
- [Operations](docs/OPERATIONS.md)
- [Testing](docs/TESTING.md)
- [Developer Guide](docs/DEVELOPER_GUIDE.md)
- [Release Process](docs/RELEASE_PROCESS.md)
- [Handover Checklist](docs/HANDOVER_CHECKLIST.md)

## Verification Commands

Backend:

```bash
cd backend
npm run typecheck
npm run build
npm run test
npm run test:coverage
```

Frontend:

```bash
cd frontend
npm run typecheck
npm run build
npm run test
npm run test:coverage
npm run test:e2e
```

Docker:

```bash
docker compose build --no-cache
docker compose up -d
docker compose ps
```

## Production Notes

- Use strong, unique `JWT_SECRET` and `SESSION_JWT_SECRET` values of at least 64 characters.
- Use PostgreSQL URLs with SSL in production where required by the environment validator.
- Keep `.env` files out of Git.
- Configure Cloudinary for durable menu image hosting, or understand that local uploads live inside the backend upload volume.
- Run backup and restore drills before owner handover.

