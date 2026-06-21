@echo off
REM D-CloudX Setup Script for Windows
REM This script sets up the entire development environment

echo.
echo ╔════════════════════════════════════════════╗
echo ║     D-CloudX Platform Setup Script         ║
echo ╚════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed
    echo Please install Node.js 18+ from https://nodejs.org/
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js %NODE_VERSION% installed

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✓ npm %NPM_VERSION% installed

REM Check Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed
    echo Please install Docker from https://www.docker.com/
    exit /b 1
)

for /f "tokens=*" %%i in ('docker --version') do set DOCKER_VERSION=%%i
echo ✓ %DOCKER_VERSION% installed

REM Check Docker Compose
docker-compose --version >nul 2>&1
if errorlevel 0 (
    for /f "tokens=*" %%i in ('docker-compose --version') do set COMPOSE_VERSION=%%i
    echo ✓ %COMPOSE_VERSION% installed
) else (
    docker compose version >nul 2>&1
    if errorlevel 0 (
        for /f "tokens=*" %%i in ('docker compose version') do set COMPOSE_VERSION=%%i
        echo ✓ Docker Compose (v2) %COMPOSE_VERSION% installed
    ) else (
        echo ❌ Docker Compose is not installed
        echo Please install Docker Compose by enabling Docker Desktop or following https://docs.docker.com/compose/install/
        exit /b 1
    )
)

echo.
echo 📝 Creating environment files...

REM Create .env file if it doesn't exist
if not exist ".env" (
    (
        echo # Database
        echo MONGODB_URI=mongodb://admin:admin123@mongodb:27017/dcloudx?authSource=admin
        echo REDIS_URL=redis://:redis123@redis:6379
        echo MONGO_ROOT_USERNAME=admin
        echo MONGO_ROOT_PASSWORD=admin123
        echo REDIS_PASSWORD=redis123
        echo.
        echo # Server
        echo PORT=5000
        echo NODE_ENV=development
        echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
        echo.
        echo # Blockchain
        echo ETHEREUM_RPC_URL=http://localhost:8545
        echo PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000001
        echo INFURA_KEY=your-infura-key-here
        echo.
        echo # Cloud Providers
        echo AWS_ACCESS_KEY_ID=your-aws-key
        echo AWS_SECRET_ACCESS_KEY=your-aws-secret
        echo AWS_REGION=us-west-2
        echo.
        echo # Frontend
        echo NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
        echo NEXT_PUBLIC_CHAIN_ID=1
        echo NEXT_PUBLIC_INFURA_KEY=your-infura-key
        echo.
        echo # Monitoring
        echo PROMETHEUS_ENABLED=true
        echo GRAFANA_PASSWORD=admin
        echo.
        echo # Network
        echo NETWORK=localhost
    ) > .env
    echo ✓ Created .env file
) else (
    echo ⊘ .env file already exists
)

echo.
echo 📦 Installing dependencies...

if exist "package.json" (
    echo → Installing root dependencies
    call npm install --legacy-peer-deps
)

if exist "server\package.json" (
    echo → Installing server dependencies
    cd server
    call npm install --legacy-peer-deps
    cd ..
)

if exist "client\package.json" (
    echo → Installing client dependencies
    cd client
    call npm install --legacy-peer-deps
    cd ..
)

if exist "contracts\package.json" (
    echo → Installing contract dependencies
    cd contracts
    call npm install --legacy-peer-deps
    cd ..
)

echo.
echo 🐳 Starting Docker services...
cd docker
call docker-compose up -d
cd ..

echo ✓ Docker services started

echo.
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak

echo.
echo ╔════════════════════════════════════════════╗
echo ║        Setup Complete! 🎉                  ║
echo ╚════════════════════════════════════════════╝

echo.
echo 📚 Next steps:
echo.
echo 1. Deploy Smart Contracts:
echo    cd contracts
echo    npm run deploy:local
echo.
echo 2. Start Backend Server:
echo    npm run dev:server
echo.
echo 3. Start Frontend Application:
echo    npm run dev:client
echo.
echo 📌 Access the application:
echo    - Frontend: http://localhost:3000
echo    - Backend API: http://localhost:5000/api/v1
echo    - MongoDB: localhost:27017
echo    - Redis: localhost:6379
echo    - Prometheus: http://localhost:9090
echo    - Grafana: http://localhost:3001
echo    - Kibana: http://localhost:5601
echo.
echo ✓ Happy coding!
echo.
