#!/bin/bash

# D-CloudX Complete Setup Script
# This script sets up the entire development environment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     D-CloudX Platform Setup Script         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null && ! command -v node.exe &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js${NC} ${NODE_VERSION} found"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ npm${NC} ${NPM_VERSION} found"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Please install Docker from https://www.docker.com/"
    exit 1
fi

DOCKER_VERSION=$(docker -v)
echo -e "${GREEN}✓${NC} ${DOCKER_VERSION} found"

# Check if docker-compose is installed
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose -v)
    echo -e "${GREEN}✓${NC} ${COMPOSE_VERSION} found"
elif docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version)
    echo -e "${GREEN}✓${NC} Docker Compose (v2) ${COMPOSE_VERSION} found"
else
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    echo "Please install Docker Compose from https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "\n${YELLOW}📝 Creating environment files...${NC}"

# Create root .env file if it doesn't exist
if [ ! -f .env ]; then
    cat > .env << 'EOF'
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
EOF
    echo -e "${GREEN}✓${NC} Created .env file"
else
    echo -e "${YELLOW}⊘${NC} .env file already exists"
fi

echo -e "\n${YELLOW}📦 Installing dependencies...${NC}"

# Install root dependencies
if [ -f "package.json" ]; then
    echo -e "${BLUE}→${NC} Installing root dependencies"
    npm install --legacy-peer-deps
fi

# Install server dependencies
if [ -f "server/package.json" ]; then
    echo -e "${BLUE}→${NC} Installing server dependencies"
    cd server && npm install --legacy-peer-deps && cd ..
fi

# Install client dependencies
if [ -f "client/package.json" ]; then
    echo -e "${BLUE}→${NC} Installing client dependencies"
    cd client && npm install --legacy-peer-deps && cd ..
fi

# Install contract dependencies
if [ -f "contracts/package.json" ]; then
    echo -e "${BLUE}→${NC} Installing contract dependencies"
    cd contracts && npm install --legacy-peer-deps && cd ..
fi

echo -e "\n${YELLOW}🐳 Starting Docker services...${NC}"
cd docker
docker-compose up -d

echo -e "${GREEN}✓${NC} Docker services started"

echo -e "\n${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 10

echo -e "\n${YELLOW}🔍 Checking service health...${NC}"

# Check MongoDB
if docker-compose logs mongodb | grep -q "Listening on"; then
    echo -e "${GREEN}✓${NC} MongoDB is ready"
else
    echo -e "${YELLOW}⊘${NC} MongoDB might still be initializing"
fi

# Check Redis
if docker-compose logs redis | grep -q "ready to accept"; then
    echo -e "${GREEN}✓${NC} Redis is ready"
else
    echo -e "${YELLOW}⊘${NC} Redis might still be initializing"
fi

cd ..

echo -e "\n${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        Setup Complete! 🎉                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"

echo -e "\n${YELLOW}📚 Next steps:${NC}"
echo ""
echo -e "1. ${BLUE}Deploy Smart Contracts:${NC}"
echo "   cd contracts"
echo "   npm run deploy:local"
echo ""
echo -e "2. ${BLUE}Start Backend Server:${NC}"
echo "   npm run dev:server"
echo ""
echo -e "3. ${BLUE}Start Frontend Application:${NC}"
echo "   npm run dev:client"
echo ""
echo -e "4. ${YELLOW}Access the application:${NC}"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:5000/api/v1"
echo "   - MongoDB: localhost:27017"
echo "   - Redis: localhost:6379"
echo "   - Prometheus: http://localhost:9090"
echo "   - Grafana: http://localhost:3001"
echo "   - Kibana: http://localhost:5601"
echo ""
echo -e "${GREEN}✓ Happy coding!${NC}\n"
