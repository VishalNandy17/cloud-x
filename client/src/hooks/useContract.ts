import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from './useWeb3';
import ResourceMarketplace from '../contracts/ResourceMarketplace.json';
import EscrowManager from '../contracts/EscrowManager.json';
import SLAEnforcement from '../contracts/SLAEnforcement.json';
import DCXToken from '../contracts/DCXToken.json';

const contractAddresses = {
  ResourceMarketplace: process.env.NEXT_PUBLIC_RESOURCE_MARKETPLACE_ADDRESS,
  EscrowManager: process.env.NEXT_PUBLIC_ESCROW_MANAGER_ADDRESS,
  SLAEnforcement: process.env.NEXT_PUBLIC_SLA_ENFORCEMENT_ADDRESS,
  DCXToken: process.env.NEXT_PUBLIC_DCX_TOKEN_ADDRESS,
};

const contractABIs = {
  ResourceMarketplace,
  EscrowManager,
  SLAEnforcement,
  DCXToken,
};

type ContractNames = keyof typeof contractAddresses;

interface ContractState {
  contract: ethers.Contract | null;
  isLoading: boolean;
  error: Error | null;
}

export function useContract(contractName: ContractNames) {
  const { provider, signer } = useWeb3();
  const [state, setState] = useState<ContractState>({
    contract: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const initializeContract = async () => {
      if (!provider || !signer) {
        setState({
          contract: null,
          isLoading: false,
          error: new Error('Web3 not initialized'),
        });
        return;
      }

      try {
        const address = contractAddresses[contractName];
        const abi = contractABIs[contractName].abi;

        if (!address) {
          throw new Error(`Contract address not found for ${contractName}`);
        }

        const contract = new ethers.Contract(address, abi, signer);

        setState({
          contract,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error(`Error initializing ${contractName} contract:`, error);
        setState({
          contract: null,
          isLoading: false,
          error: error as Error,
        });
      }
    };

    initializeContract();
  }, [provider, signer, contractName]);

  return state;
}