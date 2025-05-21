import { ethers } from 'ethers';
import { Wallet, Network } from '../types';
import { SUPPORTED_NETWORKS, getNetworkByChainId } from '../config/networks';
import type { EthereumProvider } from '../types/ethereum';
import { logger } from './logger';

// Enhanced type definitions for different wallet providers
declare global {
  interface Window {
    ethereum?: EthereumProvider;  // Use the shared type
    trustwallet?: {
      ethereum: any;
    };
    coinbaseWalletExtension?: {
      ethereum: any;
    };
    tokenpocket?: {
      ethereum: any;
    };
    braveSolana?: any;
  }
}

// Detect available wallet providers
export const detectWalletProvider = (): string[] => {
  const providers: string[] = [];
  
  if (window.ethereum) {
    if (window.ethereum.isMetaMask) providers.push('MetaMask');
    if (window.ethereum.isTrust) providers.push('Trust Wallet');
    if (window.ethereum.isCoinbaseWallet) providers.push('Coinbase Wallet');
    if (window.ethereum.isTokenPocket) providers.push('TokenPocket');
    if (window.ethereum.isBraveWallet) providers.push('Brave Wallet');
  }
  
  // Check for mobile wallet providers
  if (window.trustwallet) providers.push('Trust Wallet');
  if (window.coinbaseWalletExtension) providers.push('Coinbase Wallet');
  if (window.tokenpocket) providers.push('TokenPocket');
  
  // Check for mobile deep linking
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    providers.push('WalletConnect');
    providers.push('Rainbow');
    providers.push('Argent');
  }

  return providers;
};

export const connectWallet = async (wallet: Wallet): Promise<void> => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const providers = detectWalletProvider();

  if (providers.length === 0) {
    if (isMobile) {
      // For mobile devices, provide deep linking options
      const walletLinks = {
        MetaMask: 'https://metamask.app.link/dapp/' + window.location.hostname,
        TrustWallet: 'https://link.trustwallet.com/open_url?coin_id=60&url=' + window.location.href,
        Coinbase: 'https://wallet.coinbase.com/',
        Rainbow: 'https://rainbow.me/',
        Argent: 'https://argent.xyz/'
      };
      
      throw new Error(`No wallet detected. Please install a wallet app or visit: ${Object.entries(walletLinks).map(([name, link]) => `${name}: ${link}`).join(', ')}`);
    } else {
      throw new Error('No Ethereum provider found. Please install MetaMask or another Web3 wallet.');
    }
  }

  try {
    if (window.ethereum) {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log(`Connected to wallet: ${wallet.name}`);
    } else if (isMobile) {
      // Handle mobile wallet deep linking
      const walletName = wallet.name.toLowerCase();
      if (walletName.includes('metamask')) {
        window.location.href = `https://metamask.app.link/dapp/${window.location.hostname}`;
      } else if (walletName.includes('trust')) {
        window.location.href = `https://link.trustwallet.com/open_url?coin_id=60&url=${window.location.href}`;
      }
      // Add more mobile wallet deep links as needed
    }
  } catch (error) {
    console.error('Error connecting to wallet:', error);
    throw error;
  }
};

export const getProvider = (): ethers.providers.Web3Provider | null => {
  if (typeof window === 'undefined' || !window.ethereum) {
    logger.warn('No Ethereum provider found', null, 'walletHelpers');
    return null;
  }

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum as EthereumProvider);
    logger.info('Provider initialized successfully', null, 'walletHelpers');
    return provider;
  } catch (error) {
    logger.error('Error initializing provider:', error, 'walletHelpers');
    return null;
  }
};

export const getSigner = (): ethers.Signer | null => {
  const provider = getProvider();
  if (!provider) {
    logger.warn('Cannot get signer: no provider available', null, 'walletHelpers');
    return null;
  }

  try {
    const signer = provider.getSigner();
    logger.info('Signer obtained successfully', null, 'walletHelpers');
    return signer;
  } catch (error) {
    logger.error('Error getting signer:', error, 'walletHelpers');
    return null;
  }
};

