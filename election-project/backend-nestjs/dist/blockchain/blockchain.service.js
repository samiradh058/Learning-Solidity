"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainService = void 0;
const common_1 = require("@nestjs/common");
const ethers_1 = require("ethers");
const config_1 = require("@nestjs/config");
let BlockchainService = class BlockchainService {
    constructor(configService) {
        this.configService = configService;
        this.contractAddress = '0xb2CAeC0aD3552D32EBECA0c794E983801392c2ac';
        this.contractABI = [
            'function applyAsCandidate(string memory name) public',
            'function approveCandidate(uint candidateId) public',
            'function vote(uint candidateId) public',
            'function getCandidate(uint candidateId) public view returns (string memory, uint, bool)',
        ];
        // Initialize provider and private key from configuration
        this.provider = new ethers_1.ethers.JsonRpcProvider(configService.get('BLOCKCHAIN_RPC_URL'));
        this.adminPrivateKey = configService.get('ADMIN_PRIVATE_KEY') ?? (() => { throw new Error('ADMIN_PRIVATE_KEY is not defined'); })();
    }
    getSigner() {
        if (!this.adminPrivateKey) {
            throw new Error('Private key is missing.');
        }
        const wallet = new ethers_1.ethers.Wallet(this.adminPrivateKey, this.provider);
        return wallet;
    }
    async applyAsCandidate(name) {
        console.log("apply as candidate");
        try {
            const signer = this.getSigner();
            console.log("signer", signer);
            const contract = new ethers_1.ethers.Contract(this.contractAddress, this.contractABI, signer);
            const tx = await contract.applyAsCandidate(name);
            await tx.wait();
            return tx;
        }
        catch (error) {
            console.error('Error applying as candidate:', error);
            throw new Error('Failed to apply as candidate');
        }
    }
    async approveCandidate(candidateId) {
        try {
            const signer = this.getSigner();
            const contract = new ethers_1.ethers.Contract(this.contractAddress, this.contractABI, signer);
            const tx = await contract.approveCandidate(candidateId);
            await tx.wait();
            return tx;
        }
        catch (error) {
            console.error('Error approving candidate:', error);
            throw new Error('Failed to approve candidate');
        }
    }
    async vote(candidateId) {
        try {
            const signer = this.getSigner();
            const contract = new ethers_1.ethers.Contract(this.contractAddress, this.contractABI, signer);
            const tx = await contract.vote(candidateId);
            await tx.wait();
            return tx;
        }
        catch (error) {
            console.error('Error voting for candidate:', error);
            throw new Error('Failed to vote');
        }
    }
    async getCandidate(candidateId) {
        try {
            const contract = new ethers_1.ethers.Contract(this.contractAddress, this.contractABI, this.provider);
            const candidate = await contract.getCandidate(candidateId);
            return candidate;
        }
        catch (error) {
            console.error('Error fetching candidate:', error);
            throw new Error('Failed to fetch candidate');
        }
    }
};
exports.BlockchainService = BlockchainService;
exports.BlockchainService = BlockchainService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], BlockchainService);
