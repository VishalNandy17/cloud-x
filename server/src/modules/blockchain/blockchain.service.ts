import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contracts: Map<string, ethers.Contract> = new Map();

  constructor(private configService: ConfigService) {
    this.initializeProvider();
    this.loadContracts();
  }

  private initializeProvider() {
    const rpcUrl = this.configService.get<string>('ETHEREUM_RPC_URL');
    const privateKey = this.configService.get<string>('PRIVATE_KEY');

    if (!rpcUrl || !privateKey) {
      this.logger.error('Missing Ethereum RPC URL or private key');
      return;
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    
    this.logger.log(`Connected to Ethereum network: ${rpcUrl}`);
    this.logger.log(`Wallet address: ${this.wallet.address}`);
  }

  private loadContracts() {
    try {
      const deploymentsPath = path.join(process.cwd(), 'contracts', 'deployments.json');
      const deployments = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));

      // Load contract ABIs
      const contractABIs = {
        ResourceMarketplace: require('../../contracts/artifacts/contracts/core/ResourceMarketplace.sol/ResourceMarketplace.json'),
        EscrowManager: require('../../contracts/artifacts/contracts/core/EscrowManager.sol/EscrowManager.json'),
        SLAEnforcement: require('../../contracts/artifacts/contracts/core/SLAEnforcement.sol/SLAEnforcement.json'),
        DCXToken: require('../../contracts/artifacts/contracts/tokens/DCXToken.sol/DCXToken.json'),
        PriceOracle: require('../../contracts/artifacts/contracts/oracles/PriceOracle.sol/PriceOracle.json'),
        ResourceVerifier: require('../../contracts/artifacts/contracts/oracles/ResourceVerifier.sol/ResourceVerifier.json'),
        ReputationSystem: require('../../contracts/artifacts/contracts/core/ReputationSystem.sol/ReputationSystem.json'),
      };

      // Initialize contracts
      Object.keys(contractABIs).forEach(contractName => {
        const address = deployments[contractName.toLowerCase()];
        if (address) {
          const contract = new ethers.Contract(
            address,
            contractABIs[contractName].abi,
            this.wallet
          );
          this.contracts.set(contractName, contract);
          this.logger.log(`Loaded ${contractName} contract at ${address}`);
        }
      });
    } catch (error) {
      this.logger.error('Failed to load contracts:', error);
    }
  }

  async getContract(contractName: string): Promise<ethers.Contract> {
    const contract = this.contracts.get(contractName);
    if (!contract) {
      throw new Error(`Contract ${contractName} not found`);
    }
    return contract;
  }

  async listResource(
    resourceType: string,
    cpu: number,
    ram: number,
    storage: number,
    pricePerHour: string,
    metadata: string
  ): Promise<number> {
    try {
      const marketplace = await this.getContract('ResourceMarketplace');
      const tx = await marketplace.listResource(
        resourceType,
        cpu,
        ram,
        storage,
        ethers.parseEther(pricePerHour),
        metadata
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          const parsed = marketplace.interface.parseLog(log);
          return parsed.name === 'ResourceListed';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = marketplace.interface.parseLog(event);
        return Number(parsed.args.resourceId);
      }

      throw new Error('ResourceListed event not found');
    } catch (error) {
      this.logger.error('Failed to list resource:', error);
      throw error;
    }
  }

  async bookResource(resourceId: number, duration: number, consumer: string): Promise<number> {
    try {
      const marketplace = await this.getContract('ResourceMarketplace');
      
      // Get resource details to calculate cost
      const resource = await marketplace.getResource(resourceId);
      const totalCost = resource.pricePerHour * BigInt(duration);
      
      const tx = await marketplace.bookResource(resourceId, duration, {
        value: totalCost
      });
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          const parsed = marketplace.interface.parseLog(log);
          return parsed.name === 'ResourceBooked';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = marketplace.interface.parseLog(event);
        return Number(parsed.args.resourceId);
      }

      throw new Error('ResourceBooked event not found');
    } catch (error) {
      this.logger.error('Failed to book resource:', error);
      throw error;
    }
  }

  async createEscrow(
    provider: string,
    consumer: string,
    amount: string,
    duration: number
  ): Promise<number> {
    try {
      const escrowManager = await this.getContract('EscrowManager');
      const tx = await escrowManager.createEscrow(provider, duration, {
        value: ethers.parseEther(amount)
      });
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          const parsed = escrowManager.interface.parseLog(log);
          return parsed.name === 'EscrowCreated';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = escrowManager.interface.parseLog(event);
        return Number(parsed.args.escrowId);
      }

      throw new Error('EscrowCreated event not found');
    } catch (error) {
      this.logger.error('Failed to create escrow:', error);
      throw error;
    }
  }

  async releaseEscrow(escrowId: number): Promise<void> {
    try {
      const escrowManager = await this.getContract('EscrowManager');
      const tx = await escrowManager.releaseEscrow(escrowId);
      await tx.wait();
      this.logger.log(`Escrow ${escrowId} released successfully`);
    } catch (error) {
      this.logger.error('Failed to release escrow:', error);
      throw error;
    }
  }

  async refundEscrow(escrowId: number): Promise<void> {
    try {
      const escrowManager = await this.getContract('EscrowManager');
      const tx = await escrowManager.refundEscrow(escrowId);
      await tx.wait();
      this.logger.log(`Escrow ${escrowId} refunded successfully`);
    } catch (error) {
      this.logger.error('Failed to refund escrow:', error);
      throw error;
    }
  }

  async reportSLAViolation(resourceId: number, violationType: string): Promise<void> {
    try {
      const slaEnforcement = await this.getContract('SLAEnforcement');
      
      // Find SLA ID for the resource
      // This would need to be implemented based on your SLA creation logic
      const slaId = await this.findSLAIdByResourceId(resourceId);
      
      if (slaId) {
        const tx = await slaEnforcement.recordViolation(slaId, violationType, 0);
        await tx.wait();
        this.logger.log(`SLA violation reported for resource ${resourceId}`);
      }
    } catch (error) {
      this.logger.error('Failed to report SLA violation:', error);
      throw error;
    }
  }

  async updateReputation(userAddress: string, change: number): Promise<void> {
    try {
      const reputationSystem = await this.getContract('ReputationSystem');
      
      if (change > 0) {
        await reputationSystem.recordSuccessfulTransaction(userAddress);
      } else {
        await reputationSystem.recordFailedTransaction(userAddress);
      }
      
      this.logger.log(`Reputation updated for user ${userAddress}: ${change}`);
    } catch (error) {
      this.logger.error('Failed to update reputation:', error);
      throw error;
    }
  }

  async submitResourceMetrics(
    resourceId: number,
    cpuUsage: number,
    memoryUsage: number,
    diskUsage: number,
    networkLatency: number,
    uptime: number,
    isOnline: boolean
  ): Promise<void> {
    try {
      const resourceVerifier = await this.getContract('ResourceVerifier');
      const tx = await resourceVerifier.submitMetrics(
        resourceId,
        cpuUsage,
        memoryUsage,
        diskUsage,
        networkLatency,
        uptime,
        isOnline
      );
      await tx.wait();
      this.logger.log(`Metrics submitted for resource ${resourceId}`);
    } catch (error) {
      this.logger.error('Failed to submit resource metrics:', error);
      throw error;
    }
  }

  async getResourceDetails(resourceId: number): Promise<any> {
    try {
      const marketplace = await this.getContract('ResourceMarketplace');
      const resource = await marketplace.getResource(resourceId);
      
      return {
        provider: resource.provider,
        resourceType: resource.resourceType,
        cpu: Number(resource.cpu),
        ram: Number(resource.ram),
        storage: Number(resource.storage),
        pricePerHour: ethers.formatEther(resource.pricePerHour),
        isActive: resource.isActive,
        reputation: Number(resource.reputation),
      };
    } catch (error) {
      this.logger.error('Failed to get resource details:', error);
      throw error;
    }
  }

  async getEscrowDetails(escrowId: number): Promise<any> {
    try {
      const escrowManager = await this.getContract('EscrowManager');
      const escrow = await escrowManager.getEscrow(escrowId);
      
      return {
        consumer: escrow.consumer,
        provider: escrow.provider,
        amount: ethers.formatEther(escrow.amount),
        startTime: new Date(Number(escrow.startTime) * 1000),
        duration: Number(escrow.duration),
        isReleased: escrow.isReleased,
        isRefunded: escrow.isRefunded,
      };
    } catch (error) {
      this.logger.error('Failed to get escrow details:', error);
      throw error;
    }
  }

  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      this.logger.error('Failed to get balance:', error);
      throw error;
    }
  }

  async getTransactionReceipt(txHash: string): Promise<any> {
    try {
      return await this.provider.getTransactionReceipt(txHash);
    } catch (error) {
      this.logger.error('Failed to get transaction receipt:', error);
      throw error;
    }
  }

  private async findSLAIdByResourceId(resourceId: number): Promise<number | null> {
    try {
      const slaEnforcement = await this.getContract('SLAEnforcement');
      // This is a simplified implementation
      // In practice, you'd need to track SLA IDs for each resource
      return 1; // Placeholder
    } catch (error) {
      this.logger.error('Failed to find SLA ID:', error);
      return null;
    }
  }

  async getNetworkInfo(): Promise<any> {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const gasPrice = await this.provider.getGasPrice();
      
      return {
        name: network.name,
        chainId: Number(network.chainId),
        blockNumber,
        gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
      };
    } catch (error) {
      this.logger.error('Failed to get network info:', error);
      throw error;
    }
  }
}
