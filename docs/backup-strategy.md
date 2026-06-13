# Nati Nest Backup Strategy

## Database

- Run a daily PostgreSQL backup with `pg_dump` from the production database.
- Store backups outside the application host, preferably object storage with versioning enabled.
- Retain daily backups for 14 days, weekly backups for 8 weeks, and monthly backups for 12 months.
- Encrypt backup storage and restrict restore permissions to administrators only.

Example cron entry:

```cron
0 2 * * * pg_dump "$DATABASE_URL" | gzip > /backups/nati-nest-$(date +\%F).sql.gz
```

## Restore Drill

1. Provision a clean PostgreSQL database.
2. Restore the latest backup with `gunzip -c backup.sql.gz | psql "$RESTORE_DATABASE_URL"`.
3. Run `npx prisma migrate deploy`.
4. Smoke test login, menu loading, order placement, kitchen status updates, and payment verification.

## Media Assets

- Cloudinary-hosted menu images, logos, and UPI QR assets must be covered by the Cloudinary account backup/export policy.
- Keep source image assets in a restricted operations folder when possible.

## Monitoring

- Configure `SENTRY_DSN` or an equivalent error transport before launch.
- Review `/health` status and application logs after each deploy.
