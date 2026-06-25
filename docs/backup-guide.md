# Nati Nest Database Backup & Restore Guide

This document explains how the automated Windows PostgreSQL backup system works, how to configure it, and how to safely restore data.

## Prerequisites
- **PostgreSQL Tools**: Ensure that `pg_dump` and `pg_restore` are installed and available in your system's PATH. If not, install PostgreSQL on Windows and add `C:\Program Files\PostgreSQL\<version>\bin` to your Environment Variables.
- **Backend .env**: The script automatically reads the `DATABASE_URL` from `backend\.env`. Ensure it is correctly formatted.

## How Backups Work
The native PowerShell script (`scripts\backup.ps1`) performs the following:
1. Reads `DATABASE_URL` from the backend `.env` file to securely obtain credentials.
2. Runs `pg_dump` in custom compressed format (`-Fc`).
3. Saves a highly compressed backup named `backup-YYYY-MM-DD-HH-mm.backup` in the `backups/` directory.
4. Cleans up any `.backup` files older than 14 days (Retention Policy).
5. Logs all success/failure events to `logs/backup.log`.

---

## 1. Running a Manual Backup

To manually run a backup at any time:
1. Open PowerShell as Administrator.
2. Navigate to your project root.
3. Run the script:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
   .\scripts\backup.ps1
   ```
4. Check the `./backups` folder for the new file and `./logs/backup.log` to confirm success.

---

## 2. Automating with Windows Task Scheduler (Recommended)

To run the backup completely hands-free every day at 12:00 AM:

1. Open **Task Scheduler** in Windows.
2. Click **Create Basic Task...** in the right panel.
3. **Name**: `Nati Nest Database Backup`
4. **Trigger**: Select **Daily** -> Set time to `12:00:00 AM`.
5. **Action**: Select **Start a program**.
6. **Program/script**: Type `powershell.exe`
7. **Add arguments**: 
   ```text
   -WindowStyle Hidden -ExecutionPolicy Bypass -File "C:\Path\To\Your\Project\scripts\backup.ps1"
   ```
   *(Ensure you replace the path above with the absolute path to your script).*
8. **Finish**. Right-click the newly created task, select **Properties**, and check **Run whether user is logged on or not** and **Run with highest privileges**.

---

## 3. Changing Configuration

### Retention Period
By default, backups older than 14 days are deleted.
To change this, open `scripts\backup.ps1` and modify:
```powershell
$RetentionDays = 14
```

### Backup Location
By default, backups are saved to `./backups`.
To change this, modify:
```powershell
$BackupDir = Join-Path $ProjectRoot "backups"
```

---

## 4. Restore Instructions

> [!WARNING]  
> Restoring a database will completely overwrite existing tables and data. Ensure you understand the impact before proceeding.

### Method A: Using the Automated Restore Script (Recommended)

An automated restore script is available at `scripts/restore.ps1`. This script automatically:
1. Reads the target `DATABASE_URL` from `backend/.env`.
2. Validates the backup file.
3. Automatically applies Neon compatibility flags to prevent ownership and privilege errors.

To run it:
1. Open PowerShell as Administrator.
2. Run:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
   .\scripts\restore.ps1 -BackupFile ".\backups\backup-2026-06-25-10-30.backup"
   ```

---

### Method B: Manual Restore using CLI (`pg_restore`)

If you want to manually run the restore via command line, use the following `pg_restore` command to handle Neon PostgreSQL database ownership discrepancies:

```powershell
pg_restore -d "postgresql://postgres:password@localhost:5432/nati_nest" --clean --if-exists --no-owner --no-privileges ".\backups\backup-2026-06-25-10-30.backup"
```

**Flags Explained:**
- `--clean` (`-c`): Drops database objects (tables, views, etc.) before recreating them.
- `--if-exists`: Uses `IF EXISTS` clauses when dropping objects (avoids errors when restoring into a clean/empty database).
- `--no-owner` (`-O`): Bypasses restoration of object ownership (critical since roles like `neondb_owner` or `neon_superuser` do not exist locally).
- `--no-privileges` (`-x`): Prevents restoring access privileges/permissions set in Neon.

> [!NOTE]  
> It is highly recommended to perform a restore into a newly created empty database to ensure clean data mapping.

---

### Method C: Restore using pgAdmin

When using pgAdmin to restore a Neon backup file into a local database:

1. Right-click your target database -> **Restore...**
2. In the **General** tab:
   - **Filename**: Select the path to your `.backup` file.
3. In the **Restore options** tab:
   - **Type of objects**: Keep default.
   - **Do not save**: Check **Owner** (equivalent to `--no-owner`) and **Privilege** (equivalent to `--no-privileges`).
   - **Clean before restore**: Set to **Yes** (equivalent to `--clean`).
   - **Only data / Only schema**: Keep default.
4. In the **Queries** tab:
   - **Use DROP DATABASE / IF EXISTS**: Set **Include IF EXISTS** to **Yes** (equivalent to `--if-exists`).
5. Click **Restore**.

---

## 5. Configuring pgAdmin for PostgreSQL 18

If your local server uses PostgreSQL 18 and your backup is created using PostgreSQL 18 client tools, pgAdmin must use matching PostgreSQL 18 binaries to prevent version mismatch errors.

1. Open pgAdmin.
2. Go to **File** -> **Preferences**.
3. Expand **Paths** -> **Binary paths**.
4. Scroll down to **PostgreSQL Binary Path**.
5. Locate the row for **PostgreSQL 18** (or set it in **Override/Default Binary Path**):
   - Set the path to: `C:\Program Files\PostgreSQL\18\bin`
6. Click **Save**.
