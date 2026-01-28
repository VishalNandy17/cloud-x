# Cloud-X — Decentralized Cloud Resource Marketplace

<div align="center">

![Cloud-X Banner](https://img.shields.io/badge/Cloud--X-Decentralized%20Cloud-blue?style=for-the-badge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.x-363636?style=for-the-badge&logo=solidity)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)

**A Web3-powered marketplace for decentralized cloud compute and storage resources**

[Features](#-features) • [Architecture](#-architecture) • [Setup](#️-local-setup) • [Roadmap](#-roadmap)

</div>

---

## 📖 About

Cloud-X is a decentralized marketplace that reimagines how cloud resources are listed, discovered, and booked. Instead of relying on centralized providers, Cloud-X uses smart contracts to create a trustless, transparent marketplace for compute and storage resources.

This project serves as a **learning platform** and **portfolio piece**, focusing on:
- Blockchain architecture and smart contract design
- Hybrid Web2 + Web3 system integration
- Backend API development for blockchain applications
- Full-stack decentralized application (dApp) development

---

## 🚀 Features

### Core Features
- **🔐 Wallet-Based Authentication** — Connect with MetaMask or WalletConnect
- **📝 Smart Contract Listings** — On-chain resource listings with immutable records
- **🔄 Automated Bookings** — Smart contract-powered reservation system
- **💰 Transparent Pricing** — On-chain pricing and payment settlement
- **📊 Resource Marketplace** — Browse and filter available cloud resources
- **⚡ Real-time Updates** — Event-driven architecture for instant updates

### Technical Features
- RESTful API backend with comprehensive endpoints
- Dockerized development environment
- Multi-chain ready architecture
- MongoDB for off-chain data storage
- Redis caching for performance optimization

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React/Next.js)                 │
│              • Wallet Integration  • UI Components          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 Backend API (Node.js/NestJS)                 │
│          • REST Endpoints  • Business Logic  • Auth         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                ▼                     ▼
┌───────────────────────┐   ┌──────────────────────┐
│  Smart Contracts      │   │  Database Layer      │
│  (Solidity)           │   │  • MongoDB           │
│  • Listings           │   │  • Redis Cache       │
│  • Bookings           │   └──────────────────────┘
│  • Payments           │
└──────────┬────────────┘
           │
           ▼
┌───────────────────────┐
│  Blockchain Network   │
│  (Testnet/Mainnet)    │
└───────────────────────┘
           │
           ▼
┌───────────────────────┐
│  Cloud Providers      │
│  (Mocked/Experimental)│
└───────────────────────┘
```

---

## 📁 Project Structure

```
cloud-x/
├── contracts/              # Solidity smart contracts
│   ├── src/
│   │   ├── ResourceListing.sol
│   │   ├── Booking.sol
│   │   └── PaymentManager.sol
│   ├── test/
│   ├── scripts/
│   └── hardhat.config.js
│
├── backend/                # API server
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── middleware/
│   │   └── routes/
│   ├── test/
│   └── package.json
│
├── frontend/               # Web client
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── styles/
│   ├── public/
│   └── package.json
│
├── docker/                 # Docker configurations
│   ├── docker-compose.yml
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
│
├── scripts/                # Helper scripts
│   ├── deploy.sh
│   └── setup.sh
│
├── docs/                   # Documentation
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── CONTRACTS.md
│
├── .github/                # GitHub Actions
│   └── workflows/
│       └── ci.yml
│
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **Next.js 14** | React framework with SSR/SSG |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | Utility-first CSS framework |
| **Ethers.js** | Ethereum wallet integration |
| **React Query** | Server state management |
| **Zustand** | Client state management |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js** | JavaScript runtime |
| **NestJS** | Progressive Node.js framework |
| **MongoDB** | NoSQL database for off-chain data |
| **Redis** | Caching and session management |
| **Express** | Web framework |
| **JWT** | Authentication tokens |

### Blockchain
| Technology | Purpose |
|-----------|---------|
| **Solidity ^0.8.20** | Smart contract language |
| **Hardhat** | Development environment |
| **OpenZeppelin** | Secure contract libraries |
| **Ethers.js** | Blockchain interaction |
| **Chainlink** | Oracle services (future) |

### DevOps
| Technology | Purpose |
|-----------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-container orchestration |
| **GitHub Actions** | CI/CD pipelines |
| **ESLint/Prettier** | Code quality |

---

## ⚙️ Local Setup

### Prerequisites

- **Node.js** >= 18.x
- **npm** or **yarn**
- **Docker** and **Docker Compose**
- **MetaMask** or another Web3 wallet
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/VishalNandy17/cloud-x.git
cd cloud-x
```

### 2. Environment Configuration

```bash
# Copy environment templates
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Blockchain
PRIVATE_KEY=your_private_key_here
INFURA_API_KEY=your_infura_key
NETWORK=localhost

# Backend
DATABASE_URL=mongodb://localhost:27017/cloudx
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
PORT=3001

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_CHAIN_ID=31337
```

### 3. Start Services with Docker

```bash
# Start MongoDB, Redis, and other services
docker-compose up -d
```

### 4. Deploy Smart Contracts

```bash
# Navigate to contracts directory
cd contracts

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Start local blockchain node
npx hardhat node

# In a new terminal, deploy contracts
npx hardhat run scripts/deploy.js --network localhost
```

Save the deployed contract addresses displayed in the terminal.

### 5. Start Backend Server

```bash
# Navigate to backend directory
cd ../backend

# Install dependencies
npm install

# Run database migrations (if any)
npm run migrate

# Start development server
npm run dev
```

Backend will run at `http://localhost:3001`

### 6. Start Frontend Application

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run at `http://localhost:3000`

### 7. Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **API Docs**: http://localhost:3001/api-docs

---

## 🧪 Testing

### Smart Contracts

```bash
cd contracts
npm test
npm run coverage
```

### Backend

```bash
cd backend
npm test
npm run test:e2e
npm run test:coverage
```

### Frontend

```bash
cd frontend
npm test
npm run test:e2e
```

### Run All Tests

```bash
# From project root
npm run test:all
```

---

## 📚 API Documentation

### Endpoints

#### Authentication
- `POST /api/auth/nonce` — Get nonce for wallet signature
- `POST /api/auth/verify` — Verify signature and get JWT

#### Listings
- `GET /api/listings` — Get all resource listings
- `GET /api/listings/:id` — Get specific listing
- `POST /api/listings` — Create new listing (requires auth)
- `PUT /api/listings/:id` — Update listing (requires auth)
- `DELETE /api/listings/:id` — Delete listing (requires auth)

#### Bookings
- `GET /api/bookings` — Get user's bookings
- `POST /api/bookings` — Create new booking
- `GET /api/bookings/:id` — Get booking details
- `PUT /api/bookings/:id` — Update booking status

For detailed API documentation, see [docs/API.md](docs/API.md)

---

## 🛣 Roadmap

### Phase 1: Foundation ✅
- [x] Project setup and architecture
- [x] Basic smart contracts
- [x] Backend API structure
- [x] Frontend scaffolding

### Phase 2: Core Features 🚧
- [ ] Provider onboarding flow
- [ ] Enhanced listing management
- [ ] Booking system with escrow
- [ ] Payment integration
- [ ] Resource reputation system

### Phase 3: Advanced Features 📋
- [ ] SLA-based smart contracts
- [ ] Automated resource verification
- [ ] Multi-chain deployment (Polygon, Arbitrum)
- [ ] Oracle integration for pricing
- [ ] Dispute resolution mechanism

### Phase 4: Production Ready 🎯
- [ ] Security audits
- [ ] Performance optimization
- [ ] Comprehensive testing
- [ ] Documentation completion
- [ ] Mainnet deployment

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```

4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```

5. **Open a Pull Request**

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation changes
- `style:` — Code style changes
- `refactor:` — Code refactoring
- `test:` — Test updates
- `chore:` — Build process or auxiliary tool changes

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Vishal Nandy**  
Full Stack Developer | Web3 & Backend Enthusiast

- **GitHub**: [@VishalNandy17](https://github.com/VishalNandy17)
- **Portfolio**: [vishal-phi.vercel.app](https://vishal-phi.vercel.app)
- **LinkedIn**: [vishal-nandy](https://linkedin.com/in/vishal-nandy-7a04a427b)

---

## 🙏 Acknowledgments

- OpenZeppelin for secure smart contract libraries
- Hardhat team for excellent development tools
- Ethereum community for Web3 standards
- All contributors and supporters of this project

---

## 📞 Support

If you have any questions or need help, feel free to:
- Open an issue on GitHub
- Reach out via LinkedIn
- Email: [Your email if you want to add]

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with ❤️ by Vishal Nandy

</div>
