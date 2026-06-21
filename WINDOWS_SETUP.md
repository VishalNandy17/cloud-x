# D-CloudX Windows Setup Guide

This guide is for developers using Windows with PowerShell or Command Prompt.

## Prerequisites

Before running the setup script, ensure you have installed:

1. **Node.js 18+** - https://nodejs.org/
   - Download the LTS version
   - During installation, make sure to add Node to PATH
   - Verify: Open PowerShell and run `node -v` and `npm -v`

2. **Docker Desktop** - https://www.docker.com/products/docker-desktop
   - Install for Windows
   - Start Docker Desktop after installation
   - Verify: Run `docker --version` in PowerShell

3. **Git** - https://git-scm.com/download/win (optional but recommended)

## Verifying Installation

Open PowerShell or Command Prompt and verify:

```powershell
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
docker --version  # Should show Docker version
docker-compose --version  # Should show compose version
```

If any command is not recognized, Node.js or Docker is not properly installed or not added to PATH.

## Setup Instructions

### Option 1: Using PowerShell (Recommended for Windows)

```powershell
# Navigate to project directory
cd D:\cloud-x-main

# Run setup script
powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
```

### Option 2: Using Command Prompt (cmd.exe)

```cmd
cd D:\cloud-x-main
scripts\setup.bat
```

### Option 3: Manual Setup (If scripts fail)

```powershell
# 1. Create .env file
Copy-Item .env.example .env

# 2. Edit .env with your configuration
notepad .env

# 3. Install dependencies (fix ethers version conflict)
npm install --legacy-peer-deps

cd server
npm install --legacy-peer-deps
cd ..

cd client  
npm install --legacy-peer-deps
cd ..

cd contracts
npm install --legacy-peer-deps
cd ..

# 4. Start Docker services
cd docker
docker-compose up -d
cd ..

# Wait 10 seconds for services to initialize
Start-Sleep -Seconds 10
```

## Running the Application

After setup completes, use separate PowerShell terminals for each service:

### Terminal 1: Backend Server

```powershell
npm run dev:server
```

Expected output:
```
[Nest] 1234  - 06/21/2026, 12:00:00 PM     LOG [NestFactory] Starting Nest application...
[Nest] 1234  - 06/21/2026, 12:00:00 PM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 1234  - 06/21/2026, 12:00:01 PM     LOG [NestApplication] Nest application successfully started
```

### Terminal 2: Frontend Application

```powershell
npm run dev:client
```

Expected output:
```
> dcloudx-client@1.0.0 dev
> next dev

  ▲ Next.js 14.0.0
  - Local:        http://localhost:3000
  - Environments: .env.local
```

### Terminal 3 (Optional): Deploy Contracts

```powershell
cd contracts
npm run deploy:local
```

## Accessing Services

Once everything is running, access the application at:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api/v1
- **API Documentation**: http://localhost:5000/api/v1
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)
- **Kibana**: http://localhost:5601
- **MongoDB**: localhost:27017 (admin:admin123)
- **Redis**: localhost:6379 (:redis123)

## Health Check

To verify all services are running:

```powershell
# Using PowerShell
scripts\health-check.bat

# Or manually check
netstat -ano | findstr "3000"    # Frontend
netstat -ano | findstr "5000"    # Backend
netstat -ano | findstr "27017"   # MongoDB
netstat -ano | findstr "6379"    # Redis
```

## Common Issues on Windows

### 1. "Node.js is not installed" (even though it is)

**Solution**: Node.js may not be in PATH. 
- Restart PowerShell after installing Node.js
- Or add Node.js to PATH manually:
  - System Properties → Environment Variables
  - Add `C:\Program Files\nodejs` to PATH

### 2. `npm ERR! code ERESOLVE`

**Solution**: This is already fixed by updating contracts to use ethers v6. Run:

```powershell
npm install --legacy-peer-deps
cd contracts
npm install --legacy-peer-deps
```

### 3. "Docker daemon not running"

**Solution**: Start Docker Desktop
- Click Docker icon in system tray
- Or search for "Docker Desktop" in Start menu and launch it
- Wait for it to fully start (look for notification)

### 4. Port already in use (e.g., 3000 or 5000)

**Find and kill process using port:**

PowerShell:
```powershell
# Find process on port 3000
Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess

# Kill it
Stop-Process -Id <PID> -Force
```

Command Prompt:
```cmd
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### 5. "Cannot find mongosh command"

**Solution**: This is for MongoDB CLI tool. Not required for development.
- MongoDB runs in Docker, so it's already available
- If you need to access it: `docker-compose exec mongodb mongosh`

### 6. `npm ERR! ERR! code E401` (Authentication error)

**Solution**: Check your npm registry access:

```powershell
npm config get registry  # Should be https://registry.npmjs.org/
npm login  # If needed
```

## Stopping Services

To stop everything:

```powershell
# Stop backend (Ctrl+C in Terminal 1)
# Stop frontend (Ctrl+C in Terminal 2)

# Stop Docker services
cd docker
docker-compose down
```

To completely reset (WARNING: deletes all data):

```powershell
cd docker
docker-compose down -v
```

## Development Workflow

1. **Create feature branch**:
   ```powershell
   git checkout -b feature/my-feature
   ```

2. **Make changes** and test locally

3. **Run tests**:
   ```powershell
   npm run test
   ```

4. **Check linting**:
   ```powershell
   npm run lint
   ```

5. **Commit changes**:
   ```powershell
   git commit -m "feat: add my feature"
   ```

6. **Push and create PR**:
   ```powershell
   git push origin feature/my-feature
   ```

## Viewing Logs

```powershell
# Backend logs
docker-compose logs -f server

# MongoDB logs
docker-compose logs -f mongodb

# All service logs
docker-compose logs -f

# View specific lines
docker-compose logs --tail=50 server
```

## Performance Notes

- First build may take 5-10 minutes as Docker downloads base images
- Hot reload works for both frontend and backend
- Database is persisted in Docker volumes between restarts

## Support

If you encounter issues:

1. Check `TROUBLESHOOTING.md` in project root
2. Review Docker logs: `docker-compose logs`
3. Verify all services with health check script
4. Open an issue on GitHub with logs and error messages

## Next Steps

After successful setup:
- Read [DEVELOPMENT.md](DEVELOPMENT.md) for development guide
- Review [API documentation](docs/api-documentation.md)
- Check out the architecture in [docs/architecture.md](docs/architecture.md)
- Start building! 🚀
