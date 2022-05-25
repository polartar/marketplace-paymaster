const { upgrades } = require("hardhat");
const hre = require("hardhat");

async function main() {
  // We get the contract to deploy
  const paymasterFactory = await hre.ethers.getContractFactory("NaivePaymaster");
  const paymaster = await paymasterFactory.deploy();

  await paymaster.deployed();

  console.log("paymaster deployed to:", paymaster.address);

  // config paymaster. This should be replaced
  await paymaster.setRelayHub("0xAa3E82b4c4093b4bA13Cb5714382C99ADBf750cA");
  await paymaster.setTrustedForwarder("0xeB230bF62267E94e657b5cbE74bdcea78EB3a5AB");
  await paymaster.setTarget("0x6D394936E3abcD44b20A5E24280Cb4b781d07Bac");

  // should transfer some balance
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
