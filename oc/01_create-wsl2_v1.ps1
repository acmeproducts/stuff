# 01_create-wsl2_v1.ps1 - Create WSL2 with systemd
param([string]$DistroName = "oc-dev")
$ErrorActionPreference = "Stop"

Write-Host "=== Creating WSL2: $DistroName ===" -ForegroundColor Cyan

# Unregister if exists
$existing = wsl --list --quiet 2>$null | Where-Object { $_.Trim() -eq $DistroName }
if ($existing) {
    Write-Host "Unregistering existing $DistroName..."
    wsl --unregister $DistroName
}

# Install base Ubuntu
$baseTar = "$env:TEMP\ubuntu-2404-base.tar"
if (-not (Test-Path $baseTar)) {
    Write-Host "Installing Ubuntu-24.04..."
    wsl --install -d Ubuntu-24.04 --no-launch
    Start-Sleep -Seconds 30
    wsl --export Ubuntu-24.04 $baseTar
}

# Import
$dest = "$env:LOCALAPPDATA\WSL\$DistroName"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
wsl --import $DistroName $dest $baseTar --version 2

# Configure systemd
wsl -d $DistroName -u root -- bash -c "cat > /etc/wsl.conf << 'EOF'
[boot]
systemd=true
[network]
generateHosts=true
generateResolvConf=true
EOF"

# Restart
wsl --terminate $DistroName
Start-Sleep -Seconds 5
wsl -d $DistroName -u root -- echo "WSL started"
Start-Sleep -Seconds 10

# Verify
$status = wsl -d $DistroName -u root -- bash -c "systemctl is-system-running 2>/dev/null || echo 'degraded'"
Write-Host "systemd status: $status" -ForegroundColor Green
Write-Host "=== Step 1 Complete ===" -ForegroundColor Green