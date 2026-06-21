const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ResourceMarketplace", function () {
  let resourceMarketplace;
  let escrowManager;
  let slaEnforcement;
  let dcxToken;
  let owner;
  let provider;
  let consumer;
  let addr1, addr2;

  beforeEach(async function () {
    [owner, provider, consumer, addr1, addr2] = await ethers.getSigners();

    // Deploy contracts
    const EscrowManager = await ethers.getContractFactory("EscrowManager");
    escrowManager = await EscrowManager.deploy();
    await escrowManager.waitForDeployment();

    const SLAEnforcement = await ethers.getContractFactory("SLAEnforcement");
    slaEnforcement = await SLAEnforcement.deploy();
    await slaEnforcement.waitForDeployment();

    const ResourceMarketplace = await ethers.getContractFactory("ResourceMarketplace");
    resourceMarketplace = await ResourceMarketplace.deploy(
      escrowManager.target,
      slaEnforcement.target
    );
    await resourceMarketplace.waitForDeployment();

    const DCXToken = await ethers.getContractFactory("DCXToken");
    dcxToken = await DCXToken.deploy();
    await dcxToken.waitForDeployment();

    // Transfer ownership
    await escrowManager.transferOwnership(resourceMarketplace.target);
    await slaEnforcement.transferOwnership(resourceMarketplace.target);
  });

  describe("Resource Management", function () {
    it("Should allow providers to list resources", async function () {
      const resourceData = {
        resourceType: "compute",
        cpu: 4,
        ram: 8,
        storageSize: 100,
        pricePerHour: ethers.parseEther("0.1"),
        metadata: "ipfs://QmTest123"
      };

      await resourceMarketplace.connect(provider).listResource(
        resourceData.resourceType,
        resourceData.cpu,
        resourceData.ram,
        resourceData.storageSize,
        resourceData.pricePerHour,
        resourceData.metadata
      );

      const resource = await resourceMarketplace.getResource(1);
      expect(resource.provider).to.equal(provider.address);
      expect(resource.resourceType).to.equal(resourceData.resourceType);
      expect(resource.cpu).to.equal(resourceData.cpu);
      expect(resource.ram).to.equal(resourceData.ram);
      expect(resource.storageSize).to.equal(resourceData.storageSize);
      expect(resource.pricePerHour).to.equal(resourceData.pricePerHour);
      expect(resource.isActive).to.be.true;
    });



    it("Should allow providers to update resource prices", async function () {
      // First list a resource
      await resourceMarketplace.connect(provider).listResource(
        "compute",
        4,
        8,
        100,
        ethers.parseEther("0.1"),
        "ipfs://QmTest123"
      );

      const newPrice = ethers.parseEther("0.15");
      await resourceMarketplace.connect(provider).updateResourcePrice(1, newPrice);

      const resource = await resourceMarketplace.getResource(1);
      expect(resource.pricePerHour).to.equal(newPrice);
    });

    it("Should allow providers to deactivate resources", async function () {
      // First list a resource
      await resourceMarketplace.connect(provider).listResource(
        "compute",
        4,
        8,
        100,
        ethers.parseEther("0.1"),
        "ipfs://QmTest123"
      );

      await resourceMarketplace.connect(provider).deactivateResource(1);

      const resource = await resourceMarketplace.getResource(1);
      expect(resource.isActive).to.be.false;
    });
  });

  describe("Resource Booking", function () {
    beforeEach(async function () {
      // List a resource for testing
      await resourceMarketplace.connect(provider).listResource(
        "compute",
        4,
        8,
        100,
        ethers.parseEther("0.1"),
        "ipfs://QmTest123"
      );
    });

    it("Should allow consumers to book resources", async function () {
      const duration = 24; // 24 hours
      const totalCost = ethers.parseEther("0.1")* BigInt(duration);

      await expect(
        resourceMarketplace.connect(consumer).bookResource(1, duration, {
          value: totalCost
        })
      ).to.emit(resourceMarketplace, "ResourceBooked");

      const booking = await resourceMarketplace.bookings(1);
      expect(booking.resourceId).to.equal(1);
      expect(booking.consumer).to.equal(consumer.address);
      expect(booking.duration).to.equal(duration);
      expect(booking.isActive).to.be.true;
    });

    it("Should prevent booking inactive resources", async function () {
      // Deactivate the resource
      await resourceMarketplace.connect(provider).deactivateResource(1);

      const duration = 24;
      const totalCost = ethers.parseEther("0.1")* BigInt(duration);

      await expect(
        resourceMarketplace.connect(consumer).bookResource(1, duration, {
          value: totalCost
        })
      ).to.be.revertedWith("Resource is not active");
    });

    it("Should prevent booking with insufficient payment", async function () {
      const duration = 24;
      const insufficientCost = ethers.parseEther("0.05"); // Less than required

      await expect(
        resourceMarketplace.connect(consumer).bookResource(1, duration, {
          value: insufficientCost
        })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should allow completing bookings", async function () {
      // First book the resource
      const duration = 24;
      const totalCost = ethers.parseEther("0.1")* BigInt(duration);

      await resourceMarketplace.connect(consumer).bookResource(1, duration, {
        value: totalCost
      });

      // Complete the booking
      await expect(
        resourceMarketplace.connect(consumer).completeBooking(1)
      ).to.emit(resourceMarketplace, "BookingCompleted");

      const booking = await resourceMarketplace.bookings(1);
      expect(booking.isActive).to.be.false;
    });
  });

  describe("Platform Fees", function () {
    it("Should allow owner to update platform fee", async function () {
      const newFee = 50; // 5%
      await resourceMarketplace.updatePlatformFee(newFee);

      expect(await resourceMarketplace.platformFee()).to.equal(newFee);
    });

    it("Should prevent non-owner from updating platform fee", async function () {
      const newFee = 50;
      await expect(
        resourceMarketplace.connect(addr1).updatePlatformFee(newFee)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should enforce maximum platform fee", async function () {
      const maxFee = 1000; // 100%
      await expect(
        resourceMarketplace.updatePlatformFee(maxFee + 1)
      ).to.be.revertedWith("Fee cannot exceed 5%");
    });
  });



  describe("Edge Cases", function () {
    it("Should handle zero values correctly", async function () {
      await expect(
        resourceMarketplace.connect(provider).listResource(
          "compute",
          0, // Zero CPU
          8,
          100,
          ethers.parseEther("0.1"),
          "ipfs://QmTest123"
        )
      ).to.be.revertedWith("CPU must be greater than 0");
    });

    it("Should handle maximum values correctly", async function () {
      const maxUint256 = ethers.MaxUint256;
      
      await expect(
        resourceMarketplace.connect(provider).listResource(
          "compute",
          4,
          8,
          100,
          maxUint256,
          "ipfs://QmTest123"
        )
      ).to.not.be.reverted;
    });
  });
});
