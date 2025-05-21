import { ethers } from 'ethers';
import { logger } from './logger';
import { resetLibrary } from './web3Library';
import { EthereumProvider } from '../types/ethereum';

export type WalletType = 'metamask' | 'coinbase' | 'trust' | 'tokenpocket' | 'brave';

export interface WalletConfig {
  name: string;
  type: WalletType;
  icon: string;
  deepLink?: string;
  mobileDeepLink?: string;
  appStoreLink?: string;
  playStoreLink?: string;
}

const WALLET_CONFIGS: Record<WalletType, WalletConfig> = {
  metamask: {
    name: 'MetaMask',
    type: 'metamask',
    icon: '/wallets/metamask.svg',
    deepLink: 'https://metamask.app.link/dapp/',
    mobileDeepLink: 'https://metamask.app.link/dapp/',
    appStoreLink: 'https://apps.apple.com/app/metamask-blockchain-wallet/id1438144202',
    playStoreLink: 'https://play.google.com/store/apps/details?id=io.metamask'
  },
  coinbase: {
    name: 'Coinbase Wallet',
    type: 'coinbase',
    icon: '/wallets/coinbase.svg',
    deepLink: 'https://wallet.coinbase.com/',
    mobileDeepLink: 'https://wallet.coinbase.com/',
    appStoreLink: 'https://apps.apple.com/app/coinbase-wallet/id1278383455',
    playStoreLink: 'https://play.google.com/store/apps/details?id=org.toshi'
  },
  trust: {
    name: 'Trust Wallet',
    type: 'trust',
    icon: '/wallets/trust.svg',
    deepLink: 'https://link.trustwallet.com/open_url?coin_id=60&url=',
    mobileDeepLink: 'https://link.trustwallet.com/open_url?coin_id=60&url=',
    appStoreLink: 'https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409',
    playStoreLink: 'https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp'
  },
  tokenpocket: {
    name: 'TokenPocket',
    type: 'tokenpocket',
    icon: '/wallets/tokenpocket.svg',
    deepLink: 'https://www.tokenpocket.pro/',
    mobileDeepLink: 'https://www.tokenpocket.pro/',
    appStoreLink: 'https://apps.apple.com/app/tokenpocket/id1438942287',
    playStoreLink: 'https://play.google.com/store/apps/details?id=com.tokenpocket'
  },
  brave: {
    name: 'Brave Wallet',
    type: 'brave',
    icon: '/wallets/brave.svg',
    deepLink: 'https://brave.com/wallet/',
    mobileDeepLink: 'https://brave.com/wallet/',
    appStoreLink: 'https://apps.apple.com/app/brave-browser/id1052879175',
    playStoreLink: 'https://play.google.com/store/apps/details?id=com.brave.browser'
  }
};

export class WalletManager {
  private static instance: WalletManager;
  private isMobile: boolean;
  private isIOS: boolean;
  private isAndroid: boolean;

  private constructor() {
    const ua = navigator.userAgent;
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
    this.isIOS = /iPhone|iPad|iPod/i.test(ua);
    this.isAndroid = /Android/i.test(ua);
    logger.info('WalletManager initialized', { 
      isMobile: this.isMobile,
      isIOS: this.isIOS,
      isAndroid: this.isAndroid,
      userAgent: ua
    }, 'WalletManager');
  }

  static getInstance(): WalletManager {
    if (!WalletManager.instance) {
      WalletManager.instance = new WalletManager();
    }
    return WalletManager.instance;
  }

  getAvailableWallets(): WalletConfig[] {
    const wallets: WalletConfig[] = [];
    const ethereum = window.ethereum as EthereumProvider;

    logger.info('Checking for available wallets...', {
      hasEthereum: !!ethereum,
      isMobile: this.isMobile,
      isIOS: this.isIOS,
      isAndroid: this.isAndroid,
      userAgent: navigator.userAgent
    }, 'WalletManager');

    if (this.isMobile) {
      // On mobile, we'll show all supported wallets
      Object.values(WALLET_CONFIGS).forEach(wallet => {
        if (this.isIOS && wallet.appStoreLink) {
          wallets.push(wallet);
        } else if (this.isAndroid && wallet.playStoreLink) {
          wallets.push(wallet);
        }
      });
      logger.info('Mobile wallets available:', { wallets }, 'WalletManager');
    } else if (ethereum) {
      // On desktop, check for injected wallets
      if (ethereum.isMetaMask) wallets.push(WALLET_CONFIGS.metamask);
      if (ethereum.isCoinbaseWallet) wallets.push(WALLET_CONFIGS.coinbase);
      if (ethereum.isTrust) wallets.push(WALLET_CONFIGS.trust);
      if (ethereum.isTokenPocket) wallets.push(WALLET_CONFIGS.tokenpocket);
      if (ethereum.isBraveWallet) wallets.push(WALLET_CONFIGS.brave);
      logger.info('Desktop wallets detected:', { wallets }, 'WalletManager');
    }

    return wallets;
  }

  async connectWallet(walletType: WalletType): Promise<ethers.providers.Web3Provider> {
    const config = WALLET_CONFIGS[walletType];
    
    if (this.isMobile) {
      if (!window.ethereum) {
        // Handle mobile deep linking
        const currentUrl = window.location.href;
        const deepLink = config.mobileDeepLink + encodeURIComponent(currentUrl);
        
        logger.info(`Redirecting to ${walletType} app`, { 
          deepLink,
          platform: this.isIOS ? 'iOS' : 'Android',
          storeLink: this.isIOS ? config.appStoreLink : config.playStoreLink
        }, 'WalletManager');

        // Try to open the wallet app
        window.location.href = deepLink;

        // If the wallet app doesn't open within 2 seconds, redirect to app store
        setTimeout(() => {
          const storeLink = this.isIOS ? config.appStoreLink : config.playStoreLink;
          if (storeLink) {
            window.location.href = storeLink;
          }
        }, 2000);

        throw new Error(`Please install ${config.name} app`);
      }
    }

    try {
      if (!window.ethereum) {
        throw new Error('No Ethereum provider found');
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      logger.info(`Connected to ${walletType}`, { 
        address: await provider.getSigner().getAddress(),
        isMobile: this.isMobile
      }, 'WalletManager');
      
      return provider;
    } catch (error) {
      logger.error(`Failed to connect to ${walletType}`, error, 'WalletManager');
      throw error;
    }
  }

  async disconnectWallet(): Promise<void> {
    try {
      if (window.ethereum?.disconnect) {
        await window.ethereum.disconnect();
      }
      resetLibrary();
      logger.info('Wallet disconnected successfully', null, 'WalletManager');
    } catch (error) {
      logger.error('Error disconnecting wallet:', error, 'WalletManager');
      throw error;
    }
  }

  async switchNetwork(chainId: number) {
    try {
      if (!window.ethereum) throw new Error('No Ethereum provider found');

      const chainIdHex = `0x${chainId.toString(16)}`;
      logger.info(`Attempting to switch to network ${chainId}`, { chainIdHex }, 'WalletManager');

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });

      logger.info(`Successfully switched to network ${chainId}`, null, 'WalletManager');
    } catch (error: any) {
      logger.error(`Failed to switch network to ${chainId}`, error, 'WalletManager');
      
      if (error.code === 4902) {
        logger.info(`Network ${chainId} not found, attempting to add it`, null, 'WalletManager');
        // Handle adding new network here if needed
      }
      throw error;
    }
  }
}

export const walletManager = WalletManager.getInstance(); 