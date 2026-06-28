# Release Process

## Pre-Release Checklist

1. Confirm all changes are committed on a release branch.
2. Run backend checks:

```bash
cd backend
npm run typecheck
npm run build
npm run test
npm run test:coverage
```

3. Run frontend checks:

```bash
cd frontend
npm run typecheck
npm run build
npm run test
npm run test:coverage
npm run test:e2e
```

4. Run security checks:

```bash
cd backend
npm audit

cd ../frontend
npm audit
```

5. Build Docker:

```bash
docker compose build --no-cache
```

## Release

1. Merge to `main` after CI passes.
2. Confirm GitHub Actions CI success.
3. Confirm deployment workflow builds images.
4. Apply database migrations in production:

```bash
docker compose exec backend npx prisma migrate deploy
```

5. Restart services if needed:

```bash
docker compose up -d --remove-orphans
```

## Post-Release Verification

- `docker compose ps` shows healthy services.
- `/ready` returns ready.
- `/health` returns database connected.
- Staff login works.
- Customer scan works.
- Customer order appears in kitchen.
- Kitchen to server to payment journey works.
- Admin reports load.

## Rollback

1. Restore previous container image tags.
2. Restore database backup only if the release included destructive data changes.
3. Re-run health checks.
4. Document incident and owner impact.

