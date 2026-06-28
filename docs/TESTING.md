# Testing

The repository has backend unit/API tests, frontend component/store tests, coverage reporting, and Playwright E2E setup.

## Backend

Location: `backend/`

```bash
npm run typecheck
npm run build
npm run test
npm run test:coverage
```

Configuration:

- Test runner: Vitest
- Environment: Node
- Setup: `backend/tests/setup.ts`
- Coverage provider: V8
- Coverage outputs: text, JSON, HTML under `backend/coverage`

Representative areas covered by the current test suite include auth, orders, payments, sessions, kitchen, server, reports, rate limiting, uploads, and security helpers.

## Frontend

Location: `frontend/`

```bash
npm run typecheck
npm run build
npm run test
npm run test:coverage
```

Configuration:

- Test runner: Vitest
- Environment: jsdom
- React Testing Library
- Setup: `frontend/tests/setup.ts`
- Coverage provider: V8
- Coverage outputs: text, JSON, HTML under `frontend/coverage`

## E2E

Location: `frontend/e2e/`

```bash
cd frontend
npm run test:e2e
```

Playwright defaults to starting the frontend dev server if `E2E_BASE_URL` is absent. To run against an existing deployment, set:

```text
E2E_BASE_URL=http://localhost
E2E_TABLE_ID=<seeded-table-id-or-qr-id>
E2E_ADMIN_PHONE=9999999999
E2E_ADMIN_PASSWORD=Admin@123
```

## CI

GitHub Actions runs:

- Backend install, Prisma generate, typecheck, build, tests, coverage.
- Frontend install, typecheck, build, tests, coverage.
- Playwright Chromium install and E2E execution.

## Coverage Policy

Coverage reports are generated but the source configuration does not enforce a numeric threshold. Treat coverage drops in business-critical flows as release blockers even when CI passes.

