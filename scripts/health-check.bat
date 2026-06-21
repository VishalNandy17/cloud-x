@echo off
REM D-CloudX Health Check Script for Windows

echo.
echo ╔════════════════════════════════════════════╗
echo ║     D-CloudX Health Check                  ║
echo ╚════════════════════════════════════════════╝
echo.

echo Checking prerequisites...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do echo ✓ Node.js %%i
)

npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm not found
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do echo ✓ npm %%i
)

docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker not found
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('docker --version') do echo ✓ %%i
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose not found
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('docker-compose --version') do echo ✓ %%i
)

echo.
echo Checking services...

REM Check MongoDB
echo Checking MongoDB...
netstat -ano | find "27017" >nul 2>&1
if errorlevel 1 (
    echo ❌ MongoDB not running
) else (
    echo ✓ MongoDB running
)

REM Check Redis
echo Checking Redis...
netstat -ano | find "6379" >nul 2>&1
if errorlevel 1 (
    echo ❌ Redis not running
) else (
    echo ✓ Redis running
)

REM Check Backend API
echo Checking Backend API...
powershell -Command "(curl http://localhost:5000/api/v1/health -ErrorAction SilentlyContinue).StatusCode" | find "200" >nul 2>&1
if errorlevel 1 (
    echo ⊘ Backend API not running
) else (
    echo ✓ Backend API running
)

REM Check Frontend
echo Checking Frontend...
powershell -Command "(curl http://localhost:3000 -ErrorAction SilentlyContinue).StatusCode" | find "200" >nul 2>&1
if errorlevel 1 (
    echo ⊘ Frontend not running
) else (
    echo ✓ Frontend running
)

REM Check Prometheus
echo Checking Prometheus...
powershell -Command "(curl http://localhost:9090 -ErrorAction SilentlyContinue).StatusCode" | find "200" >nul 2>&1
if errorlevel 1 (
    echo ⊘ Prometheus not running
) else (
    echo ✓ Prometheus running
)

REM Check Grafana
echo Checking Grafana...
powershell -Command "(curl http://localhost:3001 -ErrorAction SilentlyContinue).StatusCode" | find "200" >nul 2>&1
if errorlevel 1 (
    echo ⊘ Grafana not running
) else (
    echo ✓ Grafana running
)

echo.
echo ╔════════════════════════════════════════════╗
echo ║        Health Check Complete              ║
echo ╚════════════════════════════════════════════╝
