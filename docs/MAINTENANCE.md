# Maintenance

## Daily

- Check `docker compose ps`.
- Check `/health`.
- Confirm backup completed.
- Review error logs.
- Confirm payment and order workflows are operating.

## Weekly

- Review admin reports.
- Review inactive/unneeded staff accounts.
- Export revenue/order data if required by owner.
- Test one QR ordering flow end to end.
- Check disk usage for uploads, logs, and backups.

## Monthly

- Run restore drill.
- Rotate admin password if operational policy requires.
- Review dependency audit output.
- Review database size and slow query logs.
- Confirm Cloudinary or upload backups.
- Review Nginx and TLS certificate status.

## Before Menu Changes

- Update categories/items in admin.
- Confirm images load.
- Confirm availability.
- Place a test order with changed items.

## Before Staff Changes

- Create or deactivate staff from admin.
- Confirm role-specific dashboard access.
- Revoke tokens by logout-all when removing access.

## Before Production Updates

- Read [RELEASE_PROCESS.md](RELEASE_PROCESS.md).
- Run all verification commands.
- Take a fresh backup.
- Apply migrations.
- Verify health and owner workflows.

