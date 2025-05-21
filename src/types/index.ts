export interface Network {
    name: string;
    chainId: number;
    rpcUrl: string;
    blockExplorerUrl: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
}

export interface Wallet {
    name: string;
    icon: string;
    type: 'injected' | 'walletconnect' | 'coinbase';
}

export interface TransferRequest {
    fromWalletId: string;
    toWalletId: string;
    amount: number;
    networkId: string;
}

export interface Transaction {
    hash: string;
    status: 'pending' | 'success' | 'failed';
    from: string;
    to: string;
    value: string;
    timestamp: number;
}