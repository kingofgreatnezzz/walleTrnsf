export interface EthereumProvider {
  isMetaMask?: boolean;
  isTrust?: boolean;
  isCoinbaseWallet?: boolean;
  isTokenPocket?: boolean;
  isBraveWallet?: boolean;
  selectedAddress?: string;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (eventName: string, handler: (...args: any[]) => void) => void;
  removeListener: (eventName: string, handler: (...args: any[]) => void) => void;
  networkVersion: string;
  chainId: string;
  disconnect?: () => Promise<void>;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
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