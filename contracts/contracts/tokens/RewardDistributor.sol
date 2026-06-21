// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../libraries/SafeMath.sol";

/**
 * @title RewardDistributor
 * @dev Distributes staking rewards for D-CloudX platform
 */
contract RewardDistributor is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    struct StakingPool {
        uint256 poolId;
        string name;
        uint256 totalStaked;
        uint256 rewardRate; // Rewards per second per token
        uint256 lastUpdateTime;
        uint256 totalRewards;
        bool isActive;
    }

    struct UserStake {
        uint256 amount;
        uint256 rewardDebt;
        uint256 lastStakeTime;
        uint256 totalEarned;
    }

    mapping(uint256 => StakingPool) public stakingPools;
    mapping(address => mapping(uint256 => UserStake)) public userStakes;
    mapping(address => uint256[]) public userPoolIds;
    
    IERC20 public rewardToken;
    uint256 public poolCounter;
    uint256 public constant REWARD_PRECISION = 1e18;

    event PoolCreated(uint256 indexed poolId, string name, uint256 rewardRate);
    event Staked(address indexed user, uint256 indexed poolId, uint256 amount);
    event Unstaked(address indexed user, uint256 indexed poolId, uint256 amount);
    event RewardClaimed(address indexed user, uint256 indexed poolId, uint256 amount);
    event PoolUpdated(uint256 indexed poolId, uint256 newRewardRate);

    constructor(address _rewardToken) {
        rewardToken = IERC20(_rewardToken);
    }

    /**
     * @dev Create a new staking pool
     */
    function createPool(
        string memory _name,
        uint256 _rewardRate
    ) external onlyOwner returns (uint256) {
        require(_rewardRate > 0, "Invalid reward rate");
        
        poolCounter = poolCounter.add(1);
        
        stakingPools[poolCounter] = StakingPool({
            poolId: poolCounter,
            name: _name,
            totalStaked: 0,
            rewardRate: _rewardRate,
            lastUpdateTime: block.timestamp,
            totalRewards: 0,
            isActive: true
        });

        emit PoolCreated(poolCounter, _name, _rewardRate);
        return poolCounter;
    }

    /**
     * @dev Stake tokens in a pool
     */
    function stake(uint256 _poolId, uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be greater than 0");
        require(stakingPools[_poolId].isActive, "Pool is not active");
        
        StakingPool storage pool = stakingPools[_poolId];
        UserStake storage userStake = userStakes[msg.sender][_poolId];
        
        // Update pool rewards
        updatePool(_poolId);
        
        // Calculate pending rewards
        if (userStake.amount > 0) {
            uint256 pending = calculatePendingRewards(msg.sender, _poolId);
            userStake.totalEarned = userStake.totalEarned.add(pending);
        }
        
        // Transfer tokens from user
        rewardToken.transferFrom(msg.sender, address(this), _amount);
        
        // Update stake
        userStake.amount = userStake.amount.add(_amount);
        userStake.rewardDebt = userStake.amount.mul(pool.totalRewards).div(REWARD_PRECISION);
        userStake.lastStakeTime = block.timestamp;
        
        // Update pool
        pool.totalStaked = pool.totalStaked.add(_amount);
        
        // Add pool to user's list if first stake
        if (userStake.amount == _amount) {
            userPoolIds[msg.sender].push(_poolId);
        }
        
        emit Staked(msg.sender, _poolId, _amount);
    }

    /**
     * @dev Unstake tokens from a pool
     */
    function unstake(uint256 _poolId, uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be greater than 0");
        
        UserStake storage userStake = userStakes[msg.sender][_poolId];
        require(userStake.amount >= _amount, "Insufficient staked amount");
        
        StakingPool storage pool = stakingPools[_poolId];
        
        // Update pool rewards
        updatePool(_poolId);
        
        // Calculate and claim pending rewards
        uint256 pending = calculatePendingRewards(msg.sender, _poolId);
        if (pending > 0) {
            userStake.totalEarned = userStake.totalEarned.add(pending);
            rewardToken.transfer(msg.sender, pending);
            emit RewardClaimed(msg.sender, _poolId, pending);
        }
        
        // Update stake
        userStake.amount = userStake.amount.sub(_amount);
        userStake.rewardDebt = userStake.amount.mul(pool.totalRewards).div(REWARD_PRECISION);
        
        // Update pool
        pool.totalStaked = pool.totalStaked.sub(_amount);
        
        // Transfer tokens back to user
        rewardToken.transfer(msg.sender, _amount);
        
        emit Unstaked(msg.sender, _poolId, _amount);
    }

    /**
     * @dev Claim rewards without unstaking
     */
    function claimRewards(uint256 _poolId) external nonReentrant {
        UserStake storage userStake = userStakes[msg.sender][_poolId];
        require(userStake.amount > 0, "No stake found");
        
        // Update pool rewards
        updatePool(_poolId);
        
        // Calculate pending rewards
        uint256 pending = calculatePendingRewards(msg.sender, _poolId);
        require(pending > 0, "No rewards to claim");
        
        // Update user stake
        userStake.totalEarned = userStake.totalEarned.add(pending);
        userStake.rewardDebt = userStake.amount.mul(stakingPools[_poolId].totalRewards).div(REWARD_PRECISION);
        
        // Transfer rewards
        rewardToken.transfer(msg.sender, pending);
        
        emit RewardClaimed(msg.sender, _poolId, pending);
    }

    /**
     * @dev Update pool rewards
     */
    function updatePool(uint256 _poolId) public {
        StakingPool storage pool = stakingPools[_poolId];
        
        if (pool.totalStaked > 0) {
            uint256 timeElapsed = block.timestamp.sub(pool.lastUpdateTime);
            uint256 rewards = timeElapsed.mul(pool.rewardRate).mul(pool.totalStaked).div(REWARD_PRECISION);
            
            pool.totalRewards = pool.totalRewards.add(rewards);
        }
        
        pool.lastUpdateTime = block.timestamp;
    }

    /**
     * @dev Calculate pending rewards for a user
     */
    function calculatePendingRewards(address _user, uint256 _poolId) public view returns (uint256) {
        UserStake memory userStake = userStakes[_user][_poolId];
        StakingPool memory pool = stakingPools[_poolId];
        
        if (userStake.amount == 0) return 0;
        
        uint256 currentTotalRewards = pool.totalRewards;
        if (pool.totalStaked > 0) {
            uint256 timeElapsed = block.timestamp.sub(pool.lastUpdateTime);
            uint256 rewards = timeElapsed.mul(pool.rewardRate).mul(pool.totalStaked).div(REWARD_PRECISION);
            currentTotalRewards = currentTotalRewards.add(rewards);
        }
        
        uint256 userRewards = userStake.amount.mul(currentTotalRewards).div(REWARD_PRECISION);
        return userRewards.sub(userStake.rewardDebt);
    }

    /**
     * @dev Get user's staking information
     */
    function getUserStakeInfo(address _user, uint256 _poolId) external view returns (
        uint256 amount,
        uint256 pendingRewards,
        uint256 totalEarned,
        uint256 lastStakeTime
    ) {
        UserStake memory userStake = userStakes[_user][_poolId];
        return (
            userStake.amount,
            calculatePendingRewards(_user, _poolId),
            userStake.totalEarned,
            userStake.lastStakeTime
        );
    }

    /**
     * @dev Get pool information
     */
    function getPoolInfo(uint256 _poolId) external view returns (
        string memory name,
        uint256 totalStaked,
        uint256 rewardRate,
        uint256 totalRewards,
        bool isActive
    ) {
        StakingPool memory pool = stakingPools[_poolId];
        return (
            pool.name,
            pool.totalStaked,
            pool.rewardRate,
            pool.totalRewards,
            pool.isActive
        );
    }

    /**
     * @dev Update pool reward rate
     */
    function updatePoolRewardRate(uint256 _poolId, uint256 _newRewardRate) external onlyOwner {
        require(stakingPools[_poolId].isActive, "Pool is not active");
        require(_newRewardRate > 0, "Invalid reward rate");
        
        updatePool(_poolId);
        stakingPools[_poolId].rewardRate = _newRewardRate;
        
        emit PoolUpdated(_poolId, _newRewardRate);
    }

    /**
     * @dev Deactivate pool
     */
    function deactivatePool(uint256 _poolId) external onlyOwner {
        stakingPools[_poolId].isActive = false;
    }

    /**
     * @dev Emergency withdraw (only owner)
     */
    function emergencyWithdraw(uint256 _amount) external onlyOwner {
        rewardToken.transfer(owner(), _amount);
    }
}
