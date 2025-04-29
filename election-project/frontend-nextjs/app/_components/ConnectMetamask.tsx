"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const ConnectMetaMask = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const [signer, setSigner] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [network, setNetwork] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string | null>(null);

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [candidateName, setCandidateName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [candidates, setCandidates] = useState<
    { id: string; name: string; voteCount: number; approved: boolean }[]
  >([]);

  // const contractAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
  // const contractAddress = '0xe4c89fd9370ea0ba69e1b14a26a99e3c2e12edd5';
  // const contractAddress = '0x5840e74Be8B76266996f65F48aCAa917FC34Fd96';
  // const contractAddress = '0xb2CAeC0aD3552D32EBECA0c794E983801392c2ac';

  const contractAddress = "0xe4c89Fd9370ea0ba69e1b14A26a99e3C2E12EdD5";

  const contractABI = [
    "function applyAsCandidate(string memory name) public",
    "function getCandidate(uint256 candidateId) public view returns (uint256, string memory, uint256, bool)",
    "function nextCandidateId() public view returns (uint256)",
    "function getAllCandidates() public view returns (tuple(uint id, string name, uint voteCount, bool approved)[])",
    "function isCandidate(address) public view returns (bool)",
  ];

  useEffect(() => {
    checkMetaMaskAvailability();
  }, []);

  const checkMetaMaskAvailability = () => {
    if (typeof window !== "undefined") {
      if (window.ethereum) {
        window.ethereum.on("accountsChanged", handleAccountChange);
        window.ethereum.on("chainChanged", handleChainChange);

        window.ethereum
          .request({ method: "eth_accounts" })
          .then((accounts: string[]) => {
            if (accounts && accounts.length > 0) {
              handleAccountChange(accounts);
            }
          })
          .catch((err: any) => {
            setError("Error checking accounts: " + err.message);
          });
      } else {
        setError("Please install MetaMask!");
      }
    }
  };

  const handleAccountChange = async (accounts: string[]) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      setIsConnected(true);

      if (window.ethereum) {
        const ethProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(ethProvider);

        try {
          const signer = await ethProvider.getSigner();
          setSigner(signer);

          // Reset form when account changes
          setCandidateName("");
          setIsFormVisible(false);
          setSuccessMessage(null);

          // Fetch candidates with the new account
          fetchCandidates(ethProvider);

          // Check if connected account is already a candidate
          checkIfCandidate(ethProvider, accounts[0]);
        } catch (err) {
          console.error("Error getting signer:", err);
        }
      }
    } else {
      setIsConnected(false);
      setAccount(null);
      setSigner(null);
      setProvider(null);
    }
  };

  const handleChainChange = (chainId: string) => {
    setDebug(`Chain changed to: ${chainId}`);
    // Reconnect on chain change
    if (window.ethereum) {
      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(ethProvider);
      fetchCandidates(ethProvider);
    }
  };

  const connectWallet = async () => {
    if (typeof window === "undefined") {
      setError("Cannot connect: Running in server-side rendering");
      return;
    }

    if (!window.ethereum) {
      setError("MetaMask is not installed! Please install MetaMask first.");
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);

        const ethProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(ethProvider);

        const signer = await ethProvider.getSigner();
        setSigner(signer);

        // Fetch all candidates
        fetchCandidates(ethProvider);

        // Check if connected account is already a candidate
        checkIfCandidate(ethProvider, accounts[0]);
      } else {
        setError("No accounts found or user denied access");
      }
    } catch (err: any) {
      setError("MetaMask connection error: " + err.message);
    }
  };

  const fetchCandidates = async (ethProvider: any) => {
    if (!ethProvider) return;

    const contract = new ethers.Contract(
      contractAddress,
      contractABI,
      ethProvider
    );

    console.log("Fetching candidates from contract...");

    try {
      console.log("inside try of fetchCandidates");
      const allCandidates = await contract.getAllCandidates();
      console.log("Fetched candidates:", allCandidates);
      setCandidates(allCandidates);
    } catch (error) {
      setError("Error fetching candidates: " + (error as any).message);
    }
  };

  const checkIfCandidate = async (ethProvider: any, address: string) => {
    console.log("eth provider is ", ethProvider);
    console.log("address is ", address);
    if (!ethProvider || !address) return;

    const contract = new ethers.Contract(
      contractAddress,
      contractABI,
      ethProvider
    );

    console.log("Contract is ", contract);

    try {
      const isAlreadyCandidate = await contract.isCandidate(address);
      console.log("isAlreadyCandidate is ", isAlreadyCandidate);
      setIsFormVisible(!isAlreadyCandidate);
    } catch (error) {
      console.error("Error checking candidate status:", error);
      // Default to showing the form if there's an error checking
      setIsFormVisible(true);
    }
  };

  const handleApplyAsCandidate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signer || !candidateName.trim()) {
      setError("Please connect wallet and enter a name");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );

      // Show in debug what's being sent
      setDebug(`Applying as candidate with name: ${candidateName}`);

      const tx = await contract.applyAsCandidate(candidateName);
      setDebug(`Transaction sent: ${tx.hash}`);

      // Wait for transaction to be mined
      await tx.wait();

      setSuccessMessage(
        `Successfully applied as a candidate with name: ${candidateName}`
      );
      setIsFormVisible(false);
      setCandidateName("");

      // Refresh candidate list
      fetchCandidates(provider);
    } catch (error: any) {
      setError(`Error applying as candidate: ${error.message}`);
      console.error("Application error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Blockchain Election System</h1>
      {error && (
        <p className="text-red-500 p-2 bg-red-100 rounded mb-4">{error}</p>
      )}
      {successMessage && (
        <p className="text-green-500 p-2 bg-green-100 rounded mb-4">
          {successMessage}
        </p>
      )}

      {!isConnected ? (
        <button
          onClick={connectWallet}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Connect Wallet
        </button>
      ) : (
        <div>
          <p className="mb-4">
            Connected Account: <span className="font-mono">{account}</span>
          </p>

          {isFormVisible && (
            <div className="bg-gray-100 p-4 rounded-lg mb-6 text-black">
              <h2 className="text-xl font-semibold mb-2">Apply as Candidate</h2>
              <form onSubmit={handleApplyAsCandidate}>
                <div className="mb-4">
                  <label htmlFor="candidateName" className="block mb-2">
                    Your Name:
                  </label>
                  <input
                    type="text"
                    id="candidateName"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Apply as Candidate"}
                </button>
              </form>
            </div>
          )}

          <div className="mt-6 text-black bg-white">
            <h2 className="text-xl font-semibold mb-2">Current Candidates</h2>
            {candidates.length === 0 ? (
              <p className="italic text-black">No candidates yet</p>
            ) : (
              <ul className="bg-white shadow-md rounded-lg divide-y text-black">
                {candidates.map((candidate: any) => (
                  <li key={candidate.id} className="p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{candidate.name}</span>
                      <div>
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          {candidate.voteCount.toString()} votes
                        </span>
                        <span
                          className={`ml-2 text-xs font-medium px-2.5 py-0.5 rounded ${
                            candidate.approved
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {candidate.approved ? "Approved" : "Pending"}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Debug information */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-black">Debug Info:</h3>
        <pre className="whitespace-pre-wrap break-words bg-gray-200 p-2 rounded text-sm text-black">
          {debug}
        </pre>
      </div>
    </div>
  );
};

export default ConnectMetaMask;
