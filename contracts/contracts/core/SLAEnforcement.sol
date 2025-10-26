// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../libraries/SafeMath.sol";

/**
 * @title SLAEnforcement
 * @dev Manages Service Level Agreement enforcement for D-CloudX platform
 */
contract SLAEnforcement is ReentrancyGuard, Ownable {
    using SafeMath for uint256;

    struct SLA {
        uint256 id;
        uint256 resourceId;
        uint256 uptime;           // Required uptime percentage (base 1000)
        uint256 latency;          // Maximum latency in ms
        uint256 penalty;          // Penalty percentage for violations (base 1000)
        bool isActive;
    }

    struct Violation {
        uint256 slaId;
        uint256 timestamp;
        string violationType;
        uint256 measuredValue;
        uint256 penaltyAmount;
    }

    mapping(uint256 => SLA) public slas;
    mapping(uint256 => Violation[]) public violations;
    uint256 public slaCounter;

    // Events
    event SLACreated(uint256 indexed slaId, uint256 indexed resourceId);
    event SLAViolation(uint256 indexed slaId, string violationType, uint256 penaltyAmount);
    event PenaltyPaid(uint256 indexed slaId, uint256 amount);

    /**
     * @dev Create a new SLA
     */
    function createSLA(
        uint256 _resourceId,
        uint256 _uptime,
        uint256 _latency,
        uint256 _penalty
    ) external returns (uint256) {
        require(_uptime <= 1000, "Uptime cannot exceed 100%");
        require(_penalty <= 1000, "Penalty cannot exceed 100%");

        slaCounter = slaCounter.add(1);

        slas[slaCounter] = SLA({
            id: slaCounter,
            resourceId: _resourceId,
            uptime: _uptime,
            latency: _latency,
            penalty: _penalty,
            isActive: true
        });

        emit SLACreated(slaCounter, _resourceId);
        return slaCounter;
    }

    /**
     * @dev Record an SLA violation
     */
    function recordViolation(
        uint256 _slaId,
        string memory _violationType,
        uint256 _measuredValue
    ) external onlyOwner {
        require(slas[_slaId].isActive, "SLA is not active");

        SLA storage sla = slas[_slaId];
        uint256 penaltyAmount = calculatePenalty(_slaId, _measuredValue);

        violations[_slaId].push(Violation({
            slaId: _slaId,
            timestamp: block.timestamp,
            violationType: _violationType,
            measuredValue: _measuredValue,
            penaltyAmount: penaltyAmount
        }));

        emit SLAViolation(_slaId, _violationType, penaltyAmount);
    }

    /**
     * @dev Calculate penalty for violation
     */
    function calculatePenalty(
        uint256 _slaId,
        uint256 _measuredValue
    ) public view returns (uint256) {
        SLA memory sla = slas[_slaId];
        
        if (keccak256(abi.encodePacked("uptime")) == keccak256(abi.encodePacked("uptime"))) {
            if (_measuredValue < sla.uptime) {
                return sla.penalty;
            }
        } else if (keccak256(abi.encodePacked("latency")) == keccak256(abi.encodePacked("latency"))) {
            if (_measuredValue > sla.latency) {
                return sla.penalty;
            }
        }
        
        return 0;
    }

    /**
     * @dev Get SLA details
     */
    function getSLA(uint256 _slaId) external view returns (
        uint256 resourceId,
        uint256 uptime,
        uint256 latency,
        uint256 penalty,
        bool isActive
    ) {
        SLA memory sla = slas[_slaId];
        return (
            sla.resourceId,
            sla.uptime,
            sla.latency,
            sla.penalty,
            sla.isActive
        );
    }

    /**
     * @dev Get violations count for an SLA
     */
    function getViolationsCount(uint256 _slaId) external view returns (uint256) {
        return violations[_slaId].length;
    }

    /**
     * @dev Deactivate SLA
     */
    function deactivateSLA(uint256 _slaId) external onlyOwner {
        require(slas[_slaId].isActive, "SLA is not active");
        slas[_slaId].isActive = false;
    }
}