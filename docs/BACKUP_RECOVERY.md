# Backup and Recovery

Backups protect the database, uploaded assets, and operational configuration.

## What to Back Up

- PostgreSQL database.
- Backend uploads volume if Cloudinary is not used.
- Production `.env` values stored securely outside Git.
- Nginx and deployment configuration.

## Scripts

The repository includes:

- `scripts/backup.ps1`
- `scripts/restore.ps1`

Use these as the starting point for Windows-hosted deployments. Managed cloud deployments may use provider-native backups instead.

## Manual Database Backup

Example with `pg_dump`:

```bash
pg_dump "$DATABASE_URL" --format=custom --file=nati_nest_backup.dump
```

## Manual Restore

Restore only after confirming the target database is correct:

```bash
pg_restore --clean --if-exists --dbname="$DATABASE_URL" nati_nest_backup.dump
```

## Restore Drill

At least monthly:

1. Restore the latest backup into a non-production database.
2. Point a staging backend at the restored database.
3. Verify admin login, menu, orders, payments, and reports.
4. Record restore time and any errors.

## Retention Recommendation

- Daily backups for 7 days.
- Weekly backups for 4 weeks.
- Monthly backups for 6 months when storage allows.

Adjust to owner/legal requirements.

