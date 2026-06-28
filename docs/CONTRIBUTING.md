# Contributing

## Development Rules

- Use the source code as the source of truth.
- Keep backend route, controller, service, validator, and test changes aligned.
- Keep frontend services, stores, pages, and tests aligned with backend contracts.
- Do not introduce duplicate API clients, auth stores, or UI primitives when existing ones fit.
- Preserve role boundaries for admin, kitchen, server, and customer flows.

## Branching

Use focused branches with descriptive names. For Codex-generated branches, prefer the `codex/` prefix.

## Commit Quality

Each commit should be:

- Scoped to one logical change.
- Typechecked and tested where practical.
- Free of generated secrets, local `.env` values, and unrelated formatting churn.

## Pull Request Checklist

- Backend typecheck passes when backend changes are included.
- Backend tests pass when backend behavior changes.
- Frontend typecheck passes when frontend changes are included.
- Frontend tests pass when frontend behavior changes.
- Playwright journeys pass for customer/kitchen/server/admin workflow changes.
- Documentation is updated when API, env, deployment, or operations behavior changes.

## Code Style

- TypeScript strictness should be preserved.
- Prefer existing helpers and patterns.
- Use Zod for request validation.
- Use Prisma transactions for multi-write business operations.
- Keep user-facing errors sanitized and log details on the backend.

