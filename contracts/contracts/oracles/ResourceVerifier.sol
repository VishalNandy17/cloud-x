// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../libraries/SafeMath.sol";

/**
 * @title ResourceVerifier
 * @dev Oracle for verifying cloud resource availability and performance
 */
contract ResourceVerifier is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    struct ResourceMetrics {
        uint256 cpuUsage;
        uint256 memoryUsage;
        uint256 diskUsage;
        uint256 networkLatency;
        uint256 uptime;
        uint256 timestamp;
        bool isOnline;
    }

    struct VerificationRequest {
        uint256 resourceId;
        address requester;
        uint256 timestamp;
        bool isVerified;
        ResourceMetrics metrics;
    }

    mapping(uint256 => ResourceMetrics) public resourceMetrics;
    mapping(uint256 => VerificationRequest) public verificationRequests;
    mapping(address => bool) public authorizedVerifiers;
    
    uint256 public requestCounter;
    uint256 public verificationTimeout = 300; // 5 minutes
    uint256 public maxLatencyThreshold = 100; // 100ms
    uint256 public minUptimeThreshold = 9500; // 95% (base 10000)

    event VerificationRequested(uint256 indexed requestId, uint256 indexed resourceId, address indexed requester);
    event ResourceVerified(uint256 indexed requestId, uint256 indexed resourceId, bool verified);
    event MetricsUpdated(uint256 indexed resourceId, uint256 cpuUsage, uint256 memoryUsage, bool isOnline);

    modifier onlyAuthorizedVerifier() {
        require(authorizedVerifiers[msg.sender], "Not authorized verifier");
        _;
    }

    /**
     * @dev Request resource verification
     */
    function requestVerification(uint256 _resourceId) external returns (uint256) {
        require(_resourceId > 0, "Invalid resource ID");
        
        requestCounter = requestCounter.add(1);
        
        verificationRequests[requestCounter] = VerificationRequest({
            resourceId: _resourceId,
            requester: msg.sender,
            timestamp: block.timestamp,
            isVerified: false,
            metrics: ResourceMetrics(0, 0, 0, 0, 0, 0, false)
        });

        emit VerificationRequested(requestCounter, _resourceId, msg.sender);
        return requestCounter;
    }

    /**
     * @dev Submit resource metrics (only authorized verifiers)
     */
    function submitMetrics(
        uint256 _resourceId,
        uint256 _cpuUsage,
        uint256 _memoryUsage,
        uint256 _diskUsage,
        uint256 _networkLatency,
        uint256 _uptime,
        bool _isOnline
    ) external onlyAuthorizedVerifier {
        require(_cpuUsage <= 10000, "Invalid CPU usage"); // Max 100%
        require(_memoryUsage <= 10000, "Invalid memory usage"); // Max 100%
        require(_diskUsage <= 10000, "Invalid disk usage"); // Max 100%
        require(_uptime <= 10000, "Invalid uptime"); // Max 100%

        resourceMetrics[_resourceId] = ResourceMetrics({
            cpuUsage: _cpuUsage,
            memoryUsage: _memoryUsage,
            diskUsage: _diskUsage,
            networkLatency: _networkLatency,
            uptime: _uptime,
            timestamp: block.timestamp,
            isOnline: _isOnline
        });

        emit MetricsUpdated(_resourceId, _cpuUsage, _memoryUsage, _isOnline);
    }

    /**
     * @dev Verify resource based on metrics
     */
    function verifyResource(uint256 _requestId) external onlyAuthorizedVerifier {
        VerificationRequest storage request = verificationRequests[_requestId];
        require(!request.isVerified, "Already verified");
        require(
            block.timestamp.sub(request.timestamp) <= verificationTimeout,
            "Verification timeout"
        );

        ResourceMetrics memory metrics = resourceMetrics[request.resourceId];
        require(metrics.timestamp > 0, "No metrics available");

        bool verified = metrics.isOnline &&
                       metrics.networkLatency <= maxLatencyThreshold &&
                       metrics.uptime >= minUptimeThreshold;

        request.isVerified = true;
        request.metrics = metrics;

        emit ResourceVerified(_requestId, request.resourceId, verified);
    }

    /**
     * @dev Get resource metrics
     */
    function getResourceMetrics(uint256 _resourceId) external view returns (
        uint256 cpuUsage,
        uint256 memoryUsage,
        uint256 diskUsage,
        uint256 networkLatency,
        uint256 uptime,
        uint256 timestamp,
        bool isOnline
    ) {
        ResourceMetrics memory metrics = resourceMetrics[_resourceId];
        return (
            metrics.cpuUsage,
            metrics.memoryUsage,
            metrics.diskUsage,
            metrics.networkLatency,
            metrics.uptime,
            metrics.timestamp,
            metrics.isOnline
        );
    }

    /**
     * @dev Check if resource meets SLA requirements
     */
    function checkSLACompliance(uint256 _resourceId) external view returns (bool) {
        ResourceMetrics memory metrics = resourceMetrics[_resourceId];
        
        if (!metrics.isOnline) return false;
        if (metrics.networkLatency > maxLatencyThreshold) return false;
        if (metrics.uptime < minUptimeThreshold) return false;
        
        return true;
    }

    /**
     * @dev Add authorized verifier
     */
    function addAuthorizedVerifier(address _verifier) external onlyOwner {
        require(_verifier != address(0), "Invalid address");
        authorizedVerifiers[_verifier] = true;
    }

    /**
     * @dev Remove authorized verifier
     */
    function removeAuthorizedVerifier(address _verifier) external onlyOwner {
        authorizedVerifiers[_verifier] = false;
    }

    /**
     * @dev Update verification timeout
     */
    function updateVerificationTimeout(uint256 _newTimeout) external onlyOwner {
        require(_newTimeout > 0, "Invalid timeout");
        verificationTimeout = _newTimeout;
    }

    /**
     * @dev Update latency threshold
     */
    function updateLatencyThreshold(uint256 _newThreshold) external onlyOwner {
        require(_newThreshold > 0, "Invalid threshold");
        maxLatencyThreshold = _newThreshold;
    }

    /**
     * @dev Update uptime threshold
     */
    function updateUptimeThreshold(uint256 _newThreshold) external onlyOwner {
        require(_newThreshold <= 10000, "Invalid threshold");
        minUptimeThreshold = _newThreshold;
    }

    /**
     * @dev Get verification request details
     */
    function getVerificationRequest(uint256 _requestId) external view returns (
        uint256 resourceId,
        address requester,
        uint256 timestamp,
        bool isVerified,
        bool isOnline,
        uint256 uptime
    ) {
        VerificationRequest memory request = verificationRequests[_requestId];
        return (
            request.resourceId,
            request.requester,
            request.timestamp,
            request.isVerified,
            request.metrics.isOnline,
            request.metrics.uptime
        );
    }
}
