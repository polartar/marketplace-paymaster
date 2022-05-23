const { upgrades } = require("hardhat");
const hre = require("hardhat");

async function main() {
  // We get the contract to deploy
  const CaptureTheFlagFactory = await hre.ethers.getContractFactory("CaptureTheFlag");
  console.log("start")
  const captureTheFlag = await CaptureTheFlagFactory.deploy("0xeB230bF62267E94e657b5cbE74bdcea78EB3a5AB");

  await captureTheFlag.deployed();

  console.log("CaptureTheFlag deployed to:", captureTheFlag.address);

  // concig CaptureTheFlag

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
