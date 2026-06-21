# D-CloudX Troubleshooting Guide

## Common Issues and Solutions

### Setup Issues

#### 1. "Node.js 18+ is required"

**Problem**: Setup script exits with Node.js version error

**Solution**:
```bash
# Check current version
node -v

# Install Node.js 18+ from https://nodejs.org/
# Or using nvm (Node Version Manager):
nvm install 18
nvm use 18
```

#### 2. "npm ERR! code ERESOLVE"

**Problem**: Dependency conflict during npm install

**Solution**:
```bash
# Use legacy peer deps flag
npm install --legacy-peer-deps

# Or clean cache
npm cache clean --force
npm install
```

#### 3. ".env file not found"

**Problem**: Application fails because .env doesn't exist

**Solution**:
```bash
# Copy from template
cp .env.example .env

# Edit with your values
nano .env  # or your preferred editor
```

### Docker Issues

#### 1. "Port already in use"

**Problem**: Docker container fails to start because port is in use

**Solution**:
```bash
# Find process using the port
lsof -i :3000  # for port 3000

# Kill the process
kill -9 <PID>

# Or use different port
docker-compose -f docker/docker-compose.yml -p custom_name up -d
```

#### 2. "Cannot connect to Docker daemon"

**Problem**: Docker is not running

**Solution**:
```bash
# On Windows/Mac:
# Open Docker Desktop application

# On Linux:
sudo systemctl start docker

# Verify Docker is running
docker ps
```

#### 3. "Insufficient memory"

**Problem**: Docker containers OOMKilled or crashing

**Solution**:
```bash
# Increase Docker memory limit
# On Docker Desktop: Preferences → Resources → Memory

# Or limit specific container
docker-compose -f docker/docker-compose.yml down
docker-compose -f docker/docker-compose.yml up -d
```

#### 4. "Volumes not mounting correctly"

**Problem**: Files not accessible inside Docker container

**Solution**:
```bash
# Check volume mount paths
docker-compose -f docker/docker-compose.yml config | grep -A 5 volumes

# Rebuild containers
docker-compose -f docker/docker-compose.yml down -v
docker-compose -f docker/docker-compose.yml up -d --build
```

### Database Issues

#### 1. "MongoDB connection refused"

**Problem**: Backend cannot connect to MongoDB

**Solution**:
```bash
# Check MongoDB is running
docker-compose logs mongodb

# Verify connection string
grep MONGODB_URI .env

# Test connection
mongosh --host localhost --port 27017 -u admin -p admin123

# Restart MongoDB
docker-compose restart mongodb
```

#### 2. "MongoDB authentication failed"

**Problem**: "Authentication failed" error in logs

**Solution**:
```bash
# Check credentials in .env
cat .env | grep MONGO

# Verify in docker-compose.yml
grep -A 5 "MONGO_INITDB" docker/docker-compose.yml

# Reset MongoDB volume
docker-compose down -v
docker-compose up -d mongodb

# Wait for initialization
sleep 10
```

#### 3. "Redis connection timeout"

**Problem**: Backend cannot connect to Redis

**Solution**:
```bash
# Check Redis is running
docker-compose logs redis

# Test connection
redis-cli

# If connection refused, restart Redis
docker-compose restart redis
```

### Backend Issues

#### 1. "Cannot find module '@nestjs/...'"

**Problem**: NestJS dependency not installed

**Solution**:
```bash
cd server
npm install
npm run build
```

#### 2. "API endpoint returns 502 Bad Gateway"

**Problem**: Backend server is down

**Solution**:
```bash
# Check if server is running
curl http://localhost:5000/api/v1/health

# Start the server
cd server
npm run dev

# Or with debug logs
DEBUG=* npm run dev
```

#### 3. "CORS error in browser console"

**Problem**: Frontend cannot communicate with backend

**Solution**:
```bash
# Check CORS_ORIGIN in .env
grep CORS_ORIGIN .env

# Should include frontend URL
CORS_ORIGIN=http://localhost:3000

# Restart backend
npm run dev --prefix server
```

#### 4. "TypeScript compilation errors"

**Problem**: `npm run build` fails with type errors

**Solution**:
```bash
# Check TypeScript version
npx tsc --version

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Build again
npm run build
```

### Frontend Issues

#### 1. "module not found" or "cannot resolve '@/...'"

**Problem**: TypeScript path alias not working

**Solution**:
```bash
# Check tsconfig.json exists
ls client/tsconfig.json

# Clear Next.js cache
rm -rf client/.next

# Rebuild
cd client
npm run build
```

#### 2. "MetaMask not found"

**Problem**: Wallet connection fails because MetaMask is not installed

**Solution**:
- Install MetaMask browser extension from https://metamask.io/
- Or use WalletConnect QR code option

#### 3. "Port 3000 already in use"

**Problem**: Frontend server cannot start

**Solution**:
```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
npm run dev -- -p 3001
```

#### 4. "Environment variables not loaded"

