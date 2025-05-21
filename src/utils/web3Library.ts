import { ethers } from 'ethers';
import type { Web3Provider } from '@ethersproject/providers';
import { BigNumber } from '@ethersproject/bignumber';

// Define a type that includes the utils property
type ExtendedWeb3Provider = Web3Provider & {
  utils: {
    formatEther: (wei: BigNumber) => string;
    parseEther: (ether: string) => BigNumber;
  };
};

let libraryInstance: ExtendedWeb3Provider | null = null;
let isInitializing = false;
let initializationPromise: Promise<void> | null = null;

export const initializeLibrary = async (provider: any): Promise<ExtendedWeb3Provider> => {
  // If we already have a library instance, return it
  if (libraryInstance) {
    return libraryInstance;
  }

  // If we're already initializing, wait for that to complete
  if (isInitializing && initializationPromise) {
    await initializationPromise;
    return libraryInstance!;
  }

  // Start initialization
  isInitializing = true;
  initializationPromise = new Promise(async (resolve, reject) => {
    try {
      console.log('Initializing Web3 library...');
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      
      // Add utils to the provider
      const extendedProvider = provider as ExtendedWeb3Provider;
      extendedProvider.utils = {
        formatEther: (wei: BigNumber) => ethers.utils.formatEther(wei),
        parseEther: (ether: string) => ethers.utils.parseEther(ether)
      };
      
      libraryInstance = extendedProvider;
      
      // Wait for the provider to be ready
      let retryCount = 0;
      const maxRetries = 10;
      
      while (retryCount < maxRetries) {
        try {
          // Try to get the network to check if provider is ready
          await libraryInstance.getNetwork();
          console.log('Web3 library initialized successfully');
          resolve();
          return;
        } catch (error) {
          console.log(`Waiting for provider to be ready (attempt ${retryCount + 1}/${maxRetries})...`);
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(r => setTimeout(r, 2000));
          }
        }
      }
      
      throw new Error('Provider failed to initialize after maximum retries');
    } catch (error) {
      console.error('Error initializing Web3 library:', error);
      libraryInstance = null;
      reject(error);
    } finally {
      isInitializing = false;
      initializationPromise = null;
    }
  });

  await initializationPromise;
  return libraryInstance!;
};

export const getLibrary = (): ExtendedWeb3Provider | null => {
  return libraryInstance;
};

export const resetLibrary = () => {
  libraryInstance = null;
  isInitializing = false;
  initializationPromise = null;
}; 