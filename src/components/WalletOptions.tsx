import React from 'react';

interface WalletOptionsProps {
    selectedNetwork: string;
    onWalletSelect: (wallet: string) => void;
}

const wallets = [
    { name: 'MetaMask', id: 'metamask' },
    { name: 'Coinbase Wallet', id: 'coinbase' },
    { name: 'WalletConnect', id: 'walletconnect' },
    { name: 'Fortmatic', id: 'fortmatic' },
    { name: 'Trust Wallet ', id: 'Trust Wallet ' },
];

const WalletOptions: React.FC<WalletOptionsProps> = ({ selectedNetwork, onWalletSelect }) => {
    return (
        <div style={{ padding: 24 }}>
            <h2 style={{ marginBottom: 16 }}>Select a Wallet for <span style={{ color: '#0070f3' }}>{selectedNetwork}</span></h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {wallets.map(wallet => (
                    <li key={wallet.id} style={{ marginBottom: 12 }}>
                        <button
                            style={{
                                padding: '12px 24px',
                                borderRadius: 8,
                                border: '1px solid #0070f3',
                                background: '#fff',
                                color: '#0070f3',
                                fontWeight: 600,
                                cursor: 'pointer',
                                width: '100%',
                                textAlign: 'left'
                            }}
                            onClick={() => onWalletSelect(wallet.id)}
                        >
                            {wallet.name}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default WalletOptions;