**Problem**: Frontend cannot access NEXT_PUBLIC_* variables

**Solution**:
```bash
# Check .env.local file exists
ls client/.env.local

# Verify NEXT_PUBLIC_ prefix
grep "NEXT_PUBLIC_" .env

# Restart dev server
npm run dev --prefix client
```

### Smart Contract Issues

#### 1. "Contract compilation failed"

**Problem**: `npm run compile` errors with Solidity issues

**Solution**:
```bash
cd contracts

# Check Solidity version
grep "solidity" hardhat.config.js

# Clear artifacts
npm run clean

# Compile again
npm run compile
```

#### 2. "Deployment script fails"

**Problem**: `npm run deploy:local` fails

**Solution**:
```bash
# Ensure local blockchain is running
npm run node &

# In another terminal, deploy
npm run deploy:local

# Check for errors
npm run deploy:local -- --verbose
```

#### 3. "Gas estimation failed"

**Problem**: Contract functions fail with gas error

**Solution**:
```bash
# Increase gas limit in hardhat.config.js
// In hardhat.config.js
networks: {
  hardhat: {
    gas: 8000000,
    blockGasLimit: 8000000
  }
}

# Recompile and redeploy
npm run clean
npm run compile
npm run deploy:local
```

#### 4. "Account has insufficient funds"

**Problem**: Deployment fails because account doesn't have ETH

**Solution**:
```bash
# Use default test accounts from Hardhat
# They have unlimited ETH

# Or if using real testnet:
# Get Sepolia ETH from faucet: https://sepoliafaucet.com
# Then deploy: npm run deploy:sepolia
```

### Blockchain Network Issues

#### 1. "Network error when querying"

**Problem**: Cannot connect to Ethereum RPC

**Solution**:
```bash
# Check RPC URL in .env
grep ETHEREUM_RPC_URL .env

# For local development:
ETHEREUM_RPC_URL=http://localhost:8545

# For Sepolia testnet:
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Get Infura key: https://infura.io/
```

#### 2. "Invalid chain ID"

**Problem**: Frontend shows wrong network

**Solution**:
```bash
# Check chain ID in frontend config
grep "NEXT_PUBLIC_CHAIN_ID" .env

# Common chain IDs:
# 1 = Mainnet
# 11155111 = Sepolia
# 31337 = Hardhat local

# Update and restart frontend
npm run dev --prefix client
```

### Monitoring Issues

#### 1. "Prometheus has no data"

**Problem**: Monitoring dashboard is empty

**Solution**:
```bash
# Check Prometheus config
cat docker/prometheus.yml

# Restart Prometheus
docker-compose restart prometheus

# Wait for metrics to be collected (few minutes)
```

#### 2. "Grafana displays no graphs"

**Problem**: Dashboards are empty

**Solution**:
```bash
# Login to Grafana
# http://localhost:3001 (admin/admin)

# Check data source configuration:
# Configuration → Data Sources → Prometheus

# Verify URL: http://prometheus:9090

# Reload dashboard
```

#### 3. "Kibana cannot connect to Elasticsearch"

**Problem**: Log viewer shows connection error

**Solution**:
```bash
# Check Elasticsearch status
curl http://localhost:9200

# Check Docker logs
docker-compose logs elasticsearch

# Restart stack
docker-compose restart elasticsearch kibana
```

## Performance Tuning

### Slow API Response

```bash
# Check Redis is working
redis-cli ping

# Monitor database
docker-compose logs mongodb

# Check API logs
npm run dev --prefix server | grep -i "error\|warn"
```

### High Memory Usage

```bash
# Monitor Docker containers
docker stats

# Restart memory-heavy services
docker-compose restart server mongodb elasticsearch
```

### Slow Frontend Build

```bash
# Clear cache
rm -rf client/.next

# Rebuild with timing
time npm run build --prefix client

# Check for large bundles
npm run build --prefix client -- --debug
```

## Debugging

### Enable Debug Logging

```bash
# For NestJS
DEBUG=* npm run dev --prefix server

# For Next.js
DEBUG=* npm run dev --prefix client

# For Hardhat
npx hardhat --verbose test
```

### Database Inspection

```bash
# MongoDB
mongosh --host localhost -u admin -p admin123
> show databases
> use dcloudx
> show collections

# Redis
redis-cli
> KEYS *
> GET mykey
```

### Network Inspection

```bash
# Check all listening ports
netstat -tlnp | grep LISTEN

# Test port connectivity
nc -zv localhost 5000
```

## Getting Help

If you still have issues:

1. **Check logs**:
   ```bash
   docker-compose logs -f [service_name]
   ```

2. **Enable debug mode**:
   ```bash
   DEBUG=* npm run dev
   ```

3. **Reset everything**:
   ```bash
   docker-compose down -v
   npm run clean
   bash scripts/setup.sh
   ```

4. **Open an issue**: https://github.com/VishalNandy17/cloud-x/issues

5. **Review documentation**: Check `/docs` folder for detailed guides
