# oc-dev WSL2 Environment Setup

Automated setup for OpenClaw development environment on WSL2 Ubuntu 24.04.

## Prerequisites

- Windows 10/11 with WSL2
- PowerShell 7+
- Internet connection

## Quick Start

1. **Clone and configure credentials:**
   ```powershell
   git clone https://github.com/acmeproducts/stuff.git
   cd stuff/oc
   powershell -ExecutionPolicy Bypass -File "setup.ps1"
   ```

2. **Run the setup:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File "wrapper.ps1"
   ```

## Required Credentials

The setup script will prompt for:

| Variable | Description |
|----------|-------------|
| `TS_AUTH_KEY` | Tailscale authentication key |
| `VENICE_API_KEY` | Venice AI API key |
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `OPENCLAW_TOKEN` | OpenClaw gateway token |
| `WHATSAPP_NUMBER` | Allowed WhatsApp number (e.g., +19497776846) |

## Security

- **NEVER commit `secrets.ps1`** - it's in `.gitignore`
- Rotate API keys periodically
