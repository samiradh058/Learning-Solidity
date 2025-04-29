// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract Elections {
    address public admin;
    uint public electionStart;
    uint public electionEnd;
    bool public electionEnded;

    struct Candidate {
        uint id;
        string name;
        uint voteCount;
        bool approved;
    }

    mapping(uint => Candidate) public candidates;
    mapping(address => bool) public hasVoted;
    mapping(address => bool) public isCandidate;
    uint public nextCandidateId;

    event CandidateApplied(address candidate, string name);
    event CandidateApproved(address candidate, uint candidateId);
    event Voted(address voter, uint candidateId);
    event ElectionEnded();

    constructor(uint _start, uint _end) {
        require(_start < _end, "Start must be before end");
        admin = msg.sender;
        electionStart = _start;
        electionEnd = _end;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier duringElection() {
        require(block.timestamp >= electionStart && block.timestamp <= electionEnd, "Election not active");
        _;
    }

    modifier onlyBeforeEnd() {
        require(!electionEnded, "Election has ended");
        _;
    }

    function applyAsCandidate(string memory _name) external onlyBeforeEnd {
        require(!isCandidate[msg.sender], "Already applied");
        candidates[nextCandidateId] = Candidate(nextCandidateId, _name, 0, false);
        isCandidate[msg.sender] = true;
        emit CandidateApplied(msg.sender, _name);
        nextCandidateId++;
    }

    function approveCandidate(uint _candidateId) external onlyAdmin onlyBeforeEnd {
        require(_candidateId < nextCandidateId, "Invalid candidate ID");
        candidates[_candidateId].approved = true;
        emit CandidateApproved(msg.sender, _candidateId);
    }

    function vote(uint _candidateId) external duringElection onlyBeforeEnd {
        require(!hasVoted[msg.sender], "Already voted");
        require(candidates[_candidateId].approved, "Candidate not approved");
        require(_candidateId < nextCandidateId, "Invalid candidate ID");

        hasVoted[msg.sender] = true;
        candidates[_candidateId].voteCount++;
        emit Voted(msg.sender, _candidateId);
    }

    function endElection() external onlyAdmin onlyBeforeEnd {
        electionEnded = true;
        emit ElectionEnded();
    }

    function getCandidate(uint _candidateId) external view returns (uint, string memory, uint, bool) {
        require(_candidateId < nextCandidateId, "Invalid candidate ID");
        Candidate memory c = candidates[_candidateId];
        return (c.id, c.name, c.voteCount, c.approved);
    }

    // New function to return all candidates
    function getAllCandidates() external view returns (Candidate[] memory) {
        Candidate[] memory allCandidates = new Candidate[](nextCandidateId);
        for (uint i = 0; i < nextCandidateId; i++) {
            allCandidates[i] = candidates[i];
        }
        return allCandidates;
    }
}
