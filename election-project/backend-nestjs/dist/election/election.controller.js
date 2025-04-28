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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElectionController = void 0;
const common_1 = require("@nestjs/common");
const blockchain_service_1 = require("../blockchain/blockchain.service");
const election_service_1 = require("./election.service");
let ElectionController = class ElectionController {
    constructor(blockchainService, ElectionService) {
        this.blockchainService = blockchainService;
        this.ElectionService = ElectionService;
    }
    async applyAsCandidate(name) {
        try {
            // Call to blockchain service
            const tx = await this.blockchainService.applyAsCandidate(name);
            // Call to ElectionService to save candidate in DB
            const candidate = await this.ElectionService.createCandidate(4, name); // Use the election ID here
            return { tx, candidate };
        }
        catch (error) {
            console.error('Error in applyAsCandidate:', error);
            throw new Error('Failed to apply as candidate');
        }
    }
    async checkFuntionPost(name) {
        return "HEY IT IS RUNNING of post" + name;
    }
    async createElection(body) {
        const { title, startTime, endTime } = body;
        return this.ElectionService.createElection(title, startTime, endTime);
    }
    // Get all elections
    async getAllElections() {
        return this.ElectionService.getAllElections();
    }
    async approveCandidate(candidateId) {
        return this.blockchainService.approveCandidate(candidateId);
    }
    async vote(candidateId) {
        return this.blockchainService.vote(candidateId);
    }
    async getCandidate(id) {
        return this.ElectionService.getCandidateById(id);
    }
    async checkFuntion() {
        return "HEY IT IS RUNNING";
    }
};
exports.ElectionController = ElectionController;
__decorate([
    (0, common_1.Post)('apply'),
    __param(0, (0, common_1.Body)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ElectionController.prototype, "applyAsCandidate", null);
__decorate([
    (0, common_1.Post)("check"),
    __param(0, (0, common_1.Body)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ElectionController.prototype, "checkFuntionPost", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ElectionController.prototype, "createElection", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ElectionController.prototype, "getAllElections", null);
__decorate([
    (0, common_1.Post)('approve/:candidateId'),
    __param(0, (0, common_1.Param)('candidateId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ElectionController.prototype, "approveCandidate", null);
__decorate([
    (0, common_1.Post)('vote'),
    __param(0, (0, common_1.Body)('candidateId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ElectionController.prototype, "vote", null);
__decorate([
    (0, common_1.Get)('candidate/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ElectionController.prototype, "getCandidate", null);
__decorate([
    (0, common_1.Get)('check'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ElectionController.prototype, "checkFuntion", null);
exports.ElectionController = ElectionController = __decorate([
    (0, common_1.Controller)('election'),
    __metadata("design:paramtypes", [blockchain_service_1.BlockchainService,
        election_service_1.ElectionService])
], ElectionController);
