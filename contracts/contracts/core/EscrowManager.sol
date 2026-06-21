// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../libraries/SafeMath.sol";

/**
 * @title EscrowManager
 * @dev Manages secure payment escrow for D-CloudX platform
 */
contract EscrowManager is ReentrancyGuard, Ownable {
    using SafeMath for uint256;

    struct Escrow {
        uint256 id;
        address consumer;
        address provider;
        uint256 amount;
        uint256 startTime;
        uint256 duration;
        bool isReleased;
        bool isRefunded;
    }

    mapping(uint256 => Escrow) public escrows;
    uint256 public escrowCounter;

    // Events
    event EscrowCreated(uint256 indexed escrowId, address indexed consumer, address indexed provider, uint256 amount);
    event EscrowReleased(uint256 indexed escrowId, uint256 amount);
    event EscrowRefunded(uint256 indexed escrowId, uint256 amount);

    /**
     * @dev Create a new escrow
     */
    function createEscrow(
        address _provider,
        uint256 _duration
    ) external payable nonReentrant returns (uint256) {
        require(msg.value > 0, "Payment required");
        require(_provider != address(0), "Invalid provider address");
        require(_duration > 0, "Duration must be greater than 0");

        escrowCounter = escrowCounter.add(1);
        
        escrows[escrowCounter] = Escrow({
            id: escrowCounter,
            consumer: msg.sender,
            provider: _provider,
            amount: msg.value,
            startTime: block.timestamp,
            duration: _duration,
            isReleased: false,
            isRefunded: false
        });

        emit EscrowCreated(escrowCounter, msg.sender, _provider, msg.value);
        return escrowCounter;
    }

    /**
     * @dev Release escrow payment to provider
     */
    function releaseEscrow(uint256 _escrowId) external nonReentrant {
        Escrow storage escrow = escrows[_escrowId];
        require(!escrow.isReleased, "Escrow already released");
        require(!escrow.isRefunded, "Escrow was refunded");
        require(
            msg.sender == escrow.consumer || 
            msg.sender == owner(),
            "Not authorized"
        );

        escrow.isReleased = true;
        payable(escrow.provider).transfer(escrow.amount);

        emit EscrowReleased(_escrowId, escrow.amount);
    }

    /**
     * @dev Refund escrow payment to consumer
     */
    function refundEscrow(uint256 _escrowId) external nonReentrant onlyOwner {
        Escrow storage escrow = escrows[_escrowId];
        require(!escrow.isReleased, "Escrow already released");
        require(!escrow.isRefunded, "Escrow already refunded");

        escrow.isRefunded = true;
        payable(escrow.consumer).transfer(escrow.amount);

        emit EscrowRefunded(_escrowId, escrow.amount);
    }

    /**
     * @dev Get escrow details
     */
    function getEscrow(uint256 _escrowId) external view returns (
        address consumer,
        address provider,
        uint256 amount,
        uint256 startTime,
        uint256 duration,
        bool isReleased,
        bool isRefunded
    ) {
        Escrow memory escrow = escrows[_escrowId];
        return (
            escrow.consumer,
            escrow.provider,
            escrow.amount,
            escrow.startTime,
            escrow.duration,
            escrow.isReleased,
            escrow.isRefunded
        );
    }

    /**
     * @dev Check if escrow is expired
     */
    function isEscrowExpired(uint256 _escrowId) public view returns (bool) {
        Escrow memory escrow = escrows[_escrowId];
        return block.timestamp > escrow.startTime.add(escrow.duration.mul(1 hours));
    }

    /**
     * @dev Fallback function to accept ETH
     */
    receive() external payable {}
}