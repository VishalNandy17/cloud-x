// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../libraries/SafeMath.sol";

/**
 * @title VotingMechanism
 * @dev Custom voting mechanism for D-CloudX platform decisions
 */
contract VotingMechanism is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    enum VoteType { YES, NO, ABSTAIN }
    
    struct Proposal {
        uint256 id;
        string title;
        string description;
        address proposer;
        uint256 startTime;
        uint256 endTime;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 abstainVotes;
        bool executed;
        mapping(address => VoteType) votes;
    }

    struct Voter {
        address voter;
        uint256 weight;
        bool hasVoted;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256) public voterWeights;
    mapping(address => bool) public authorizedVoters;
    
    uint256 public proposalCounter;
    uint256 public votingPeriod = 7 days;
    uint256 public quorumThreshold = 1000; // 10% (base 10000)
    uint256 public totalVotingPower;

    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string title);
    event VoteCast(uint256 indexed proposalId, address indexed voter, VoteType voteType, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId);

    modifier onlyAuthorizedVoter() {
        require(authorizedVoters[msg.sender], "Not authorized to vote");
        _;
    }

    modifier validProposal(uint256 _proposalId) {
        require(_proposalId <= proposalCounter, "Invalid proposal ID");
        _;
    }

    /**
     * @dev Create a new proposal
     */
    function createProposal(
        string memory _title,
        string memory _description
    ) external onlyAuthorizedVoter returns (uint256) {
        proposalCounter = proposalCounter.add(1);
        
        Proposal storage proposal = proposals[proposalCounter];
        proposal.id = proposalCounter;
        proposal.title = _title;
        proposal.description = _description;
        proposal.proposer = msg.sender;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp.add(votingPeriod);
        proposal.executed = false;

        emit ProposalCreated(proposalCounter, msg.sender, _title);
        return proposalCounter;
    }

    /**
     * @dev Cast a vote on a proposal
     */
    function castVote(uint256 _proposalId, VoteType _voteType) external validProposal(_proposalId) onlyAuthorizedVoter {
        Proposal storage proposal = proposals[_proposalId];
        require(block.timestamp >= proposal.startTime, "Voting not started");
        require(block.timestamp <= proposal.endTime, "Voting ended");
        require(proposal.votes[msg.sender] == VoteType(0), "Already voted");
        require(!proposal.executed, "Proposal already executed");

        uint256 weight = voterWeights[msg.sender];
        require(weight > 0, "No voting power");

        proposal.votes[msg.sender] = _voteType;

        if (_voteType == VoteType.YES) {
            proposal.yesVotes = proposal.yesVotes.add(weight);
        } else if (_voteType == VoteType.NO) {
            proposal.noVotes = proposal.noVotes.add(weight);
        } else if (_voteType == VoteType.ABSTAIN) {
            proposal.abstainVotes = proposal.abstainVotes.add(weight);
        }

        emit VoteCast(_proposalId, msg.sender, _voteType, weight);
    }

    /**
     * @dev Execute a proposal if it passes
     */
    function executeProposal(uint256 _proposalId) external validProposal(_proposalId) {
        Proposal storage proposal = proposals[_proposalId];
        require(block.timestamp > proposal.endTime, "Voting still active");
        require(!proposal.executed, "Already executed");

        uint256 totalVotes = proposal.yesVotes.add(proposal.noVotes).add(proposal.abstainVotes);
        uint256 quorum = totalVotes.mul(quorumThreshold).div(10000);
        
        require(totalVotes >= quorum, "Quorum not met");
        require(proposal.yesVotes > proposal.noVotes, "Proposal rejected");

        proposal.executed = true;
        emit ProposalExecuted(_proposalId);
    }

    /**
     * @dev Add authorized voter
     */
    function addAuthorizedVoter(address _voter, uint256 _weight) external onlyOwner {
        require(_voter != address(0), "Invalid address");
        require(_weight > 0, "Weight must be positive");
        
        authorizedVoters[_voter] = true;
        voterWeights[_voter] = _weight;
        totalVotingPower = totalVotingPower.add(_weight);
    }

    /**
     * @dev Remove authorized voter
     */
    function removeAuthorizedVoter(address _voter) external onlyOwner {
        require(authorizedVoters[_voter], "Not an authorized voter");
        
        authorizedVoters[_voter] = false;
        totalVotingPower = totalVotingPower.sub(voterWeights[_voter]);
        voterWeights[_voter] = 0;
    }

    /**
     * @dev Update voter weight
     */
    function updateVoterWeight(address _voter, uint256 _newWeight) external onlyOwner {
        require(authorizedVoters[_voter], "Not an authorized voter");
        require(_newWeight > 0, "Weight must be positive");
        
        totalVotingPower = totalVotingPower.sub(voterWeights[_voter]).add(_newWeight);
        voterWeights[_voter] = _newWeight;
    }

    /**
     * @dev Get proposal details
     */
    function getProposal(uint256 _proposalId) external view validProposal(_proposalId) returns (
        uint256 id,
        string memory title,
        string memory description,
        address proposer,
        uint256 startTime,
        uint256 endTime,
        uint256 yesVotes,
        uint256 noVotes,
        uint256 abstainVotes,
        bool executed
    ) {
        Proposal storage proposal = proposals[_proposalId];
        return (
            proposal.id,
            proposal.title,
            proposal.description,
            proposal.proposer,
            proposal.startTime,
            proposal.endTime,
            proposal.yesVotes,
            proposal.noVotes,
            proposal.abstainVotes,
            proposal.executed
        );
    }

    /**
     * @dev Check if voter has voted on proposal
     */
    function hasVoted(uint256 _proposalId, address _voter) external view validProposal(_proposalId) returns (bool) {
        return proposals[_proposalId].votes[_voter] != VoteType(0);
    }

    /**
     * @dev Get voter's vote on proposal
     */
    function getVote(uint256 _proposalId, address _voter) external view validProposal(_proposalId) returns (VoteType) {
        return proposals[_proposalId].votes[_voter];
    }

    /**
     * @dev Update voting period
     */
    function updateVotingPeriod(uint256 _newPeriod) external onlyOwner {
        require(_newPeriod > 0, "Invalid period");
        votingPeriod = _newPeriod;
    }

    /**
     * @dev Update quorum threshold
     */
    function updateQuorumThreshold(uint256 _newThreshold) external onlyOwner {
        require(_newThreshold <= 10000, "Threshold cannot exceed 100%");
        quorumThreshold = _newThreshold;
    }
}
