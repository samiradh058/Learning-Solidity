"use client";

import { useEffect, useState } from 'react';
import { ethers } from 'ethers'; 

declare global {
  interface Window {
    ethereum?: any;
  }
}

const ConnectMetaMask = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [network, setNetwork] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string | null>(null);

  useEffect(() => {
    checkMetaMaskAvailability();
  }, []);

  const checkMetaMaskAvailability = () => {
    if (typeof window !== 'undefined') {
      setDebug(`Window detected: ${typeof window.ethereum !== 'undefined' ? 'ethereum object exists' : 'NO ethereum object'}`);
      
      if (window.ethereum) {
        window.ethereum.on('accountsChanged', handleAccountChange);
        window.ethereum.on('chainChanged', handleChainChange);
        
        // Try to get accounts to see if already connected
        window.ethereum.request({ method: 'eth_accounts' })
          .then((accounts: string[]) => {
            if (accounts && accounts.length > 0) {
              handleAccountChange(accounts);
              setDebug(prev => `${prev}\nAlready connected with: ${accounts[0]}`);
            }
          })
          .catch((err: any) => {
            setDebug(prev => `${prev}\nError checking accounts: ${err.message}`);
          });
      } else {
        setError('Please install MetaMask!');
      }
    } else {
      setDebug('Window is undefined. Running in SSR mode?');
    }
  };

  const handleAccountChange = (accounts: string[]) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      setIsConnected(true);
      setDebug(prev => `${prev}\nAccount changed to: ${accounts[0]}`);
    } else {
      setIsConnected(false);
      setAccount(null);
      setDebug(prev => `${prev}\nAccount disconnected`);
    }
  };

  const handleChainChange = (chainId: string) => {
    setNetwork(chainId);
    setDebug(prev => `${prev}\nChain changed to: ${chainId}`);
  };

  const connectWallet = async () => {
    setDebug('Attempting to connect wallet...');
    
    if (typeof window === 'undefined') {
      setError('Cannot connect: Running in server-side rendering');
      return;
    }
    
    if (!window.ethereum) {
      setError('MetaMask is not installed! Please install MetaMask first.');
      return;
    }
    
    try {
      setDebug(prev => `${prev}\nRequesting accounts...`);
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      setDebug(prev => `${prev}\nAccounts received: ${accounts?.length || 0}`);
      
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        
        // Create a BrowserProvider
        try {
          setDebug(prev => `${prev}\nCreating BrowserProvider...`);
          const ethProvider = new ethers.BrowserProvider(window.ethereum);
          setProvider(ethProvider);
          setDebug(prev => `${prev}\nProvider created successfully`);
        } catch (providerErr: any) {
          setDebug(prev => `${prev}\nProvider error: ${providerErr.message}`);
          setError(`Error creating provider: ${providerErr.message}`);
        }
      } else {
        setError('No accounts found or user denied access');
      }
    } catch (err: any) {
      console.error('Error connecting to MetaMask:', err);
      setError(`MetaMask connection error: ${err.message}`);
      setDebug(prev => `${prev}\nConnection error: ${err.message}\n${JSON.stringify(err)}`);
    }
  };

  const applyAsCandidate = async (name: string) => {
    if (!account) {
      setError("Please connect your wallet first.");
      return;
    }

    setDebug(`Applying as candidate: ${name}...`);
    
    try {
      const contractAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
      const contractABI = [
        'function applyAsCandidate(string memory name) public'
      ];

      setDebug(prev => `${prev}\nGetting signer...`);
      const signer = await provider.getSigner();
      
      setDebug(prev => `${prev}\nCreating contract instance...`);
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      setDebug(prev => `${prev}\nSending transaction...`);
      const tx = await contract.applyAsCandidate(name);
      
      setDebug(prev => `${prev}\nWaiting for confirmation...`);
      await tx.wait();
      
      setDebug(prev => `${prev}\nTransaction confirmed!`);
      setError(null);
    } catch (error: any) {
      console.error('Error applying as candidate:', error);
      
      // Extract the revert reason if available
      const revertReason = error.reason || 
        (error.data ? `Contract error: ${error.data.slice(0, 100)}...` : null) ||
        `Transaction error: ${error.message}`;
      
      setError(revertReason);
      setDebug(prev => `${prev}\nTransaction error: ${JSON.stringify(error)}`);
    }
  };

  return (
    <div>
      <h1>MetaMask Integration</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!isConnected ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <div>
          <p>Connected Account: {account}</p>
          <button onClick={() => applyAsCandidate('Samir')}>Apply as Candidate</button>
        </div>
      )}
      
      {/* Debug information - can be removed in production */}
      <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
        <h3>Debug Info:</h3>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{debug}</pre>
      </div>
    </div>
  );
};

export default ConnectMetaMask;