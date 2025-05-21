import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import WalletConnect from '../components/WalletConnect';
import TransferFunds from '../components/TransferFunds';
import { SUPPORTED_NETWORKS } from '../config/networks';
import { Network } from '../types';

const App: React.FC = () => {
  const [selectedNetwork, setSelectedNetwork] = useState<Network>(SUPPORTED_NETWORKS[0]);

  useEffect(() => {
    console.log('App component mounted');
    console.log('Available networks:', SUPPORTED_NETWORKS);
  }, []);

  console.log('App component rendering');

    return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600">
            Wallet Transfer
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Connect your wallet and transfer funds securely
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Select Network</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {SUPPORTED_NETWORKS.map((network) => (
                <button
                  key={network.chainId}
                  onClick={() => {
                    console.log('Network selected:', network.name);
                    setSelectedNetwork(network);
                  }}
                  className={`relative rounded-lg border p-4 flex flex-col items-center ${
                    selectedNetwork.chainId === network.chainId
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <span className="text-sm font-medium text-gray-900">{network.name}</span>
                  <span className="mt-1 text-xs text-gray-500">{network.nativeCurrency.symbol}</span>
                  {selectedNetwork.chainId === network.chainId && (
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary-500" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 space-y-6">
            <WalletConnect />
            <TransferFunds />
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Supported Networks: Ethereum, BSC, Polygon, Avalanche</p>
          <p className="mt-2">Make sure you're on the correct network before transferring funds</p>
        </div>
      </div>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: 'white',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: 'white',
            },
          },
        }}
      />
        </div>
    );
};

export default App;