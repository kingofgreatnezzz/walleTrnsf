import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './pages/App';
import { Web3ReactProvider } from '@web3-react/core';
import { initializeLibrary } from './utils/web3Library';

function getLibrary(provider: any) {
  return initializeLibrary(provider);
}

ReactDOM.render(
  <React.StrictMode>
    <Web3ReactProvider getLibrary={getLibrary}>
      <App />
    </Web3ReactProvider>
  </React.StrictMode>,
  document.getElementById('root')
);