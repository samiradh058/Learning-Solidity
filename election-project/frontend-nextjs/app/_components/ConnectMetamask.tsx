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
  const [contract, setContract] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string | null>(null);

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [candidateName, setCandidateName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [electionEnded, setElectionEnded] = useState(false);
  const [electionWinner, setElectionWinner] = useState<{
    name: string;
    voteCount: number;
  } | null>(null);
  const [electionTimeRemaining, setElectionTimeRemaining] = useState<
    string | null
  >(null);

  const [candidates, setCandidates] = useState<
    { id: string; name: string; voteCount: number; approved: boolean }[]
  >([]);

  const contractAddress = "0xe4c89Fd9370ea0ba69e1b14A26a99e3C2E12EdD5";

  const contractABI = [
    "function applyAsCandidate(string memory name) public",
    "function getCandidate(uint256 candidateId) public view returns (uint256, string memory, uint256, bool)",
    "function nextCandidateId() public view returns (uint256)",
    "function getAllCandidates() public view returns (tuple(uint id, string name, uint voteCount, bool approved)[])",
    "function isCandidate(address) public view returns (bool)",
    "function admin() public view returns (address)",
    "function approveCandidate(uint _candidateId) external",
    "function vote(uint _candidateId) external",
    "function hasVoted(address) public view returns (bool)",
    "function electionStart() public view returns (uint)",
    "function electionEnd() public view returns (uint)",
    "function electionEnded() public view returns (bool)",

    "event CandidateApplied(address candidate, string name)",
    "event CandidateApproved(address candidate, uint candidateId)",
    "event Voted(address voter, uint candidateId)",
    "event ElectionEnded()",
  ];

  useEffect(() => {
    checkMetaMaskAvailability();
    return () => {
      // Clean up event listeners when component unmounts
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountChange);
        window.ethereum.removeListener("chainChanged", handleChainChange);
      }
    };
  }, []);

  useEffect(() => {
    if (!provider) return;

    checkElectionStatus(provider);

    const interval = setInterval(() => {
      checkElectionStatus(provider);
    }, 15000);

    return () => clearInterval(interval);
  }, [provider]);

  // Set up contract event listeners
  useEffect(() => {
    if (!provider || !contract) return;

    setDebug("Setting up contract event listeners...");

    // Set up event listeners
    const candidateAppliedFilter = contract.filters.CandidateApplied();
    const candidateApprovedFilter = contract.filters.CandidateApproved();
    const votedFilter = contract.filters.Voted();
    const electionEndedFilter = contract.filters.ElectionEnded();

    // Event handlers
    const handleCandidateApplied = (candidate: string, name: string) => {
      setDebug(`Event: CandidateApplied - ${candidate} (${name})`);
      fetchCandidates(provider);

      // Show success message if not the current user
      if (account && candidate.toLowerCase() !== account.toLowerCase()) {
        setSuccessMessage(`New candidate applied: ${name}`);
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    };

    const handleCandidateApproved = (admin: string, candidateId: any) => {
      setDebug(`Event: CandidateApproved - ID: ${candidateId}`);
      fetchCandidates(provider);

      // Show success message for everyone except the admin
      if (account && admin.toLowerCase() !== account.toLowerCase()) {
        setSuccessMessage(`Candidate #${candidateId} has been approved`);
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    };

    const handleVoted = (voter: string, candidateId: any) => {
      setDebug(`Event: Voted - ${voter} for candidate #${candidateId}`);
      fetchCandidates(provider);

      // Update hasVoted status if current user voted
      if (account && voter.toLowerCase() === account.toLowerCase()) {
        setHasVoted(true);
      }

      // Show success message for everyone except the voter
      if (account && voter.toLowerCase() !== account.toLowerCase()) {
        setSuccessMessage(`New vote for candidate #${candidateId}`);
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    };

    const handleElectionEnded = () => {
      setDebug("Event: ElectionEnded");
      setElectionEnded(true);
      checkElectionStatus(provider);
    };

    // Add event listeners
    contract.on(candidateAppliedFilter, handleCandidateApplied);
    contract.on(candidateApprovedFilter, handleCandidateApproved);
    contract.on(votedFilter, handleVoted);
    contract.on(electionEndedFilter, handleElectionEnded);

    // Cleanup function
    return () => {
      contract.off(candidateAppliedFilter, handleCandidateApplied);
      contract.off(candidateApprovedFilter, handleCandidateApproved);
      contract.off(votedFilter, handleVoted);
      contract.off(electionEndedFilter, handleElectionEnded);
      setDebug("Contract event listeners removed");
    };
  }, [provider, contract, account]);

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

          // Initialize contract
          const electionContract = new ethers.Contract(
            contractAddress,
            contractABI,
            signer
          );
          setContract(electionContract);

          // Reset form when account changes
          setCandidateName("");
          setIsFormVisible(false);
          setSuccessMessage(null);

          // Fetch candidates with the new account
          fetchCandidates(ethProvider);

          // Check if connected account is already a candidate
          checkIfCandidate(ethProvider, accounts[0]);

          // Check if account is admin
          checkIfAdmin(ethProvider, accounts[0]);

          // Check if account has voted
          checkIfVoted(ethProvider, accounts[0]);
        } catch (err) {
          console.error("Error getting signer:", err);
        }
      }
    } else {
      setIsConnected(false);
      setAccount(null);
      setSigner(null);
      setProvider(null);
      setContract(null);
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

        // Initialize contract
        const electionContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        setContract(electionContract);

        // Fetch all candidates
        fetchCandidates(ethProvider);

        // Check if connected account is already a candidate
        checkIfCandidate(ethProvider, accounts[0]);

        // Check if account is admin
        checkIfAdmin(ethProvider, accounts[0]);

        // Check if account has voted
        checkIfVoted(ethProvider, accounts[0]);
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

    try {
      const allCandidates = await contract.getAllCandidates();
      console.log("Fetched candidates:", allCandidates);
      setCandidates(allCandidates);
    } catch (error) {
      setError("Error fetching candidates: " + (error as any).message);
    }
  };

  const checkIfCandidate = async (ethProvider: any, address: string) => {
    if (!ethProvider || !address) return;

    const contract = new ethers.Contract(
      contractAddress,
      contractABI,
      ethProvider
    );

    try {
      const isAlreadyCandidate = await contract.isCandidate(address);
      setIsFormVisible(!isAlreadyCandidate);
    } catch (error) {
      console.error("Error checking candidate status:", error);
      // Default to showing the form if there's an error checking
      setIsFormVisible(true);
    }
  };

  const checkIfAdmin = async (ethProvider: any, address: string) => {
    if (!ethProvider || !address) return;

    const contract = new ethers.Contract(
      contractAddress,
      contractABI,
      ethProvider
    );

    try {
      const adminAddress = await contract.admin();
      setIsAdmin(address.toLowerCase() === adminAddress.toLowerCase());
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    }
  };

  const checkIfVoted = async (ethProvider: any, address: string) => {
    if (!ethProvider || !address) return;

    const contract = new ethers.Contract(
      contractAddress,
      contractABI,
      ethProvider
    );

    try {
      const voted = await contract.hasVoted(address);
      setHasVoted(voted);
    } catch (error) {
      console.error("Error checking voting status:", error);
      setHasVoted(false);
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
      const tx = await contract.applyAsCandidate(candidateName);
      setDebug(`Transaction sent: ${tx.hash}`);

      // Wait for transaction to be mined
      await tx.wait();

      setSuccessMessage(
        `Successfully applied as a candidate with name: ${candidateName}`
      );
      setIsFormVisible(false);
      setCandidateName("");

      // Event listener will handle UI update
    } catch (error: any) {
      setError(`Error applying as candidate: ${error.message}`);
      console.error("Application error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveCandidate = async (candidateId: string) => {
    if (!signer || !isAdmin) {
      setError("Only admin can approve candidates");
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);

      const tx = await contract.approveCandidate(candidateId);
      setDebug(`Approval transaction sent: ${tx.hash}`);

      // Wait for transaction to be mined
      await tx.wait();

      setSuccessMessage(`Successfully approved candidate #${candidateId}`);

      // Event listener will handle UI update
    } catch (error: any) {
      setError(`Error approving candidate: ${error.message}`);
      console.error("Approval error:", error);
    }
  };

  const handleVote = async (candidateId: string) => {
    if (!signer) {
      setError("Please connect your wallet to vote");
      return;
    }

    if (hasVoted) {
      setError("You have already voted in this election");
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);

      const tx = await contract.vote(candidateId);
      setDebug(`Vote transaction sent: ${tx.hash}`);

      // Wait for transaction to be mined
      await tx.wait();

      setSuccessMessage(`Successfully voted for candidate #${candidateId}`);

      // Event listener will handle UI update and hasVoted state
    } catch (error: any) {
      setError(`Error voting: ${error.message}`);
      console.error("Voting error:", error);
    }
  };

  const checkElectionStatus = async (ethProvider: any) => {
    if (!ethProvider) return;

    const contract = new ethers.Contract(
      contractAddress,
      contractABI,
      ethProvider
    );

    try {
      // Check if election has ended
      const hasEnded = await contract.electionEnded();
      setElectionEnded(hasEnded);

      // Get election end time
      const endTime = await contract.electionEnd();
      const endTimeInSeconds = Number(endTime);
      const now = Math.floor(Date.now() / 1000);

      // Calculate and format time remaining
      if (endTimeInSeconds > now && !hasEnded) {
        const timeRemaining = endTimeInSeconds - now;
        const days = Math.floor(timeRemaining / 86400);
        const hours = Math.floor((timeRemaining % 86400) / 3600);
        const minutes = Math.floor((timeRemaining % 3600) / 60);

        setElectionTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      } else {
        setElectionTimeRemaining(null);
      }

      if (hasEnded || now >= endTimeInSeconds) {
        const allCandidates = await contract.getAllCandidates();

        let winner = null;
        let highestVotes = 0;

        for (const candidate of allCandidates) {
          if (candidate.approved && candidate.voteCount > highestVotes) {
            highestVotes = candidate.voteCount;
            winner = {
              name: candidate.name,
              voteCount: candidate.voteCount,
            };
          }
        }

        // Handle tie by keeping the first highest vote getter
        setElectionWinner(winner);

        // If election time has passed but contract hasn't been marked as ended
        if (!hasEnded && now >= endTimeInSeconds) {
          setElectionEnded(true); // Show as ended in the UI even if contract state isn't updated
        }
      }
    } catch (error) {
      console.error("Error checking election status:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 flex justify-center">
        Blockchain Election System
      </h1>

      {electionEnded && electionWinner && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded">
          <div className="flex">
            <div className="py-1">
              <svg
                className="h-6 w-6 text-yellow-500 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <p className="font-bold">Election has ended!</p>
              <p className="text-lg">
                The winner is {electionWinner.name} with{" "}
                {electionWinner.voteCount.toString()} votes!
              </p>
            </div>
          </div>
        </div>
      )}

      {!electionEnded && electionTimeRemaining && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4 rounded">
          <div className="flex">
            <div className="py-1">
              <svg
                className="h-6 w-6 text-blue-500 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="font-bold">Election in progress</p>
              <p className="text-lg">Time remaining: {electionTimeRemaining}</p>
            </div>
          </div>
        </div>
      )}

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
            {isAdmin && (
              <span className="ml-2 bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Admin
              </span>
            )}
            {hasVoted && (
              <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Voted
              </span>
            )}
          </p>

          {isFormVisible && !hasVoted && (
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
                      <div className="flex items-center">
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

                        {/* Admin Approval Button */}
                        {isAdmin && !candidate.approved && (
                          <button
                            onClick={() => handleApproveCandidate(candidate.id)}
                            className="ml-3 bg-purple-500 hover:bg-purple-700 text-white text-xs font-medium px-2.5 py-0.5 rounded"
                          >
                            Approve
                          </button>
                        )}

                        {/* Vote Button */}
                        {candidate.approved && !hasVoted && !electionEnded && (
                          <button
                            onClick={() => handleVote(candidate.id)}
                            className="ml-3 bg-blue-500 hover:bg-blue-700 text-white text-xs font-medium px-2.5 py-0.5 rounded"
                          >
                            Vote
                          </button>
                        )}
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
