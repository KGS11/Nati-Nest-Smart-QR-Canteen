# Security Configuration

## JWT

- Staff access tokens use HS256, `iss=nati-nest-api`, and `aud=nati-nest-staff`.
- Customer session tokens use HS256, `iss=nati-nest-api`, and `aud=nati-nest-customer-session`.
- Verification hardcodes accepted algorithms, issuer, and audience.
- Access tokens expire in 15 minutes or less outside tests.
- Refresh tokens are opaque, stored as SHA-256 hashes, rotated on use, and revoked by token family on reuse detection.

## Cookies

Refresh tokens are also set in an HttpOnly cookie:

- `HttpOnly`
- `SameSite=Strict`
- `Secure` in production
- Path scoped to `/api/auth`

The frontend keeps access and refresh tokens in memory only; persisted auth state excludes token values.

## Passwords

Staff passwords require:

- At least 8 characters
- At least one uppercase letter
- At least one number
- At least one special character

Password hashes use bcrypt cost factor 12.

## CORS

CORS uses explicit origins from `CLIENT_URL`, development localhost defaults, and optional `CORS_ORIGINS`. Credentials are enabled because the refresh-token cookie is used.

Allowed methods:

`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`

Allowed headers:

`Content-Type`, `Authorization`, `X-Requested-With`

## Content Security Policy

Backend Helmet and Next.js headers restrict scripts, object sources, frame ancestors, image sources, and connection sources. Inline styles remain allowed because Tailwind/Next runtime styles require them in this deployment profile.

## Uploads

Image uploads are limited to JPEG, PNG, and WebP, with file-size limits at Multer level and magic-number validation before persistence. Local upload filenames are random UUIDs with validated extensions. Cloudinary URLs are accepted only from `https://res.cloudinary.com`.
