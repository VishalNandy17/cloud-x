// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../libraries/SafeMath.sol";

/**
 * @title ReputationSystem
 * @dev Manages user reputation scores for D-CloudX platform
 */
contract ReputationSystem is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    struct ReputationData {
        uint256 score;
        uint256 totalTransactions;
        uint256 successfulTransactions;
        uint256 failedTransactions;
        uint256 lastUpdateTime;
        bool isActive;
    }

    struct Review {
        uint256 reviewId;
        address reviewer;
        address reviewee;
        uint256 rating; // 1-5 stars
        string comment;
        uint256 timestamp;
        bool isValid;
    }

    mapping(address => ReputationData) public reputations;
    mapping(uint256 => Review) public reviews;
    mapping(address => uint256[]) public userReviews;
    
    uint256 public reviewCounter;
    uint256 public constant MAX_RATING = 5;
    uint256 public constant MIN_RATING = 1;
    uint256 public constant BASE_REPUTATION = 100;
    uint256 public constant MAX_REPUTATION = 1000;
    
    uint256 public ratingWeight = 20; // Weight for rating impact
    uint256 public transactionWeight = 10; // Weight for transaction success

    event ReputationUpdated(address indexed user, uint256 newScore, uint256 change);
    event ReviewSubmitted(uint256 indexed reviewId, address indexed reviewer, address indexed reviewee, uint256 rating);
    event ReviewUpdated(uint256 indexed reviewId, uint256 newRating);

    modifier validRating(uint256 _rating) {
        require(_rating >= MIN_RATING && _rating <= MAX_RATING, "Invalid rating");
        _;
    }

    /**
     * @dev Initialize user reputation
     */
    function initializeReputation(address _user) external onlyOwner {
        require(reputations[_user].score == 0, "Reputation already initialized");
        
        reputations[_user] = ReputationData({
            score: BASE_REPUTATION,
            totalTransactions: 0,
            successfulTransactions: 0,
            failedTransactions: 0,
            lastUpdateTime: block.timestamp,
            isActive: true
        });
        
        emit ReputationUpdated(_user, BASE_REPUTATION, BASE_REPUTATION);
    }

    /**
     * @dev Submit a review
     */
    function submitReview(
        address _reviewee,
        uint256 _rating,
        string memory _comment
    ) external validRating(_rating) returns (uint256) {
        require(_reviewee != msg.sender, "Cannot review yourself");
        require(_reviewee != address(0), "Invalid reviewee");
        require(reputations[_reviewee].isActive, "Reviewee not active");
        
        reviewCounter = reviewCounter.add(1);
        
        reviews[reviewCounter] = Review({
            reviewId: reviewCounter,
            reviewer: msg.sender,
            reviewee: _reviewee,
            rating: _rating,
            comment: _comment,
            timestamp: block.timestamp,
            isValid: true
        });
        
        userReviews[_reviewee].push(reviewCounter);
        
        // Update reputation based on rating
        updateReputationFromRating(_reviewee, _rating);
        
        emit ReviewSubmitted(reviewCounter, msg.sender, _reviewee, _rating);
        return reviewCounter;
    }

    /**
     * @dev Update review rating
     */
    function updateReviewRating(uint256 _reviewId, uint256 _newRating) external validRating(_newRating) {
        Review storage review = reviews[_reviewId];
        require(review.reviewer == msg.sender, "Not the reviewer");
        require(review.isValid, "Review is invalid");
        
        uint256 oldRating = review.rating;
        review.rating = _newRating;
        
        // Adjust reputation based on rating change
        if (_newRating > oldRating) {
            updateReputationFromRating(review.reviewee, _newRating.sub(oldRating));
        } else if (_newRating < oldRating) {
            updateReputationFromRating(review.reviewee, oldRating.sub(_newRating));
        }
        
        emit ReviewUpdated(_reviewId, _newRating);
    }

    /**
     * @dev Record successful transaction
     */
    function recordSuccessfulTransaction(address _user) external onlyOwner {
        ReputationData storage rep = reputations[_user];
        require(rep.isActive, "User not active");
        
        rep.totalTransactions = rep.totalTransactions.add(1);
        rep.successfulTransactions = rep.successfulTransactions.add(1);
        
        // Increase reputation for successful transaction
        uint256 increase = transactionWeight;
        uint256 newScore = rep.score.add(increase);
        if (newScore > MAX_REPUTATION) {
            newScore = MAX_REPUTATION;
        }
        
        uint256 change = newScore.sub(rep.score);
        rep.score = newScore;
        rep.lastUpdateTime = block.timestamp;
        
        emit ReputationUpdated(_user, newScore, change);
    }

    /**
     * @dev Record failed transaction
     */
    function recordFailedTransaction(address _user) external onlyOwner {
        ReputationData storage rep = reputations[_user];
        require(rep.isActive, "User not active");
        
        rep.totalTransactions = rep.totalTransactions.add(1);
        rep.failedTransactions = rep.failedTransactions.add(1);
        
        // Decrease reputation for failed transaction
        uint256 decrease = transactionWeight;
        uint256 newScore = rep.score > decrease ? rep.score.sub(decrease) : 0;
        
        uint256 change = newScore.sub(rep.score);
        rep.score = newScore;
        rep.lastUpdateTime = block.timestamp;
        
        emit ReputationUpdated(_user, newScore, change);
    }

    /**
     * @dev Update reputation based on rating
     */
    function updateReputationFromRating(address _user, uint256 _ratingImpact) internal {
        ReputationData storage rep = reputations[_user];
        
        uint256 impact = _ratingImpact.mul(ratingWeight);
        uint256 newScore = rep.score.add(impact);
        
        if (newScore > MAX_REPUTATION) {
            newScore = MAX_REPUTATION;
        }
        
        uint256 change = newScore.sub(rep.score);
        rep.score = newScore;
        rep.lastUpdateTime = block.timestamp;
        
        emit ReputationUpdated(_user, newScore, change);
    }

    /**
     * @dev Get user reputation data
     */
    function getReputation(address _user) external view returns (
        uint256 score,
        uint256 totalTransactions,
        uint256 successfulTransactions,
        uint256 failedTransactions,
        uint256 successRate,
        bool isActive
    ) {
        ReputationData memory rep = reputations[_user];
        uint256 successRateValue = 0;
        
        if (rep.totalTransactions > 0) {
            successRateValue = rep.successfulTransactions.mul(10000).div(rep.totalTransactions);
        }
        
        return (
            rep.score,
            rep.totalTransactions,
            rep.successfulTransactions,
            rep.failedTransactions,
            successRateValue,
            rep.isActive
        );
    }

    /**
     * @dev Get user reviews
     */
    function getUserReviews(address _user) external view returns (uint256[] memory) {
        return userReviews[_user];
    }

    /**
     * @dev Get review details
     */
    function getReview(uint256 _reviewId) external view returns (
        address reviewer,
        address reviewee,
        uint256 rating,
        string memory comment,
        uint256 timestamp,
        bool isValid
    ) {
        Review memory review = reviews[_reviewId];
        return (
            review.reviewer,
            review.reviewee,
            review.rating,
            review.comment,
            review.timestamp,
            review.isValid
        );
    }

    /**
     * @dev Calculate average rating for a user
     */
    function getAverageRating(address _user) external view returns (uint256) {
        uint256[] memory userReviewIds = userReviews[_user];
        if (userReviewIds.length == 0) return 0;
        
        uint256 totalRating = 0;
        uint256 validReviews = 0;
        
        for (uint256 i = 0; i < userReviewIds.length; i++) {
            Review memory review = reviews[userReviewIds[i]];
            if (review.isValid) {
                totalRating = totalRating.add(review.rating);
                validReviews = validReviews.add(1);
            }
        }
        
        return validReviews > 0 ? totalRating.div(validReviews) : 0;
    }

    /**
     * @dev Deactivate user reputation
     */
    function deactivateUser(address _user) external onlyOwner {
        reputations[_user].isActive = false;
    }

    /**
     * @dev Update rating weight
     */
    function updateRatingWeight(uint256 _newWeight) external onlyOwner {
        require(_newWeight > 0, "Invalid weight");
        ratingWeight = _newWeight;
    }

    /**
     * @dev Update transaction weight
     */
    function updateTransactionWeight(uint256 _newWeight) external onlyOwner {
        require(_newWeight > 0, "Invalid weight");
        transactionWeight = _newWeight;
    }

    /**
     * @dev Invalidate a review
     */
    function invalidateReview(uint256 _reviewId) external onlyOwner {
        reviews[_reviewId].isValid = false;
    }
}
