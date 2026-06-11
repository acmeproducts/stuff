# 04_report_server_v1.ps1 - Report server setup
param([string]$DistroName = "oc-dev")
$ErrorActionPreference = "Stop"

Write-Host "=== Setting up report server ===" -ForegroundColor Cyan

# Create directories
wsl -d $DistroName -u root -- bash -c "mkdir -p /home/support/.report/{logs,pages}"
wsl -d $DistroName -u root -- bash -c "chown -R support:support /home/support/.report"

# Create HTML files
wsl -d $DistroName -u support -- bash -c "cat > /home/support/.report/index.html << 'EOF'
<!DOCTYPE html><html><head><title>oc-dev</title></head><body><h1>oc-dev Report Server</h1><p><a href='server-card.html'>Server Card</a></p></body></html>
EOF"

wsl -d $DistroName -u support -- bash -c "cat > /home/support/.report/server-card.html << 'EOF'
<!DOCTYPE html><html><head><title>Server Card</title></head><body><h1>oc-dev Server Card</h1><p>Status: Running</p></body></html>
EOF"

# Python server script
wsl -d $DistroName -u root -- bash -c "cat > /usr/local/bin/oc-report-server << 'EOF'
#!/usr/bin/env python3
import http.server, socketserver, os
os.chdir('/home/support/.report')
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args): pass
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(('127.0.0.1', 18080), Handler) as httpd:
    httpd.serve_forever()
EOF
chmod +x /usr/local/bin/oc-report-server"

# systemd service
wsl -d $DistroName -u root -- bash -c "cat > /etc/systemd/system/oc-report-server.service << 'EOF'
[Unit]
Description=OC Report Server
After=network.target
[Service]
Type=simple
User=support
WorkingDirectory=/home/support/.report
ExecStart=/usr/local/bin/oc-report-server
Restart=always
[Install]
WantedBy=multi-user.target
EOF"

# Enable and start
wsl -d $DistroName -u root -- bash -c "systemctl daemon-reload; systemctl enable oc-report-server; systemctl start oc-report-server"

Write-Host "Report server running on port 18080" -ForegroundColor Green
Write-Host "=== Step 4 Complete ===" -ForegroundColor Green