# Nati Nest QR Canteen - Backup & Recovery Guide

This guide provides procedures for backing up database data, recovering from system failures, and restoring the system to a healthy state.

---

## 1. Database Backup Process

We recommend automated daily logical backups of your PostgreSQL database using `pg_dump`.

### Automated Daily Backups
The database administrator should schedule a daily cron job to dump the database schema and data:

```bash
# Dump command (logical backup)
pg_dump "$DATABASE_URL" | gzip > /backups/nati_nest_$(date +%F).sql.gz
```

### Backup Storage Best Practices
1.  **Offsite Replication**: Upload backups to secure, private cloud object storage (e.g. AWS S3, Google Cloud Storage) using lifecycle policies.
2.  **Retention Policy**:
    *   Daily backups: Keep for 14 days.
    *   Weekly backups: Keep for 8 weeks.
    *   Monthly backups: Keep for 12 months.
3.  **Access Security**: Restrict access to database dumps to server administrators only.

---

## 2. Database Restore Process

In the event of database corruption or hardware failure, follow this restoration procedure:

### Prerequisites
*   A clean, running PostgreSQL database instance.
*   Access to the `.sql.gz` backup file.

### Recovery Command Steps
1.  Uncompress the database backup:
    ```bash
    gunzip -c nati_nest_2026-06-14.sql.gz > restore.sql
    ```
2.  Restore the data using the `psql` utility:
    ```bash
    psql "$DATABASE_URL" -f restore.sql
    ```
3.  Deploy and sync database migrations using Prisma:
    ```bash
    npx prisma migrate deploy
    ```
4.  Verify connection by loading the system dashboards.

---

## 3. Disaster Recovery & Export Recovery

### System Outage Recovery Checklist
*   [ ] **Server Crash**: Restart backend and frontend Docker containers (`docker-compose restart`).
*   [ ] **Database Connection Failure**: Check Neon/PostgreSQL cloud service status. Verify that backend environment variables match connection credentials.
*   [ ] **Socket.IO Disconnections**: If kitchen or waiter boards lose live updates, check if Nginx proxy is forwarding WebSocket headers correctly.

### Export Document Recovery
If the server crashes while generating reports or exports:
*   Reports and CSV/Excel exports do not write permanent files to server disks. They are generated dynamically from the PostgreSQL database records and piped directly to the client browser response.
*   If a download fails midway, simply refresh the admin reports page and click the export button again. No files are locked or corrupted on the server.
