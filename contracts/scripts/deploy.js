const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy DCXToken
  console.log("\n=== Deploying DCXToken ===");
  const DCXToken = await ethers.getContractFactory("DCXToken");
  const dcxToken = await DCXToken.deploy();
  await dcxToken.deployed();
  console.log("DCXToken deployed to:", dcxToken.address);

  // Deploy RewardDistributor
  console.log("\n=== Deploying RewardDistributor ===");
  const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
  const rewardDistributor = await RewardDistributor.deploy(dcxToken.address);
  await rewardDistributor.deployed();
  console.log("RewardDistributor deployed to:", rewardDistributor.address);

  // Deploy ReputationSystem
  console.log("\n=== Deploying ReputationSystem ===");
  const ReputationSystem = await ethers.getContractFactory("ReputationSystem");
  const reputationSystem = await ReputationSystem.deploy();
  await reputationSystem.deployed();
  console.log("ReputationSystem deployed to:", reputationSystem.address);

  // Deploy PriceOracle
  console.log("\n=== Deploying PriceOracle ===");
  const PriceOracle = await ethers.getContractFactory("PriceOracle");
  const priceOracle = await PriceOracle.deploy();
  await priceOracle.deployed();
  console.log("PriceOracle deployed to:", priceOracle.address);

  // Deploy ResourceVerifier
  console.log("\n=== Deploying ResourceVerifier ===");
  const ResourceVerifier = await ethers.getContractFactory("ResourceVerifier");
  const resourceVerifier = await ResourceVerifier.deploy();
  await resourceVerifier.deployed();
  console.log("ResourceVerifier deployed to:", resourceVerifier.address);

  // Deploy VotingMechanism
  console.log("\n=== Deploying VotingMechanism ===");
  const VotingMechanism = await ethers.getContractFactory("VotingMechanism");
  const votingMechanism = await VotingMechanism.deploy();
  await votingMechanism.deployed();
  console.log("VotingMechanism deployed to:", votingMechanism.address);

  // Deploy SLAEnforcement
  console.log("\n=== Deploying SLAEnforcement ===");
  const SLAEnforcement = await ethers.getContractFactory("SLAEnforcement");
  const slaEnforcement = await SLAEnforcement.deploy();
  await slaEnforcement.deployed();
  console.log("SLAEnforcement deployed to:", slaEnforcement.address);

  // Deploy EscrowManager
  console.log("\n=== Deploying EscrowManager ===");
  const EscrowManager = await ethers.getContractFactory("EscrowManager");
  const escrowManager = await EscrowManager.deploy();
  await escrowManager.deployed();
  console.log("EscrowManager deployed to:", escrowManager.address);

  // Deploy ResourceMarketplace
  console.log("\n=== Deploying ResourceMarketplace ===");
  const ResourceMarketplace = await ethers.getContractFactory("ResourceMarketplace");
  const resourceMarketplace = await ResourceMarketplace.deploy(
    escrowManager.address,
    slaEnforcement.address
  );
  await resourceMarketplace.deployed();
  console.log("ResourceMarketplace deployed to:", resourceMarketplace.address);

  // Deploy TimelockController for DAO
  console.log("\n=== Deploying TimelockController ===");
  const TimelockController = await ethers.getContractFactory("TimelockController");
  const timelockController = await TimelockController.deploy(
    0, // minimum delay
    [deployer.address], // proposers
    [deployer.address], // executors
    deployer.address // admin
  );
  await timelockController.deployed();
  console.log("TimelockController deployed to:", timelockController.address);

  // Deploy DAOGovernance
  console.log("\n=== Deploying DAOGovernance ===");
  const DAOGovernance = await ethers.getContractFactory("DAOGovernance");
  const daoGovernance = await DAOGovernance.deploy(
    dcxToken.address,
    timelockController.address,
    1, // voting delay (blocks)
    17280, // voting period (blocks) ~3 days
    ethers.utils.parseEther("1000"), // proposal threshold
    4 // quorum percentage (4%)
  );
  await daoGovernance.deployed();
  console.log("DAOGovernance deployed to:", daoGovernance.address);

  // Set up roles and permissions
  console.log("\n=== Setting up roles and permissions ===");
  
  // Grant minter role to ResourceMarketplace
  const minterRole = await dcxToken.MINTER_ROLE();
  await dcxToken.grantRole(minterRole, resourceMarketplace.address);
  console.log("Granted MINTER_ROLE to ResourceMarketplace");

  // Grant minter role to RewardDistributor
  await dcxToken.grantRole(minterRole, rewardDistributor.address);
  console.log("Granted MINTER_ROLE to RewardDistributor");

  // Transfer ownership of support contracts to ResourceMarketplace
  await escrowManager.transferOwnership(resourceMarketplace.address);
  await slaEnforcement.transferOwnership(resourceMarketplace.address);
  console.log("Transferred ownership of EscrowManager and SLAEnforcement to ResourceMarketplace");

  // Add deployer as authorized oracle and verifier
  await priceOracle.addAuthorizedOracle(deployer.address);
  await resourceVerifier.addAuthorizedVerifier(deployer.address);
  console.log("Added deployer as authorized oracle and verifier");

  // Initialize reputation for deployer
  await reputationSystem.initializeReputation(deployer.address);
  console.log("Initialized reputation for deployer");

  console.log("\n=== Contract deployment completed successfully! ===");

  // Verify contracts on Etherscan
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n=== Verifying contracts on Etherscan ===");
    console.log("Waiting for block confirmations...");
    
    await dcxToken.deployTransaction.wait(5);
    await rewardDistributor.deployTransaction.wait(5);
    await reputationSystem.deployTransaction.wait(5);
    await priceOracle.deployTransaction.wait(5);
    await resourceVerifier.deployTransaction.wait(5);
    await votingMechanism.deployTransaction.wait(5);
    await slaEnforcement.deployTransaction.wait(5);
    await escrowManager.deployTransaction.wait(5);
    await resourceMarketplace.deployTransaction.wait(5);
    await timelockController.deployTransaction.wait(5);
    await daoGovernance.deployTransaction.wait(5);

    console.log("Verifying contracts on Etherscan...");

    try {
      await hre.run("verify:verify", {
        address: dcxToken.address,
        constructorArguments: [],
      });
      console.log("✓ DCXToken verified");
    } catch (error) {
      console.log("✗ DCXToken verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: rewardDistributor.address,
        constructorArguments: [dcxToken.address],
      });
      console.log("✓ RewardDistributor verified");
    } catch (error) {
      console.log("✗ RewardDistributor verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: reputationSystem.address,
        constructorArguments: [],
      });
      console.log("✓ ReputationSystem verified");
    } catch (error) {
      console.log("✗ ReputationSystem verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: priceOracle.address,
        constructorArguments: [],
      });
      console.log("✓ PriceOracle verified");
    } catch (error) {
      console.log("✗ PriceOracle verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: resourceVerifier.address,
        constructorArguments: [],
      });
      console.log("✓ ResourceVerifier verified");
    } catch (error) {
      console.log("✗ ResourceVerifier verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: votingMechanism.address,
        constructorArguments: [],
      });
      console.log("✓ VotingMechanism verified");
    } catch (error) {
      console.log("✗ VotingMechanism verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: slaEnforcement.address,
        constructorArguments: [],
      });
      console.log("✓ SLAEnforcement verified");
    } catch (error) {
      console.log("✗ SLAEnforcement verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: escrowManager.address,
        constructorArguments: [],
      });
      console.log("✓ EscrowManager verified");
    } catch (error) {
      console.log("✗ EscrowManager verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: resourceMarketplace.address,
        constructorArguments: [escrowManager.address, slaEnforcement.address],
      });
      console.log("✓ ResourceMarketplace verified");
    } catch (error) {
      console.log("✗ ResourceMarketplace verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: timelockController.address,
        constructorArguments: [0, [deployer.address], [deployer.address], deployer.address],
      });
      console.log("✓ TimelockController verified");
    } catch (error) {
      console.log("✗ TimelockController verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: daoGovernance.address,
        constructorArguments: [
          dcxToken.address,
          timelockController.address,
          1,
          17280,
          ethers.utils.parseEther("1000"),
          4
        ],
      });
      console.log("✓ DAOGovernance verified");
    } catch (error) {
      console.log("✗ DAOGovernance verification failed:", error.message);
    }
  }

  // Save deployed addresses
  const fs = require("fs");
  const deployments = {
    dcxToken: dcxToken.address,
    rewardDistributor: rewardDistributor.address,
    reputationSystem: reputationSystem.address,
    priceOracle: priceOracle.address,
    resourceVerifier: resourceVerifier.address,
    votingMechanism: votingMechanism.address,
    slaEnforcement: slaEnforcement.address,
    escrowManager: escrowManager.address,
    resourceMarketplace: resourceMarketplace.address,
    timelockController: timelockController.address,
    daoGovernance: daoGovernance.address,
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
  };

  fs.writeFileSync(
    "deployments.json",
    JSON.stringify(deployments, null, 2)
  );

  console.log("\n=== Deployment Summary ===");
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);
  console.log("Deployments saved to deployments.json");
  console.log("\nContract Addresses:");
  console.log("DCXToken:", dcxToken.address);
  console.log("RewardDistributor:", rewardDistributor.address);
  console.log("ReputationSystem:", reputationSystem.address);
  console.log("PriceOracle:", priceOracle.address);
  console.log("ResourceVerifier:", resourceVerifier.address);
  console.log("VotingMechanism:", votingMechanism.address);
  console.log("SLAEnforcement:", slaEnforcement.address);
  console.log("EscrowManager:", escrowManager.address);
  console.log("ResourceMarketplace:", resourceMarketplace.address);
  console.log("TimelockController:", timelockController.address);
  console.log("DAOGovernance:", daoGovernance.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });