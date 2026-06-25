<#
.SYNOPSIS
    Automated PostgreSQL Database Backup Script for Windows

.DESCRIPTION
    This script connects to the PostgreSQL database defined in the backend .env file,
    creates a custom format (.backup) backup using pg_dump, stores it in the
    backups folder, and automatically deletes backups older than a specified
    retention period.
#>

$ErrorActionPreference = "Stop"

# Configuration
$RetentionDays = 14
$ProjectRoot = (Get-Item $PSScriptRoot).Parent.FullName
$BackupDir = Join-Path $ProjectRoot "backups"
$LogDir = Join-Path $ProjectRoot "logs"
$EnvPath = Join-Path $ProjectRoot "backend\.env"

# Ensure directories exist
if (-not (Test-Path $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir | Out-Null }
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }

$LogFile = Join-Path $LogDir "backup.log"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    $LogMessage = "[$Timestamp] [$Level] $Message"
    Write-Host $LogMessage
    Add-Content -Path $LogFile -Value $LogMessage
}

try {
    Write-Log "----------------------------------------"
    Write-Log "Backup process started"

    # 1. Check if pg_dump is available
    if (-not (Get-Command "pg_dump" -ErrorAction SilentlyContinue)) {
        throw "pg_dump is not installed or not in the system PATH. Please install PostgreSQL tools."
    }

    # 2. Read .env file
    if (-not (Test-Path $EnvPath)) {
        throw "Environment file not found at: $EnvPath"
    }

    $DatabaseUrl = $null
    Get-Content $EnvPath | ForEach-Object {
        if ($_ -match "^DATABASE_URL\s*=\s*['`"]?(.*?)['`"]?\s*$") {
            $DatabaseUrl = $matches[1]
        }
    }

    if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
        throw "DATABASE_URL not found in $EnvPath"
    }

    # Masking function for safe logging
    function Mask-DbUrl {
        param([string]$Url)
        if ([string]::IsNullOrWhiteSpace($Url)) { return "" }
        return $Url -replace "(?<=://[^:]+:)[^@]+(?=@)", "****"
    }

    $OriginalMasked = Mask-DbUrl $DatabaseUrl
    Write-Log "Original Database URL: $OriginalMasked"

    # Sanitize URL by removing pg_dump unsupported parameters like connection_limit
    $SanitizedUrl = $DatabaseUrl -replace "connection_limit=[^&]*", ""
    $SanitizedUrl = $SanitizedUrl -replace "&&", "&"
    $SanitizedUrl = $SanitizedUrl -replace "\?&", "?"
    $SanitizedUrl = $SanitizedUrl -replace "&$", ""
    $SanitizedUrl = $SanitizedUrl -replace "\?$", ""

    $SanitizedMasked = Mask-DbUrl $SanitizedUrl
    Write-Log "Sanitized Database URL: $SanitizedMasked"

    # 3. Version Compatibility Check
    Write-Log "Checking version compatibility..."
    $PgDumpOutput = & pg_dump --version 2>&1 | Out-String
    $PgDumpMajor = 0
    if ($PgDumpOutput -match "(\d+)\.\d+") {
        $PgDumpMajor = [int]$matches[1]
    }

    if (-not (Get-Command "psql" -ErrorAction SilentlyContinue)) {
        throw "psql is not installed or not in the system PATH. Required for version check."
    }

    $PsqlOutput = & psql -d "$SanitizedUrl" -c "SHOW server_version;" -t -A 2>&1 | Out-String
    $ServerMajor = 0
    if ($PsqlOutput -match "(?i)(?:^|\s)(\d+)\.\d+") {
        $ServerMajor = [int]$matches[1]
    }

    if ($PgDumpMajor -gt 0 -or $ServerMajor -gt 0) {
        Write-Log "Installed pg_dump version: $PgDumpMajor.x"
        Write-Log "PostgreSQL server version: $ServerMajor.x"
    }

    if ($PgDumpMajor -gt 0 -and $ServerMajor -gt 0) {
        if ($PgDumpMajor -lt $ServerMajor) {
            throw "Installed pg_dump version ($PgDumpMajor.x) is older than the PostgreSQL server ($ServerMajor.x). Install PostgreSQL Client Tools $ServerMajor or newer."
        }
    } else {
        Write-Log "Warning: Could not reliably detect major versions. Proceeding with backup..."
    }

    # 4. Generate backup filename
    $Timestamp = (Get-Date).ToString("yyyy-MM-dd-HH-mm")
    $BackupFilename = "backup-$Timestamp.backup"
    $BackupPath = Join-Path $BackupDir $BackupFilename

    # 4. Run pg_dump
    Write-Log "Starting pg_dump..."
    # Notice: we don't log the URL as it contains passwords
    $process = Start-Process -FilePath "pg_dump" -ArgumentList "-d `"$SanitizedUrl`"", "-Fc", "-f `"$BackupPath`"" -Wait -NoNewWindow -PassThru

    if ($process.ExitCode -ne 0) {
        throw "pg_dump failed with exit code $($process.ExitCode). Ensure your database is accessible and pg_dump version matches."
    }

    # 5. Validate Backup
    if (-not (Test-Path $BackupPath)) {
        throw "Backup file was not created at $BackupPath"
    }

    $File = Get-Item $BackupPath
    $SizeKB = [math]::Round($File.Length / 1KB, 2)
    
    if ($File.Length -eq 0) {
        throw "Backup file is empty (0 bytes). Backup failed."
    }

    Write-Log "Backup completed successfully: $BackupFilename (Size: $SizeKB KB)"

    # 6. Retention Policy Cleanup
    Write-Log "Enforcing retention policy: Keeping backups for last $RetentionDays days..."
    $OldBackups = Get-ChildItem -Path $BackupDir -Filter "*.backup" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$RetentionDays) }
    
    $DeletedCount = 0
    foreach ($oldFile in $OldBackups) {
        Remove-Item $oldFile.FullName -Force
        Write-Log "Deleted old backup: $($oldFile.Name)"
        $DeletedCount++
    }
    Write-Log "Retention cleanup finished. Deleted $DeletedCount old backup(s)."
    Write-Log "Backup process finished successfully."
    Write-Log "----------------------------------------"

    exit 0

} catch {
    Write-Log "BACKUP FAILED: $_" "ERROR"
    Write-Log "----------------------------------------"
    exit 1
}
