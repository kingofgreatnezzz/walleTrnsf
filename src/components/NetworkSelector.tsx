import React, { useState } from 'react';

const NetworkSelector: React.FC<{ onNetworkSelect: (network: string) => void }> = ({ onNetworkSelect }) => {
    const [selectedNetwork, setSelectedNetwork] = useState<string>('Ethereum');

    const networks = ['Ethereum', 'Bitcoin', 'Binance Smart Chain', 'Polygon'];

    const handleNetworkChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const network = event.target.value;
        setSelectedNetwork(network);
        onNetworkSelect(network);
    };

    return (
        <div>
            <label htmlFor="network-select" className="block text-sm font-medium text-gray-700">
                Select Network
            </label>
            <select
                id="network-select"
                value={selectedNetwork}
                onChange={handleNetworkChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50"
            >
                {networks.map((network) => (
                    <option key={network} value={network}>
                        {network}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default NetworkSelector;