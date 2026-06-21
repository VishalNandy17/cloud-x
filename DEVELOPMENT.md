# D-CloudX Development Guide

## Overview

D-CloudX is a decentralized cloud resource marketplace built with a modern tech stack combining blockchain, cloud computing, and traditional web infrastructure.

### Project Structure

```
cloud-x/
├── server/              # NestJS backend API
├── client/              # Next.js frontend application
├── contracts/           # Solidity smart contracts
├── docker/              # Docker configuration files
├── k8s/                 # Kubernetes deployment files
├── scripts/             # Utility and deployment scripts
├── docs/                # Project documentation
└── docker-compose.yml   # Container orchestration
```

## Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **Docker**: Latest version with Compose
- **Git**: For version control
- **MetaMask** or Web3 wallet (for blockchain testing)

## Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/VishalNandy17/cloud-x.git
cd cloud-x

# Run the automated setup script
bash scripts/setup.sh
```

### 2. Environment Configuration

The setup script creates a `.env` file. Review and update it with your configuration:

```bash
# View environment file
cat .env

# Edit with your values
# IMPORTANT: Never commit .env to version control
```

### 3. Start Services

```bash
# Start all Docker services
cd docker
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Deploy Smart Contracts

```bash
cd contracts

# Compile contracts
npm run compile

# Deploy to local network
npm run deploy:local

# Deploy to testnet
npm run deploy:sepolia
```

### 5. Start Backend Server

```bash
cd server

# Development mode with auto-reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### 6. Start Frontend Application

```bash
cd client

# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Architecture

### Frontend (Next.js)

- **Location**: `client/`
- **Port**: 3000
- **Stack**: React 18, TypeScript, Tailwind CSS, Redux, Wagmi, RainbowKit
- **Key Features**:
  - Wallet connection (MetaMask, WalletConnect, Coinbase)
  - Real-time resource marketplace
  - Resource booking interface
  - User dashboard and profile management

### Backend API (NestJS)

- **Location**: `server/`
- **Port**: 5000
- **Stack**: Node.js, NestJS, TypeScript, MongoDB, Redis
- **Key Features**:
  - RESTful API endpoints
  - WebSocket support for real-time updates
  - JWT authentication
  - Rate limiting and CORS
  - Comprehensive logging and monitoring
  - Swagger/OpenAPI documentation

### Smart Contracts (Solidity)

- **Location**: `contracts/`
- **Stack**: Hardhat, OpenZeppelin, Ethers.js
- **Key Contracts**:
  - `ResourceMarketplace.sol`: Core marketplace logic
  - `EscrowManager.sol`: Secure payment handling
  - `ReputationSystem.sol`: Provider/user ratings
  - `DCXToken.sol`: Governance token
  - `SLAEnforcement.sol`: Service level agreements

### Infrastructure

- **Database**: MongoDB (port 27017)
- **Cache**: Redis (port 6379)
- **Monitoring**: Prometheus (port 9090)
- **Visualization**: Grafana (port 3001)
- **Logging**: Elasticsearch + Kibana (port 5601)
- **Load Balancer**: Nginx (port 80/443)

## Development Workflows

### Running Tests

```bash
# Test all packages
npm run test

# Test specific package
npm run test:server
npm run test:client
npm run test:contracts

# Test coverage
npm run test:coverage
```

### Code Quality

```bash
# Lint all packages
npm run lint

# Fix linting issues
npm run format

# Check types
npx tsc --noEmit
```

### Database Migrations

```bash
cd server

# Generate migration
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

### Database Seeding

```bash
cd server

# Run seed script
npm run seed
```

## Common Tasks

### View API Documentation

Navigate to: http://localhost:5000/api/v1

### Connect to Database

```bash
# MongoDB
mongosh --host localhost --port 27017 -u admin -p admin123

# Redis
redis-cli
```

### Deploy to Different Networks

```bash
cd contracts

# Deploy to Sepolia testnet
npm run deploy:sepolia

# Deploy to Mainnet (careful!)
npm run deploy:mainnet

# Verify contract
npm run verify:sepolia
```

### Monitor Application

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)
- **Kibana**: http://localhost:5601

### Clean and Reset

```bash
# Stop all containers
docker-compose down

# Remove volumes (warning: deletes data)
docker-compose down -v

# Clean build artifacts
npm run clean

# Rebuild everything
npm run build
```

## Environment Variables

### Critical Variables

```env
# Authentication
JWT_SECRET=your-super-secret-key
JWT_EXPIRATION=7d

# Database
MONGODB_URI=mongodb://admin:password@localhost:27017/dcloudx
REDIS_URL=redis://localhost:6379

# Blockchain
ETHEREUM_RPC_URL=http://localhost:8545
PRIVATE_KEY=0x...
INFURA_KEY=your-infura-key

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

See `.env.example` for all available options.

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Connection Failed

```bash
# Check MongoDB is running
docker-compose logs mongodb

# Verify connection string in .env
mongo localhost:27017
```

### Smart Contract Deployment Failed

```bash
# Check local blockchain is running
npm run node --prefix contracts

# Verify accounts have ETH
# In another terminal, deploy
npm run deploy:local --prefix contracts
```

### Memory Issues

```bash
# Increase Docker memory
docker update --memory 4gb <container_id>
```

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Commit changes: `git commit -am 'feat: add my feature'`
3. Push to branch: `git push origin feature/my-feature`
4. Create Pull Request

Please follow the [Conventional Commits](https://www.conventionalcommits.org/) format.

## Testing on Different Chains

### Local Hardhat Network

```bash
cd contracts
npm run node
# In another terminal
npm run deploy:local
```

### Sepolia Testnet

1. Get Sepolia ETH from faucet
2. Configure `.env` with Infura key
3. `npm run deploy:sepolia`

### Mainnet (Production)

⚠️ **Use extreme caution!**

```bash
# Verify contract first
npm run verify:mainnet

# Deploy with careful review
npm run deploy:mainnet
```

## Performance Tips

- Use Redis caching for frequently accessed data
- Enable database indexing on commonly queried fields
- Use lazy loading for images and components
- Implement request rate limiting
- Monitor Prometheus metrics regularly

## Security Considerations

- Never commit `.env` files
- Rotate JWT secrets regularly
- Use HTTPS in production
- Implement proper CORS policies
- Regular security audits for smart contracts
- Use multi-sig wallets for production contracts

## Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [Hardhat Documentation](https://hardhat.org/)
- [Ethereum Development Documentation](https://ethereum.org/en/developers/)

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation in `/docs`
- Review test files for usage examples

## License

MIT License - see LICENSE file for details
