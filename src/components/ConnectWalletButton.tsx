import React from 'react';

interface ConnectWalletButtonProps {
    onConnect: () => void;
    isConnected: boolean;
}

const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({ onConnect, isConnected }) => {
    return (
        <button
            onClick={onConnect}
            className={`cursor-pointer rounded-md mb-4 text-white border-2 w-2/3 font-semibold text-center py-3 ${isConnected ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'}`}
        >
            {isConnected ? 'Wallet Connected' : 'Connect Wallet'}
        </button>
    );
};

export default ConnectWalletButton;