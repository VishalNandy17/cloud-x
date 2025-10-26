import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

interface Web3State {
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.providers.JsonRpcSigner | null;
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
}

export function useWeb3() {
  const [web3State, setWeb3State] = useState<Web3State>({
    provider: null,
    signer: null,
    account: null,
    chainId: null,
    isConnected: false,
  });

  useEffect(() => {
    initializeWeb3();
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const initializeWeb3 = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const accounts = await provider.listAccounts();
        const network = await provider.getNetwork();

        if (accounts.length > 0) {
          setWeb3State({
            provider,
            signer,
            account: accounts[0],
            chainId: network.chainId,
            isConnected: true,
          });
        }
      } catch (error) {
        console.error('Error initializing web3:', error);
      }
    }
  };

  const connect = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        await initializeWeb3();
      } catch (error) {
        console.error('Error connecting to wallet:', error);
      }
    } else {
      console.error('Please install MetaMask');
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length > 0) {
      initializeWeb3();
    } else {
      setWeb3State({
        provider: null,
        signer: null,
        account: null,
        chainId: null,
        isConnected: false,
      });
    }
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  return {
    ...web3State,
    connect,
  };
}

// Add ethereum property to the global window object
declare global {
  interface Window {
    ethereum: any;
  }
}