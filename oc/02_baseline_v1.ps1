# 02_baseline_v1.ps1 - Install baseline packages
param([string]$DistroName = "oc-dev")
$ErrorActionPreference = "Stop"

Write-Host "=== Installing baseline packages ===" -ForegroundColor Cyan

# Create directories
wsl -d $DistroName -u root -- bash -c "mkdir -p /home/support/.openclaw/{workspace,logs}"
wsl -d $DistroName -u root -- bash -c "chown -R support:support /home/support/.openclaw"

# Install packages script
wsl -d $DistroName -u root -- bash -c "cat > /tmp/baseline.sh << 'EOF'
#!/bin/bash
set -e
export DEBIAN_FRONTEND=noninteractive

apt-get update -qq
apt-get install -y sudo curl ca-certificates gnupg jq openssh-server python3 python3-pip python3-venv iproute2 net-tools procps psmisc

curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo 'Installed versions:'
python3 --version
node --version
npm --version
EOF
chmod +x /tmp/baseline.sh && /tmp/baseline.sh"

Write-Host "=== Step 2 Complete ===" -ForegroundColor Green