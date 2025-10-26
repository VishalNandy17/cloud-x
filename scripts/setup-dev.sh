#!/bin/bash

# D-CloudX Development Setup Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Setting up D-CloudX development environment...${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

REQUIRED_COMMANDS=("node" "npm" "docker" "docker-compose" "git")
MISSING_COMMANDS=()

for cmd in "${REQUIRED_COMMANDS[@]}"; do
    if ! command_exists "$cmd"; then
        MISSING_COMMANDS+=("$cmd")
    fi
done

if [ ${#MISSING_COMMANDS[@]} -ne 0 ]; then
    echo -e "${RED}❌ Missing required commands: ${MISSING_COMMANDS[*]}${NC}"
    echo -e "${YELLOW}Please install the missing commands and run this script again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites are installed${NC}"

# Create .env files
echo -e "${YELLOW}📝 Creating environment files...${NC}"

# Server .env
cat > server/.env << EOF
# Database
MONGODB_URI=mongodb://localhost:27017/dcloudx
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Blockchain
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/your-infura-key
BLOCKCHAIN_PRIVATE_KEY=your-private-key-here
BLOCKCHAIN_CONTRACT_ADDRESSES=./contracts/deployments.json

# Cloud Providers
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-west-2

AZURE_CLIENT_ID=your-azure-client-id
AZURE_CLIENT_SECRET=your-azure-client-secret
AZURE_TENANT_ID=your-azure-tenant-id
AZURE_SUBSCRIPTION_ID=your-azure-subscription-id

GCP_PROJECT_ID=your-gcp-project-id
GCP_SERVICE_ACCOUNT_KEY=./docker/gcp-key.json

# Monitoring
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true
ELASTICSEARCH_ENABLED=true

# Application
PORT=5000
NODE_ENV=development
LOG_LEVEL=debug
EOF

# Client .env.local
cat > client/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/your-infura-key
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_CONTRACT_ADDRESSES=./contracts/deployments.json
EOF

# Contracts .env
cat > contracts/.env << EOF
# Network Configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your-infura-key
MAINNET_RPC_URL=https://mainnet.infura.io/v3/your-infura-key

# Private Keys (for deployment)
PRIVATE_KEY=your-private-key-here

# Etherscan API Key (for verification)
ETHERSCAN_API_KEY=your-etherscan-api-key

# Gas Settings
GAS_PRICE=20000000000
GAS_LIMIT=8000000
EOF

echo -e "${GREEN}✅ Environment files created${NC}"

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"

echo -e "${BLUE}Installing contract dependencies...${NC}"
cd contracts && npm install && cd ..

echo -e "${BLUE}Installing server dependencies...${NC}"
cd server && npm install && cd ..

echo -e "${BLUE}Installing client dependencies...${NC}"
cd client && npm install && cd ..

echo -e "${GREEN}✅ All dependencies installed${NC}"

# Compile contracts
echo -e "${YELLOW}📜 Compiling smart contracts...${NC}"
cd contracts && npm run compile && cd ..
echo -e "${GREEN}✅ Smart contracts compiled${NC}"

# Start development services
echo -e "${YELLOW}🐳 Starting development services...${NC}"

# Start Docker services
docker-compose -f docker/docker-compose.yml up -d mongodb redis

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Run database migrations
echo -e "${YELLOW}🗄️ Running database migrations...${NC}"
cd server && npm run migrate && cd ..

echo -e "${GREEN}✅ Database migrations completed${NC}"

# Create development data
echo -e "${YELLOW}🌱 Seeding development data...${NC}"
cd server && npm run seed && cd ..

echo -e "${GREEN}✅ Development data seeded${NC}"

# Show next steps
echo -e "${GREEN}🎉 Development environment setup completed!${NC}"
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "${BLUE}  1. Update the .env files with your actual API keys and credentials${NC}"
echo -e "${BLUE}  2. Deploy smart contracts: cd contracts && npm run deploy:sepolia${NC}"
echo -e "${BLUE}  3. Start the server: cd server && npm run start:dev${NC}"
echo -e "${BLUE}  4. Start the client: cd client && npm run dev${NC}"
echo -e "${BLUE}  5. Access the application at http://localhost:3000${NC}"

echo -e "${BLUE}🔧 Useful commands:${NC}"
echo -e "${BLUE}  Start all services: docker-compose -f docker/docker-compose.yml up -d${NC}"
echo -e "${BLUE}  Stop all services: docker-compose -f docker/docker-compose.yml down${NC}"
echo -e "${BLUE}  View logs: docker-compose -f docker/docker-compose.yml logs -f${NC}"
echo -e "${BLUE}  Run tests: npm run test (in each directory)${NC}"
echo -e "${BLUE}  Run linting: npm run lint (in each directory)${NC}"

echo -e "${YELLOW}⚠️  Remember to:${NC}"
echo -e "${YELLOW}  - Keep your private keys secure${NC}"
echo -e "${YELLOW}  - Use testnet for development${NC}"
echo -e "${YELLOW}  - Never commit .env files to version control${NC}"
