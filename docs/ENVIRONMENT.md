# Environment

The root `.env.example` is the primary template for Docker Compose. Backend and frontend also include local templates.

## Root Docker Environment

Copy before running Docker Compose:

```bash
copy .env.example .env
```

Do not commit `.env`.

## Backend Variables

| Variable | Required | Default/Example | Notes |
| --- | --- | --- | --- |
| `NODE_ENV` | Yes | `production` | `development`, `test`, or `production` |
| `PORT` | No | `5000` | Backend port |
| `DATABASE_URL` | Yes outside test | PostgreSQL URL | Production validation requires valid PostgreSQL URL and may require `sslmode=require` |
| `JWT_SECRET` | Yes outside test | 64+ chars | Staff access token secret |
| `JWT_EXPIRES_IN` | No | `15m` | Must be 15 minutes or less outside test |
| `SESSION_JWT_SECRET` | Yes outside test | 64+ chars | Customer session token secret |
| `SESSION_JWT_EXPIRES_IN` | No | `12h` | Customer session token lifetime |
| `CLIENT_URL` | No | `http://localhost:3000` | CORS/frontend origin |
| `CORS_ORIGINS` | No | comma list | Optional additional origins |
| `BACKEND_URL` | No | `http://localhost:5000` | Used for generated backend URLs |
| `APP_TIMEZONE` | No | `Asia/Kolkata` | Reporting/date operations |
| `CLOUDINARY_CLOUD_NAME` | No | blank | Enables Cloudinary uploads when all Cloudinary vars exist |
| `CLOUDINARY_API_KEY` | No | blank | Cloudinary |
| `CLOUDINARY_API_SECRET` | No | blank | Cloudinary |
| `LOG_LEVEL` | No | `info` | Logger level |
| `LOG_SLOW_REQUEST_MS` | No | `1000` | Slow request logging threshold |
| `LOG_SLOW_QUERY_MS` | No | `500` | Slow query logging threshold |
| `SENTRY_DSN` | No | blank | Blank value is allowed |
| `AUTH_RATE_LIMIT_WINDOW_MS` | No | `900000` | Auth limiter window |
| `AUTH_RATE_LIMIT_MAX` | No | `10` | Auth limiter max requests |
| `API_RATE_LIMIT_WINDOW_MS` | No | `60000` | API limiter window |
| `API_RATE_LIMIT_MAX` | No | `200` | API limiter max requests |
| `SOCKET_RATE_LIMIT_WINDOW_MS` | No | `60000` | Socket limiter window |
| `SOCKET_RATE_LIMIT_MAX` | No | `30` | Socket limiter max attempts |

## Frontend Variables

| Variable | Required | Example | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost/api` | Public API base URL |
| `NEXT_PUBLIC_SOCKET_URL` | Yes | `http://localhost` | Public Socket.IO URL |
| `NEXT_PUBLIC_APP_URL` | Yes | `http://localhost` | Public app URL |
| `NEXT_PUBLIC_APP_NAME` | No | `Nati Nest` | Display name |
| `NEXT_PUBLIC_SENTRY_DSN` | No | blank | Browser error tracking DSN |

## E2E Variables

| Variable | Purpose |
| --- | --- |
| `E2E_BASE_URL` | Existing deployment URL for Playwright |
| `E2E_TABLE_ID` | Table/QR identifier for customer journey |
| `E2E_ADMIN_PHONE` | Admin login phone |
| `E2E_ADMIN_PASSWORD` | Admin login password |

## Validation Behavior

The backend validates environment values on startup. Invalid `DATABASE_URL`, short secrets, invalid Sentry URLs, or an overly long staff JWT expiry cause startup failure outside `NODE_ENV=test`.

