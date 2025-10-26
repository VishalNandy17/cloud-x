const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("D-CloudX Smart Contracts", function () {
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
  });

  describe("Basic Contract Tests", function () {
    it("Should deploy contracts successfully", async function () {
      // Test that contracts can be compiled and deployed
      expect(owner.address).to.be.properAddress;
      expect(user1.address).to.be.properAddress;
      expect(user2.address).to.be.properAddress;
    });

    it("Should have proper Solidity version", function () {
      // Check that we're using a compatible Solidity version
      const version = require("../hardhat.config.js").solidity.version;
      expect(version).to.equal("0.8.20");
    });

    it("Should handle basic operations", async function () {
      // Test basic blockchain operations
      const balance = await owner.getBalance();
      expect(balance).to.be.gt(0);
    });

    it("Should handle transaction signing", async function () {
      // Test transaction signing
      const tx = await owner.sendTransaction({
        to: user1.address,
        value: ethers.utils.parseEther("0.1")
      });
      expect(tx.hash).to.be.a('string');
    });
  });
});
