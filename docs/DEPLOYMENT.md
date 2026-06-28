# Deployment

Nati Nest ships with Dockerfiles for backend and frontend, a Docker Compose stack, Nginx reverse proxy configuration, and GitHub Actions workflows.

## Deployment Architecture

```text
Client browser
  -> Nginx on port 80
    -> Frontend Next.js standalone server on 3000
    -> Backend Express API and Socket.IO server on 5000
      -> PostgreSQL database
      -> Cloudinary or backend uploads volume for images
```

## Required Production Inputs

- PostgreSQL connection string
- 64+ character `JWT_SECRET`
- 64+ character `SESSION_JWT_SECRET`
- Public app URL
- Public API URL
- Public Socket.IO URL
- Optional Cloudinary credentials
- Optional Sentry DSN

See [ENVIRONMENT.md](ENVIRONMENT.md).

## Docker Compose Deployment

1. Copy `.env.example` to `.env`.
2. Fill production-safe values.
3. Build and run:

```bash
docker compose build --no-cache
docker compose up -d
docker compose ps
```

4. Run migrations:

```bash
docker compose exec backend npx prisma migrate deploy
```

5. Seed only when creating a fresh environment:

```bash
docker compose exec backend npx prisma db seed
```

## Health Checks

| Service | Check |
| --- | --- |
| Backend | `GET /health` verifies process and database connectivity |
| Nginx | `GET /ready` proxies backend readiness |
| Frontend | `GET /` verifies the Next.js server responds |

## Nginx

The checked-in `nginx/nginx.conf` includes:

- API and auth rate limiting.
- WebSocket upgrade support for `/socket.io`.
- Static cache headers for Next assets.
- Security headers.
- Upload proxying.

TLS is not embedded in the local compose file. In production, terminate TLS at a managed load balancer or update Nginx with certificates and HTTPS redirects.

## CI/CD

`.github/workflows/ci.yml` runs backend and frontend install, typecheck, build, tests, coverage, and frontend Playwright tests.

`.github/workflows/deploy.yml` builds and pushes GitHub Container Registry images after CI success on `main`. Optional SSH deployment runs when these secrets are configured:

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `DEPLOY_PATH`

## Post-Deployment Checklist

- Confirm `docker compose ps` shows healthy services.
- Confirm `GET /health` returns database connected.
- Confirm login works for admin, kitchen, and server.
- Confirm a table QR creates a customer session.
- Confirm a customer order appears on the kitchen dashboard.
- Confirm bill request and payment verification close the customer journey.
- Confirm backups run and restore has been tested.