export const getAddress = async (): Promise<string | null> => {
  const signer = getSigner();
  if (!signer) {
    logger.warn('Cannot get address: no signer available', null, 'walletHelpers');
    return null;
  }

  try {
    const address = await signer.getAddress();
    logger.info('Address obtained successfully', { address }, 'walletHelpers');
    return address;
  } catch (error) {
    logger.error('Error getting address:', error, 'walletHelpers');
    return null;
  }
};

export const getBalance = async (address?: string): Promise<string | null> => {
  const provider = getProvider();
  if (!provider) {
    logger.warn('Cannot get balance: no provider available', null, 'walletHelpers');
    return null;
  }

  try {
    const targetAddress = address || await getAddress();
    if (!targetAddress) {
      logger.warn('Cannot get balance: no address available', null, 'walletHelpers');
      return null;
    }

    const balance = await provider.getBalance(targetAddress);
    const formattedBalance = ethers.utils.formatEther(balance);
    logger.info('Balance obtained successfully', { 
      address: targetAddress, 
      balance: formattedBalance 
    }, 'walletHelpers');
    return formattedBalance;
  } catch (error) {
    logger.error('Error getting balance:', error, 'walletHelpers');
    return null;
  }
};

export const getChainId = async (): Promise<number | null> => {
  const provider = getProvider();
  if (!provider) {
    logger.warn('Cannot get chainId: no provider available', null, 'walletHelpers');
    return null;
  }

  try {
    const { chainId } = await provider.getNetwork();
    logger.info('ChainId obtained successfully', { chainId }, 'walletHelpers');
    return chainId;
  } catch (error) {
    logger.error('Error getting chainId:', error, 'walletHelpers');
    return null;
  }
};

export const isWalletConnected = (): boolean => {
  return !!window.ethereum?.selectedAddress;
};

export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const transferFunds = async (
  fromAddress: string, 
  toAddress: string, 
  amount: string, 
  network: Network
): Promise<{ hash: string; status: string }> => {
  try {
    if (!window.ethereum) {
      throw new Error('No wallet provider available');
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    
    // Check if we're on the correct network
    const currentNetwork = await provider.getNetwork();
    const targetNetwork = getNetworkByChainId(network.chainId);
    
    if (!targetNetwork) {
      throw new Error(`Network with chainId ${network.chainId} is not supported`);
    }

    if (currentNetwork.chainId !== targetNetwork.chainId) {
      try {
        // Try to switch network
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${targetNetwork.chainId.toString(16)}` }],
        });
      } catch (switchError: any) {
        // If network doesn't exist, try to add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${targetNetwork.chainId.toString(16)}`,
              chainName: targetNetwork.name,
              nativeCurrency: targetNetwork.nativeCurrency,
              rpcUrls: [targetNetwork.rpcUrl],
              blockExplorerUrls: [targetNetwork.blockExplorerUrl]
            }]
          });
        } else {
          throw switchError;
        }
      }
    }

    const tx = {
      to: toAddress,
      value: ethers.utils.parseEther(amount),
    };

    const transactionResponse = await signer.sendTransaction(tx);
    const receipt = await transactionResponse.wait();

    return {
      hash: receipt.transactionHash,
      status: receipt.status === 1 ? 'success' : 'failed'
    };
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
};

export const getWalletProvider = (): string => {
  const ethereum = window.ethereum as EthereumProvider | undefined;
  if (!ethereum) return 'No Provider';

  if (ethereum.isMetaMask) return 'MetaMask';
  if (ethereum.isTrust) return 'Trust Wallet';
  if (ethereum.isCoinbaseWallet) return 'Coinbase Wallet';
  if (ethereum.isTokenPocket) return 'TokenPocket';
  if (ethereum.isBraveWallet) return 'Brave Wallet';
  return 'Unknown Provider';
};