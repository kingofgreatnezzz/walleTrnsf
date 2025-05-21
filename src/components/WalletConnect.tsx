import React, { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { InjectedConnector } from '@web3-react/injected-connector';
import { WalletIcon, ArrowPathIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { logger } from '../utils/logger';
import { walletManager, WalletType, WalletConfig } from '../utils/walletManager';
import { getLibrary } from '../utils/web3Library';
import { EthereumProvider } from '../types/ethereum';

// Make this file a module by exporting a type
export type WalletConnectProps = {};

const injected = new InjectedConnector({
  supportedChainIds: [1, 5, 11155111, 137, 80001], // Updated chain IDs
  // 1 = Ethereum Mainnet
  // 5 = Goerli Testnet
  // 11155111 = Sepolia Testnet
  // 137 = Polygon Mainnet
  // 80001 = Polygon Mumbai Testnet
});

const WalletConnect: React.FC<WalletConnectProps> = () => {
  const { active, account, activate, deactivate, library: web3Library, chainId, error } = useWeb3React();
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState<boolean>(false);
  const [isLibraryReady, setIsLibraryReady] = useState<boolean>(false);
  const [availableWallets, setAvailableWallets] = useState<WalletConfig[]>([]);
  const [showWalletOptions, setShowWalletOptions] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);

  // Initialize available wallets with debug logging
  useEffect(() => {
    const initWallets = () => {
      try {
        logger.info('Checking for window.ethereum...', { 
          hasEthereum: !!window.ethereum,
          ethereumType: window.ethereum ? typeof window.ethereum : 'undefined'
        }, 'WalletConnect');
        
        const wallets = walletManager.getAvailableWallets();
        logger.info('Available wallets detected:', { 
          wallets,
          walletCount: wallets.length,
          ethereum: window.ethereum ? {
            isMetaMask: window.ethereum.isMetaMask,
            isCoinbaseWallet: window.ethereum.isCoinbaseWallet,
            isTrust: window.ethereum.isTrust,
            isTokenPocket: window.ethereum.isTokenPocket,
            isBraveWallet: window.ethereum.isBraveWallet
          } : 'no provider'
        }, 'WalletConnect');
        
        setAvailableWallets(wallets);
      } catch (error) {
        logger.error('Error initializing wallets:', error, 'WalletConnect');
      }
    };

    initWallets();
  }, []);

  // Check library initialization
  useEffect(() => {
    const checkLibrary = async () => {
      try {
        const library = getLibrary();
        if (library) {
          logger.info('Using shared library instance', null, 'WalletConnect');
          setIsLibraryReady(true);
        } else {
          logger.info('Waiting for shared library...', null, 'WalletConnect');
          setIsLibraryReady(false);
        }
      } catch (error) {
        logger.error('Error checking library:', error, 'WalletConnect');
        setIsLibraryReady(false);
      }
    };

    checkLibrary();
  }, [web3Library]);

  // Update balance
  useEffect(() => {
    if (active && account && isLibraryReady) {
      const getBalance = async () => {
        try {
          const library = getLibrary();
          if (library) {
            const balance = await library.getBalance(account);
            setBalance(library.utils.formatEther(balance));
            logger.debug('Balance updated', { balance: library.utils.formatEther(balance) }, 'WalletConnect');
          }
        } catch (error) {
          logger.error('Error fetching balance:', error, 'WalletConnect');
          setBalance('0');
        }
      };

      getBalance();
    } else {
      setBalance('0');
    }
  }, [active, account, isLibraryReady]);

  // Detect mobile platform
  useEffect(() => {
    const ua = navigator.userAgent;
    const mobile = /iPhone|iPad|iPod|Android/i.test(ua);
    const ios = /iPhone|iPad|iPod/i.test(ua);
    const android = /Android/i.test(ua);
    
    setIsMobile(mobile);
    setIsIOS(ios);
    setIsAndroid(android);
    
    logger.info('Platform detected', { mobile, ios, android }, 'WalletConnect');
  }, []);

  // Handle wallet connection with mobile support
  const connectWallet = async (walletType: WalletType) => {
    try {
      setLoading(true);
      logger.info(`Starting connection to ${walletType}`, {
        hasEthereum: !!window.ethereum,
        walletType,
        isMobile,
        isIOS,
        isAndroid
      }, 'WalletConnect');

      const provider = await walletManager.connectWallet(walletType);
      
      // On mobile, we might need to wait for the wallet app to open
      if (isMobile && !window.ethereum) {
        toast.loading('Opening wallet app...', { duration: 2000 });
        return; // The page will redirect to the wallet app
      }

      await activate(injected, undefined, true);
      
      logger.info(`Successfully connected to ${walletType}`, { 
        address: await provider.getSigner().getAddress(),
        chainId: await provider.getNetwork().then(n => n.chainId),
        isMobile
      }, 'WalletConnect');
      
      toast.success('Wallet connected successfully!');
      setShowWalletOptions(false);
    } catch (error) {
      logger.error(`Failed to connect to ${walletType}:`, error, 'WalletConnect');
      
      // Handle mobile-specific errors
      if (isMobile && error instanceof Error && error.message.includes('Please install')) {
        const walletName = error.message.split('Please install ')[1].split(' app')[0];
        toast.error(
          <div>
            <p>Please install {walletName} app</p>
            <p className="text-sm mt-1">
              {isIOS ? 'Available on the App Store' : 'Available on Google Play'}
            </p>
          </div>
        );
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to connect wallet');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle wallet disconnection
  const disconnectWallet = async () => {
    try {
      await walletManager.disconnectWallet();
      deactivate();
      toast.success('Wallet disconnected');
      logger.info('Wallet disconnected successfully', null, 'WalletConnect');
    } catch (error) {
      logger.error('Error disconnecting wallet:', error, 'WalletConnect');
      toast.error('Failed to disconnect wallet');
    }
  };

  // Copy address to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Address copied to clipboard!');
    logger.debug('Address copied to clipboard', { address: text }, 'WalletConnect');
  };

  // Debug logging
  useEffect(() => {
    logger.debug('Wallet status updated', {
      isActive: active,
      account,
      hasLibrary: !!web3Library,
      isLibraryReady,
      chainId,
      error,
      network: chainId === 1 ? 'Ethereum Mainnet' :
               chainId === 5 ? 'Goerli Testnet' :
               chainId === 11155111 ? 'Sepolia Testnet' :
               `Chain ID: ${chainId}`
    }, 'WalletConnect');
  }, [active, account, web3Library, isLibraryReady, chainId, error]);

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden md:max-w-2xl p-6">
      <div className="space-y-4">
        {!active ? (
          <>
            <button
              onClick={() => {
                logger.info('Connect wallet button clicked', {
                  hasEthereum: !!window.ethereum,
                  availableWallets,
                  isMobile,
                  isIOS,
                  isAndroid
                }, 'WalletConnect');
                setShowWalletOptions(true);
              }}
              disabled={loading}
              className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 animate-spin mr-2" />
                  {isMobile ? 'Opening Wallet...' : 'Connecting...'}
                </>
              ) : (
                <>
                  <WalletIcon className="h-5 w-5 mr-2" />
                  Connect Wallet
                </>
              )}
            </button>

            {showWalletOptions && (
              <div className="mt-4 space-y-2">
                {availableWallets.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 mb-2">
                      {isMobile 
                        ? 'No wallet apps detected on your device'
                        : 'No wallet extensions detected in your browser'}
                    </p>
                    {isMobile && (
                      <p className="text-sm text-gray-400">
                        Please install a supported wallet app from the {isIOS ? 'App Store' : 'Google Play Store'}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-500 mb-2">
                      {isMobile 
                        ? 'Select a wallet app to connect'
                        : 'Select a wallet extension to connect'}
                    </p>
                    {availableWallets.map((wallet: WalletConfig) => (
                      <button
                        key={wallet.type}
                        onClick={() => connectWallet(wallet.type)}
                        className="w-full flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <img src={wallet.icon} alt={wallet.name} className="w-6 h-6 mr-2" />
                        <div className="flex-1 text-left">
                          <p className="font-medium">{wallet.name}</p>
                          {isMobile && (
                            <p className="text-xs text-gray-500">
                              {isIOS ? 'Open in App Store' : 'Open in Play Store'}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </>
        ) : !isLibraryReady ? (
          <div className="text-center py-4">
            <ArrowPathIcon className="h-5 w-5 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Initializing wallet connection...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Connected Account</p>
              <div className="flex items-center justify-between">
                <p className="text-lg font-medium text-gray-900 break-all">
                  {account}
                </p>
                <button
                  onClick={() => copyToClipboard(account || '')}
                  className="ml-2 p-1 text-gray-500 hover:text-gray-700"
                  title="Copy address"
                >
                  <DocumentDuplicateIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Network</p>
              <p className="text-lg font-medium text-gray-900">
                {chainId === 1 ? 'Ethereum Mainnet' :
                 chainId === 5 ? 'Goerli Testnet' :
                 chainId === 11155111 ? 'Sepolia Testnet' :
                 `Chain ID: ${chainId}`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletConnect; 