# Developer Guide

## Source of Truth

- Backend API behavior: `backend/src/routes`, `backend/src/controllers`, `backend/src/services`.
- Validation: `backend/src/validators`.
- Data model: `backend/prisma/schema.prisma`.
- Frontend routes: `frontend/src/app`.
- Frontend API calls: `frontend/src/services` and `frontend/src/lib/api-client.ts`.
- State: `frontend/src/stores`.

## Backend Development

```bash
cd backend
npm ci
npx prisma generate
npm run typecheck
npm run test
npm run dev
```

Use Zod validators for all request payloads. Keep controller logic thin and put business behavior in services.

## Frontend Development

```bash
cd frontend
npm ci
npm run typecheck
npm run test
npm run dev
```

Use existing shared UI components before creating new ones. Preserve App Router structure and role layouts.

## API Client Pattern

The frontend API client centralizes:

- Base URL.
- JSON settings.
- Credential handling.
- Staff/customer token selection.
- Staff token refresh on 401.

Do not bypass the shared client for normal API calls.

## Socket Pattern

Socket connections are managed by `SocketContext`. Backend Socket.IO authentication uses handshake auth. Add new events through shared event constants/helpers when possible and document them in [ARCHITECTURE.md](ARCHITECTURE.md).

## Database Changes

1. Edit `backend/prisma/schema.prisma`.
2. Create migration intentionally.
3. Regenerate Prisma client.
4. Update services/tests/docs.

```bash
cd backend
npx prisma migrate dev --name <change-name>
npx prisma generate
```

## Quality Gate

Before handoff:

```bash
cd backend
npm run typecheck
npm run build
npm run test

cd ../frontend
npm run typecheck
npm run build
npm run test
```

Run Playwright for journeys affected by customer, kitchen, server, or admin changes.

