const { upgrades } = require("hardhat");
const hre = require("hardhat");

async function main() {
  // We get the contract to deploy
  const marketplaceFactory = await hre.ethers.getContractFactory("Marketplace");
  const marketplace = await upgrades.deployProxy(marketplaceFactory, ["TokenRegistery Contract"], {kind: "uups"});

  await marketplace.deployed();

  console.log("marketplace deployed to:", marketplace.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
