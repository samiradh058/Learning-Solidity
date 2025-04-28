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
exports.ElectionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const candidate_entity_1 = require("../entities/candidate.entity");
const election_entity_1 = require("../entities/election.entity");
let ElectionService = class ElectionService {
    constructor(candidateRepository, electionRepository) {
        this.candidateRepository = candidateRepository;
        this.electionRepository = electionRepository;
    }
    async createElection(title, startTime, endTime) {
        const election = this.electionRepository.create({
            title,
            startTime,
            endTime,
        });
        return this.electionRepository.save(election);
    }
    // Get all elections
    async getAllElections() {
        return this.electionRepository.find();
    }
    // Create a new candidate
    async createCandidate(electionId, name) {
        const election = await this.electionRepository.findOne({
            where: { id: electionId },
        });
        if (!election) {
            throw new Error('Election not found');
        }
        const candidate = this.candidateRepository.create({
            name,
            voteCount: 0,
            election,
        });
        return this.candidateRepository.save(candidate);
    }
    // Get all candidates for a specific election
    async getCandidatesByElection(electionId) {
        return this.candidateRepository.find({
            where: { election: { id: electionId } },
        });
    }
    // Get a specific candidate by ID
    async getCandidateById(id) {
        const candidate = await this.candidateRepository.findOne({
            where: { id },
        });
        if (!candidate) {
            throw new Error('Candidate not found');
        }
        return candidate;
    }
};
exports.ElectionService = ElectionService;
exports.ElectionService = ElectionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(candidate_entity_1.Candidate)),
    __param(1, (0, typeorm_1.InjectRepository)(election_entity_1.Election)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ElectionService);
