import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private contractAddress = '0xb2CAeC0aD3552D32EBECA0c794E983801392c2ac';
  private contractABI = [
    'function applyAsCandidate(string memory name) public',
    'function approveCandidate(uint candidateId) public',
    'function vote(uint candidateId) public',
    'function getCandidate(uint candidateId) public view returns (string memory, uint, bool)',
  ];
  private adminPrivateKey: string;

  constructor(private configService: ConfigService) {
    // Initialize provider and private key from configuration
    this.provider = new ethers.JsonRpcProvider(configService.get<string>('BLOCKCHAIN_RPC_URL'));
    this.adminPrivateKey = configService.get<string>('ADMIN_PRIVATE_KEY') ?? (() => { throw new Error('ADMIN_PRIVATE_KEY is not defined'); })();
  }
  

  private getSigner() {
    if (!this.adminPrivateKey) {
      throw new Error('Private key is missing.');
    }
    const wallet = new ethers.Wallet(this.adminPrivateKey, this.provider);
    return wallet;
  }

  async applyAsCandidate(name: string) {
    console.log("apply as candidate");
    try {
      const signer = this.getSigner();
      console.log("signer",signer);
      const contract = new ethers.Contract(this.contractAddress, this.contractABI, signer);
      const tx = await contract.applyAsCandidate(name);
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error applying as candidate:', error);
      throw new Error('Failed to apply as candidate');
    }
  }

  async approveCandidate(candidateId: number) {
    try {
      const signer = this.getSigner();
      const contract = new ethers.Contract(this.contractAddress, this.contractABI, signer);
      const tx = await contract.approveCandidate(candidateId);
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error approving candidate:', error);
      throw new Error('Failed to approve candidate');
    }
  }

  async vote(candidateId: number) {
    try {
      const signer = this.getSigner();
      const contract = new ethers.Contract(this.contractAddress, this.contractABI, signer);
      const tx = await contract.vote(candidateId);
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error voting for candidate:', error);
      throw new Error('Failed to vote');
    }
  }

  async getCandidate(candidateId: number) {
    try {
      const contract = new ethers.Contract(this.contractAddress, this.contractABI, this.provider);
      const candidate = await contract.getCandidate(candidateId);
      return candidate;
    } catch (error) {
      console.error('Error fetching candidate:', error);
      throw new Error('Failed to fetch candidate');
    }
  }
}
