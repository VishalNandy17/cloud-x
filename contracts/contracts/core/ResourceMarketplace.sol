// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./EscrowManager.sol";
import "./SLAEnforcement.sol";
import "../libraries/SafeMath.sol";

/**
 * @title ResourceMarketplace
 * @dev Main marketplace contract for D-CloudX platform
 */
contract ResourceMarketplace is ReentrancyGuard, Ownable {
    using SafeMath for uint256;

    struct Resource {
        uint256 id;
        address provider;
        string resourceType;
        uint256 cpu;
        uint256 ram;
        uint256 storage;
        uint256 pricePerHour;
        bool isActive;
        uint256 reputation;
        string metadata;
    }

    struct Booking {
        uint256 resourceId;
        address consumer;
        uint256 startTime;
        uint256 duration;
        uint256 escrowId;
        bool isActive;
    }

    // State variables
    mapping(uint256 => Resource) public resources;
    mapping(uint256 => Booking) public bookings;
    uint256 public resourceCounter;
    uint256 public bookingCounter;
    uint256 public platformFee = 25; // 2.5% fee (base 1000)
    
    EscrowManager public escrowManager;
    SLAEnforcement public slaEnforcement;

    // Events
    event ResourceListed(uint256 indexed resourceId, address indexed provider, uint256 pricePerHour);
    event ResourceUpdated(uint256 indexed resourceId, uint256 newPrice, bool isActive);
    event ResourceBooked(uint256 indexed resourceId, address indexed consumer, uint256 duration);
    event BookingCompleted(uint256 indexed bookingId, uint256 indexed resourceId);
    event BookingCancelled(uint256 indexed bookingId, uint256 indexed resourceId);

    constructor(address _escrowManager, address _slaEnforcement) {
        escrowManager = EscrowManager(_escrowManager);
        slaEnforcement = SLAEnforcement(_slaEnforcement);
    }

    /**
     * @dev List a new cloud resource
     */
    function listResource(
        string memory _resourceType,
        uint256 _cpu,
        uint256 _ram,
        uint256 _storage,
        uint256 _pricePerHour,
        string memory _metadata
    ) external nonReentrant returns (uint256) {
        require(_cpu > 0, "CPU must be greater than 0");
        require(_ram > 0, "RAM must be greater than 0");
        require(_storage > 0, "Storage must be greater than 0");
        require(_pricePerHour > 0, "Price must be greater than 0");

        resourceCounter = resourceCounter.add(1);
        
        resources[resourceCounter] = Resource({
            id: resourceCounter,
            provider: msg.sender,
            resourceType: _resourceType,
            cpu: _cpu,
            ram: _ram,
            storage: _storage,
            pricePerHour: _pricePerHour,
            isActive: true,
            reputation: 100,
            metadata: _metadata
        });

        emit ResourceListed(resourceCounter, msg.sender, _pricePerHour);
        return resourceCounter;
    }

    /**
     * @dev Book a cloud resource
     */
    function bookResource(uint256 _resourceId, uint256 _duration) external payable nonReentrant {
        Resource storage resource = resources[_resourceId];
        require(resource.isActive, "Resource is not active");
        require(_duration > 0, "Duration must be greater than 0");
        
        uint256 totalCost = resource.pricePerHour.mul(_duration);
        uint256 platformFeeAmount = totalCost.mul(platformFee).div(1000);
        uint256 providerAmount = totalCost.sub(platformFeeAmount);
        
        require(msg.value >= totalCost, "Insufficient payment");

        // Create escrow
        uint256 escrowId = escrowManager.createEscrow{value: providerAmount}(
            resource.provider,
            _duration
        );

        // Create booking
        bookingCounter = bookingCounter.add(1);
        bookings[bookingCounter] = Booking({
            resourceId: _resourceId,
            consumer: msg.sender,
            startTime: block.timestamp,
            duration: _duration,
            escrowId: escrowId,
            isActive: true
        });

        // Send platform fee to contract owner
        payable(owner()).transfer(platformFeeAmount);

        emit ResourceBooked(_resourceId, msg.sender, _duration);
    }

    /**
     * @dev Complete a booking
     */
    function completeBooking(uint256 _bookingId) external nonReentrant {
        Booking storage booking = bookings[_bookingId];
        require(booking.isActive, "Booking is not active");
        require(
            msg.sender == bookings[_bookingId].consumer,
            "Only consumer can complete booking"
        );

        // Release escrow payment
        escrowManager.releaseEscrow(booking.escrowId);
        
        // Update booking status
        booking.isActive = false;

        emit BookingCompleted(_bookingId, booking.resourceId);
    }

    /**
     * @dev Update resource price
     */
    function updateResourcePrice(uint256 _resourceId, uint256 _newPrice) external {
        Resource storage resource = resources[_resourceId];
        require(msg.sender == resource.provider, "Only provider can update price");
        require(_newPrice > 0, "Price must be greater than 0");

        resource.pricePerHour = _newPrice;
        emit ResourceUpdated(_resourceId, _newPrice, resource.isActive);
    }

    /**
     * @dev Deactivate resource
     */
    function deactivateResource(uint256 _resourceId) external {
        Resource storage resource = resources[_resourceId];
        require(msg.sender == resource.provider, "Only provider can deactivate");
        
        resource.isActive = false;
        emit ResourceUpdated(_resourceId, resource.pricePerHour, false);
    }

    /**
     * @dev Get resource details
     */
    function getResource(uint256 _resourceId) external view returns (
        address provider,
        string memory resourceType,
        uint256 cpu,
        uint256 ram,
        uint256 storage_,
        uint256 pricePerHour,
        bool isActive,
        uint256 reputation
    ) {
        Resource memory resource = resources[_resourceId];
        return (
            resource.provider,
            resource.resourceType,
            resource.cpu,
            resource.ram,
            resource.storage,
            resource.pricePerHour,
            resource.isActive,
            resource.reputation
        );
    }

    /**
     * @dev Update platform fee (only owner)
     */
    function updatePlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 50, "Fee cannot exceed 5%");
        platformFee = _newFee;
    }

    /**
     * @dev Fallback function to accept ETH
     */
    receive() external payable {}
}