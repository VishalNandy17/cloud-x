// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "../libraries/SafeMath.sol";

/**
 * @title PriceOracle
 * @dev Price oracle for D-CloudX platform using Chainlink feeds
 */
contract PriceOracle is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    struct PriceData {
        uint256 price;
        uint256 timestamp;
        bool isValid;
    }

    mapping(string => AggregatorV3Interface) public priceFeeds;
    mapping(string => PriceData) public customPrices;
    mapping(address => bool) public authorizedOracles;
    
    uint256 public constant PRICE_DECIMALS = 8;
    uint256 public constant MAX_PRICE_AGE = 3600; // 1 hour

    event PriceUpdated(string indexed symbol, uint256 price, uint256 timestamp);
    event PriceFeedAdded(string indexed symbol, address indexed feed);
    event CustomPriceSet(string indexed symbol, uint256 price);

    modifier onlyAuthorizedOracle() {
        require(authorizedOracles[msg.sender], "Not authorized oracle");
        _;
    }

    /**
     * @dev Add Chainlink price feed
     */
    function addPriceFeed(string memory _symbol, address _feedAddress) external onlyOwner {
        require(_feedAddress != address(0), "Invalid feed address");
        priceFeeds[_symbol] = AggregatorV3Interface(_feedAddress);
        emit PriceFeedAdded(_symbol, _feedAddress);
    }

    /**
     * @dev Get latest price from Chainlink feed
     */
    function getLatestPrice(string memory _symbol) public view returns (uint256, uint256) {
        AggregatorV3Interface priceFeed = priceFeeds[_symbol];
        require(address(priceFeed) != address(0), "Price feed not found");
        
        (
            uint80 roundId,
            int256 price,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        
        require(price > 0, "Invalid price");
        require(updatedAt > 0, "Round not complete");
        
        return (uint256(price), updatedAt);
    }

    /**
     * @dev Set custom price (for non-Chainlink assets)
     */
    function setCustomPrice(string memory _symbol, uint256 _price) external onlyAuthorizedOracle {
        require(_price > 0, "Invalid price");
        
        customPrices[_symbol] = PriceData({
            price: _price,
            timestamp: block.timestamp,
            isValid: true
        });
        
        emit CustomPriceSet(_symbol, _price);
    }

    /**
     * @dev Get price with fallback to custom price
     */
    function getPrice(string memory _symbol) external view returns (uint256, uint256) {
        // Try Chainlink feed first
        if (address(priceFeeds[_symbol]) != address(0)) {
            return getLatestPrice(_symbol);
        }
        
        // Fallback to custom price
        PriceData memory customPrice = customPrices[_symbol];
        require(customPrice.isValid, "Price not available");
        require(
            block.timestamp.sub(customPrice.timestamp) <= MAX_PRICE_AGE,
            "Price too old"
        );
        
        return (customPrice.price, customPrice.timestamp);
    }

    /**
     * @dev Convert price to ETH equivalent
     */
    function convertToETH(string memory _symbol, uint256 _amount) external view returns (uint256) {
        (uint256 price, ) = this.getPrice(_symbol);
        return _amount.mul(10**PRICE_DECIMALS).div(price);
    }

    /**
     * @dev Convert ETH to other currency
     */
    function convertFromETH(string memory _symbol, uint256 _ethAmount) external view returns (uint256) {
        (uint256 price, ) = this.getPrice(_symbol);
        return _ethAmount.mul(price).div(10**PRICE_DECIMALS);
    }

    /**
     * @dev Add authorized oracle
     */
    function addAuthorizedOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "Invalid address");
        authorizedOracles[_oracle] = true;
    }

    /**
     * @dev Remove authorized oracle
     */
    function removeAuthorizedOracle(address _oracle) external onlyOwner {
        authorizedOracles[_oracle] = false;
    }

    /**
     * @dev Check if price is valid and recent
     */
    function isPriceValid(string memory _symbol) external view returns (bool) {
        if (address(priceFeeds[_symbol]) != address(0)) {
            (, uint256 updatedAt) = getLatestPrice(_symbol);
            return block.timestamp.sub(updatedAt) <= MAX_PRICE_AGE;
        }
        
        PriceData memory customPrice = customPrices[_symbol];
        return customPrice.isValid && 
               block.timestamp.sub(customPrice.timestamp) <= MAX_PRICE_AGE;
    }

    /**
     * @dev Get multiple prices at once
     */
    function getMultiplePrices(string[] memory _symbols) external view returns (uint256[] memory prices, uint256[] memory timestamps) {
        prices = new uint256[](_symbols.length);
        timestamps = new uint256[](_symbols.length);
        
        for (uint256 i = 0; i < _symbols.length; i++) {
            (prices[i], timestamps[i]) = this.getPrice(_symbols[i]);
        }
    }
}
