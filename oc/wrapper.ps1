# wrapper.ps1 - Master wrapper to run all setup steps
param(
    [string]$StartStep = "01",
    [switch]$SkipValidation
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path $MyInvocation.MyCommand.Path -Parent

# Load secrets
$secretsFile = Join-Path $scriptDir "secrets.ps1"
if (Test-Path $secretsFile) {
    Write-Host "[i] Loading credentials..." -ForegroundColor DarkGray
    . $secretsFile
} else {
    Write-Host "[ERR] secrets.ps1 not found! Run setup.ps1 first." -ForegroundColor Red
    exit 1
}

# Validate
if (-not $SkipValidation) {
    $required = @("TS_AUTH_KEY", "VENICE_API_KEY", "OPENROUTER_API_KEY", "OPENCLAW_TOKEN", "WHATSAPP_NUMBER")
    foreach ($var in $required) {
        if (-not $env:$var) {
            Write-Error "Missing: $var"
            exit 1
        }
    }
}

# Create log directory
$logDir = Join-Path $scriptDir "logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }

# Run step function
function Run-Step($num, $file, $name) {
    Write-Host "`n=== $num: $name ===" -ForegroundColor Cyan
    $log = Join-Path $logDir "$num-$name.log"
    $start = Get-Date
    
    $output = & powershell -ExecutionPolicy Bypass -File (Join-Path $scriptDir $file) 2>&1
    $output | Tee-Object -FilePath $log
    
    $exit = $LASTEXITCODE
    $dur = (Get-Date) - $start
    
    if ($exit -ne 0) {
        Write-Host "[ERR] Failed after $($dur.ToString('mm\:ss'))" -ForegroundColor Red
        Write-Host "Log: $log" -ForegroundColor Gray
        return $false
    }
    Write-Host "[OK] Completed in $($dur.ToString('mm\:ss'))" -ForegroundColor Green
    return $true
}

# Steps
$steps = @(
    @{ Num = "01"; File = "01_create-wsl2_v1.ps1"; Name = "Create WSL" }
    @{ Num = "02"; File = "02_baseline_v1.ps1"; Name = "Baseline" }
    @{ Num = "03"; File = "03_ssh_tailscale_v1.ps1"; Name = "SSH/Tailscale" }
    @{ Num = "04"; File = "04_report_server_v1.ps1"; Name = "Report Server" }
    @{ Num = "05"; File = "05_openclaw_v1.ps1"; Name = "OpenClaw" }
)

# Check admin
$admin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

# Show plan
Write-Host "`nExecution Plan:" -ForegroundColor White
foreach ($s in $steps) {
    $marker = if ($s.Num -lt $StartStep) { "SKIP" } elseif ($s.Num -eq "01" -and -not $admin) { "NEEDS ADMIN" } else { "READY" }
    Write-Host "  $($s.Num). $($s.Name) [$marker]" -ForegroundColor $(if($marker -eq "READY"){"Green"}elseif($marker -eq "SKIP"){"Gray"}else{"Yellow"})
}

# Confirm
$go = Read-Host "`nStart from $StartStep? (Y/n)"
if ($go -eq 'n') { exit 0 }

# Run
foreach ($s in ($steps | Where-Object { $_.Num -ge $StartStep })) {
    if ($s.Num -eq "01" -and -not $admin) {
        Write-Host "Step 1 requires Administrator. Restart PowerShell as admin." -ForegroundColor Red
        exit 1
    }
    if (-not (Run-Step $s.Num $s.File $s.Name)) {
        Write-Host "`nFAILED at step $($s.Num). Retry: wrapper.ps1 -StartStep $($s.Num)" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n=== ALL COMPLETE ===" -ForegroundColor Green
Write-Host "SSH: ssh support@oc-dev.fell-dojo.ts.net" -ForegroundColor Cyan
Write-Host "Web: https://oc-dev.fell-dojo.ts.net/report/" -ForegroundColor Cyan