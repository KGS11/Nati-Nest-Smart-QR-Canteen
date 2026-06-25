<#
.SYNOPSIS
    Automated PostgreSQL Database Restore Script for Windows
.DESCRIPTION
    This script reads the DATABASE_URL from the backend .env file,
    verifies pg_restore availability, and restores a specified custom format (.backup)
    file into the target database. It automatically handles compatibility issues
    by ignoring owners/privileges and cleanly dropping existing objects.
.PARAMETER BackupFile
    The path to the PostgreSQL custom format backup file (.backup) to restore.
.PARAMETER TargetDbUrl
    Optional. Override database URL to restore into. If omitted, uses backend .env.
.PARAMETER Force
    Optional. Bypasses the confirmation prompt.
#>

param(
    [Parameter(Mandatory = $true, HelpMessage = "Path to the .backup file to restore")]
    [string]$BackupFile,

    [Parameter(Mandatory = $false)]
    [string]$TargetDbUrl,

    [Parameter(Mandatory = $false)]
    [switch]$Force
)

$ErrorActionPreference = "Stop"

# Paths
$ProjectRoot = (Get-Item $PSScriptRoot).Parent.FullName
$LogDir = Join-Path $ProjectRoot "logs"
$EnvPath = Join-Path $ProjectRoot "backend\.env"
$LogFile = Join-Path $LogDir "restore.log"

if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    $LogMessage = "[$Timestamp] [$Level] $Message"
    Write-Host $LogMessage
    Add-Content -Path $LogFile -Value $LogMessage
}

try {
    Write-Log "----------------------------------------"
    Write-Log "Restore process started"

    # 1. Validate backup file existence
    $FullPathBackup = Resolve-Path $BackupFile -ErrorAction SilentlyContinue
    if ($null -eq $FullPathBackup -or -not (Test-Path $FullPathBackup.Path)) {
        throw "Specified backup file not found: $BackupFile"
    }
    $BackupPath = $FullPathBackup.Path
    Write-Log "Backup file verified: $BackupPath"

    # 2. Check if pg_restore is available
    if (-not (Get-Command "pg_restore" -ErrorAction SilentlyContinue)) {
        throw "pg_restore is not installed or not in the system PATH. Please install PostgreSQL Client Tools."
    }

    # 3. Determine database URL
    $DatabaseUrl = $TargetDbUrl
    if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
        if (-not (Test-Path $EnvPath)) {
            throw "Environment file not found at: $EnvPath"
        }
        Get-Content $EnvPath | ForEach-Object {
            if ($_ -match "^DATABASE_URL\s*=\s*['`"]?(.*?)['`"]?\s*$") {
                $DatabaseUrl = $matches[1]
            }
        }
    }

    if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
        throw "DATABASE_URL not found in environment or parameters."
    }

    # Masking function for safe logging
    function Mask-DbUrl {
        param([string]$Url)
        if ([string]::IsNullOrWhiteSpace($Url)) { return "" }
        return $Url -replace "(?<=://[^:]+:)[^@]+(?=@)", "****"
    }

    $MaskedUrl = Mask-DbUrl $DatabaseUrl
    Write-Log "Target Database URL: $MaskedUrl"

    # Sanitize URL parameters
    $SanitizedUrl = $DatabaseUrl -replace "connection_limit=[^&]*", ""
    $SanitizedUrl = $SanitizedUrl -replace "&&", "&"
    $SanitizedUrl = $SanitizedUrl -replace "\?&", "?"
    $SanitizedUrl = $SanitizedUrl -replace "&$", ""
    $SanitizedUrl = $SanitizedUrl -replace "\?$", ""

    # Check pg_restore version compatibility
    $PgRestoreOutput = & pg_restore --version 2>&1 | Out-String
    $PgRestoreMajor = 0
    if ($PgRestoreOutput -match "(\d+)\.\d+") {
        $PgRestoreMajor = [int]$matches[1]
    }
    Write-Log "Installed pg_restore version: $PgRestoreMajor.x"

    # 4. User confirmation
    if (-not $Force) {
        $Confirm = Read-Host "WARNING: Restoring will overwrite existing tables in the target database. Are you sure? (y/n)"
        if ($Confirm.ToLower() -ne 'y' -and $Confirm.ToLower() -ne 'yes') {
            Write-Log "Restore cancelled by user."
            exit 0
        }
    }

    # 5. Build pg_restore arguments
    # -d: target database URL
    # -c / --clean: drop database objects before recreating
    # --if-exists: use IF EXISTS during drops
    # -O / --no-owner: skip restoration of object ownership (critical for Neon -> Local compatibility)
    # -x / --no-privileges: skip restoration of access privileges (critical for Neon -> Local compatibility)
    Write-Log "Running pg_restore with Neon compatibility flags (--no-owner, --no-privileges, --clean, --if-exists)..."
    
    $Process = Start-Process -FilePath "pg_restore" -ArgumentList @(
        "-d", "`"$SanitizedUrl`"",
        "--clean",
        "--if-exists",
        "--no-owner",
        "--no-privileges",
        "`"$BackupPath`""
    ) -Wait -NoNewWindow -PassThru

    if ($Process.ExitCode -ne 0) {
        throw "pg_restore failed with exit code $($Process.ExitCode). Please check the console output for database-specific errors."
    }

    Write-Log "Restore completed successfully."
    Write-Log "----------------------------------------"
    exit 0

} catch {
    Write-Log "RESTORE FAILED: $_" "ERROR"
    Write-Log "----------------------------------------"
    exit 1
}
