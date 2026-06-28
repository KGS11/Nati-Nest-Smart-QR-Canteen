# Troubleshooting

## Service Health

```bash
docker compose ps
docker compose logs backend
docker compose logs frontend
docker compose logs nginx
```

Check:

- `GET /ready`
- `GET /health`

## Login Problems

| Issue | Likely Cause | Action |
| --- | --- | --- |
| Invalid credentials | Wrong phone/password | Verify user and reset password |
| Account inactive | Staff deactivated | Reactivate from admin or database recovery process |
| Server unavailable | Backend/database down | Check `/health` and backend logs |
| Too many attempts | Rate limit | Wait for retry window |

## Database Problems

If backend startup fails:

- Validate `DATABASE_URL`.
- Confirm database accepts network connections.
- Confirm SSL requirements.
- Confirm migrations are applied.

```bash
cd backend
npx prisma migrate deploy
```

## Socket Problems

Symptoms:

- Dashboard stuck on reconnecting.
- New orders do not appear.
- Payment/assistance updates are delayed.

Checks:

- Browser network tab for `/socket.io`.
- Nginx WebSocket proxy configuration.
- Staff/customer token validity.
- Backend Socket.IO logs.

## Image Upload Problems

Checks:

- File type and size.
- Cloudinary credentials.
- Backend uploads volume.
- `/uploads` proxy through Nginx.

## Docker Build Problems

The Dockerfiles pin `npm@11.6.2`. If dependency lockfiles are regenerated, use the same npm major version or update Dockerfiles and lockfiles together.

```bash
docker compose build --no-cache
```

## E2E Problems

Set required variables when running against an already running environment:

```text
E2E_BASE_URL=http://localhost
E2E_TABLE_ID=<table-id>
E2E_ADMIN_PHONE=9999999999
E2E_ADMIN_PASSWORD=Admin@123
```

