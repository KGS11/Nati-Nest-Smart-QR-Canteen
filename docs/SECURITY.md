# Security

This document describes the source-verified security controls in Nati Nest.

## Authentication

### Staff

- Staff login is handled by `/api/auth/login`.
- Staff users are stored in `User` with role `ADMIN`, `KITCHEN`, or `SERVER`.
- Passwords are hashed with bcrypt.
- Access tokens are JWTs.
- Refresh tokens are stored in `RefreshToken` and support rotation/revocation.
- `/api/auth/logout` revokes one refresh token.
- `/api/auth/logout-all` revokes all refresh tokens for the authenticated staff user.

### Customers

- Customers do not create accounts.
- A customer scans a table QR route and receives a session token tied to an active `TableSession`.
- Customer endpoints use `authenticateSession`.
- Customer sessions become invalid when the backend session is closed.

## Authorization

Role middleware protects staff routes:

- Admin: staff, tables, categories, menu management, reports, settings, assignment controls.
- Kitchen/Admin: kitchen order workflow and daily menu operations.
- Server/Admin: server order, assistance, and payment workflows.

## Socket.IO Security

Socket connections authenticate during handshake with either:

- Staff token and `type: "staff"`.
- Customer session token and `type: "customer"`.

The backend joins sockets only to authorized rooms:

- `kitchen`
- `server`
- `session:{sessionId}`
- `table:{tableId}`
- `waiter:{waiterId}`

Socket rate limiting is configurable through:

- `SOCKET_RATE_LIMIT_WINDOW_MS`
- `SOCKET_RATE_LIMIT_MAX`

## Request Security

Backend middleware includes:

- Helmet.
- CORS allow-list support.
- JSON and URL encoded body size limits.
- Request logging.
- Correlation/request logging support through the existing logger middleware.
- Sanitized error responses through centralized error middleware.
- API and auth rate limiting.

Nginx also applies reverse-proxy rate limits for auth and API paths.

## Rate Limiting

Backend environment variables:

| Variable | Purpose |
| --- | --- |
| `AUTH_RATE_LIMIT_WINDOW_MS` | Login/auth rate limit window |
| `AUTH_RATE_LIMIT_MAX` | Max auth requests per window |
| `API_RATE_LIMIT_WINDOW_MS` | General API rate limit window |
| `API_RATE_LIMIT_MAX` | Max API requests per window |
| `SOCKET_RATE_LIMIT_WINDOW_MS` | Socket rate limit window |
| `SOCKET_RATE_LIMIT_MAX` | Max socket attempts per window |

HTTP 429 responses should be treated as retryable after the returned or proxy-calculated retry window.

## Upload Security

Image upload handling is centralized through backend upload middleware. Production deployments should prefer Cloudinary configuration for durable image storage. Local uploads are served from `/uploads` with content-type protection and cache headers.

## Frontend Security Headers

The Next.js config defines security headers including:

- Content Security Policy.
- `X-Content-Type-Options`.
- `X-Frame-Options`.
- Referrer policy.
- Permissions policy.
- Cross-origin opener policy.

Nginx also applies baseline security headers at the proxy layer.

## Secrets

Never commit `.env` files. Required production secrets:

- `DATABASE_URL`
- `JWT_SECRET`
- `SESSION_JWT_SECRET`
- Cloudinary credentials when image uploads must be durable.
- Sentry DSN when error tracking is enabled.

`JWT_SECRET` and `SESSION_JWT_SECRET` must each be at least 64 characters outside the test environment.

## Known Operational Limitations

- In-memory rate limiting is suitable for a single backend instance. For multi-instance deployments, move rate limit state to Redis or another shared store.
- Local upload storage must be backed by a persistent volume and backed up, or replaced by Cloudinary.
- TLS must be configured at the production reverse proxy or load balancer.

