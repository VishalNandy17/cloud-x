# D-CloudX Setup Script for PowerShell (Windows)
# Run: powershell -ExecutionPolicy Bypass -File scripts/setup.ps1

Write-Host ""
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║     D-CloudX Platform Setup Script         ║" -ForegroundColor Blue
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

# Function to check if command exists
function Command-Exists {
    param($Command)
    $ErrorActionPreference = "SilentlyContinue"
    if (Get-Command $Command -ErrorAction SilentlyContinue) {
        return $true
    }
    return $false
}

# Check Node.js
if (-not (Command-Exists node)) {
    Write-Host "❌ Node.js is not installed" -ForegroundColor Red
    Write-Host "Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

$nodeVersion = & node --version
Write-Host "✓ $nodeVersion installed" -ForegroundColor Green

# Check npm
if (-not (Command-Exists npm)) {
    Write-Host "❌ npm is not installed" -ForegroundColor Red
    exit 1
}

$npmVersion = & npm --version
Write-Host "✓ npm $npmVersion installed" -ForegroundColor Green

# Check Docker
if (-not (Command-Exists docker)) {
    Write-Host "❌ Docker is not installed" -ForegroundColor Red
    Write-Host "Please install Docker from https://www.docker.com/" -ForegroundColor Yellow
    exit 1
}

$dockerVersion = & docker --version
Write-Host "✓ $dockerVersion installed" -ForegroundColor Green

# Check Docker Compose
if (Command-Exists docker-compose) {
    $composeVersion = & docker-compose --version
    Write-Host "✓ $composeVersion installed" -ForegroundColor Green
} elseif (Command-Exists docker) {
    try {
        $composeVersion = & docker compose version
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ $composeVersion installed" -ForegroundColor Green
        } else {
            throw
        }
    } catch {
        Write-Host "❌ Docker Compose is not installed" -ForegroundColor Red
        Write-Host "Please enable Docker Compose in Docker Desktop or install it from https://docs.docker.com/compose/install/" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "❌ Docker Compose is not installed" -ForegroundColor Red
    Write-Host "Please enable Docker Compose in Docker Desktop or install it from https://docs.docker.com/compose/install/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📝 Creating environment files..." -ForegroundColor Yellow

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    $envContent = @"
# Database
MONGODB_URI=mongodb://admin:admin123@mongodb:27017/dcloudx?authSource=admin
REDIS_URL=redis://:redis123@redis:6379
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=admin123
REDIS_PASSWORD=redis123

# Server
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Blockchain
ETHEREUM_RPC_URL=http://localhost:8545
PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000001
INFURA_KEY=your-infura-key-here

# Cloud Providers
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-west-2

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_CHAIN_ID=1
NEXT_PUBLIC_INFURA_KEY=your-infura-key

# Monitoring
PROMETHEUS_ENABLED=true
GRAFANA_PASSWORD=admin

# Network
NETWORK=localhost
"@
    Set-Content -Path ".env" -Value $envContent
    Write-Host "✓ Created .env file" -ForegroundColor Green
}
else {
    Write-Host "⊘ .env file already exists" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow

if (Test-Path "package.json") {
    Write-Host "→ Installing root dependencies" -ForegroundColor Cyan
    & npm install --legacy-peer-deps
}

if (Test-Path "server/package.json") {
    Write-Host "→ Installing server dependencies" -ForegroundColor Cyan
    Push-Location server
    & npm install --legacy-peer-deps
    Pop-Location
}

if (Test-Path "client/package.json") {
    Write-Host "→ Installing client dependencies" -ForegroundColor Cyan
    Push-Location client
    & npm install --legacy-peer-deps
    Pop-Location
}

if (Test-Path "contracts/package.json") {
    Write-Host "→ Installing contract dependencies" -ForegroundColor Cyan
    Push-Location contracts
    & npm install --legacy-peer-deps
    Pop-Location
}

Write-Host ""
Write-Host "🐳 Starting Docker services..." -ForegroundColor Yellow

Push-Location docker
& docker-compose up -d
Pop-Location

Write-Host "✓ Docker services started" -ForegroundColor Green

Write-Host ""
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║        Setup Complete! 🎉                  ║" -ForegroundColor Blue
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Blue

Write-Host ""
Write-Host "📚 Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Deploy Smart Contracts:"
Write-Host "   cd contracts"
Write-Host "   npm run deploy:local"
Write-Host ""
Write-Host "2. Start Backend Server:"
Write-Host "   npm run dev:server"
Write-Host ""
Write-Host "3. Start Frontend Application:"
Write-Host "   npm run dev:client"
Write-Host ""
Write-Host "📌 Access the application:" -ForegroundColor Yellow
Write-Host "   - Frontend: http://localhost:3000"
Write-Host "   - Backend API: http://localhost:5000/api/v1"
Write-Host "   - MongoDB: localhost:27017"
Write-Host "   - Redis: localhost:6379"
Write-Host "   - Prometheus: http://localhost:9090"
Write-Host "   - Grafana: http://localhost:3001"
Write-Host "   - Kibana: http://localhost:5601"
Write-Host ""
Write-Host "✓ Happy coding!" -ForegroundColor Green
Write-Host ""
