import { Web3Provider } from '@ethersproject/providers';
import { BigNumber } from '@ethersproject/bignumber';

// Ethereum provider type definitions
export interface EthereumProvider {
  isMetaMask?: boolean;
  isTrust?: boolean;
  isCoinbaseWallet?: boolean;
  isTokenPocket?: boolean;
  isBraveWallet?: boolean;
  selectedAddress?: string;
  networkVersion: string;
  chainId: string;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (eventName: string, handler: (...args: any[]) => void) => void;
  removeListener: (eventName: string, handler: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

// Extend the Web3Provider type to include utils
declare module '@ethersproject/providers' {
  interface Web3Provider {
    utils: {
      formatEther: (wei: BigNumber) => string;
      parseEther: (ether: string) => BigNumber;
    };
  }
}

// Make the file a module
export {}; 