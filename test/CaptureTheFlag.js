const { ethers } = require("hardhat");
const { expect } = require("chai");
const { RelayProvider } = require('@opengsn/gsn')
const { GsnTestEnvironment } = require('@opengsn/gsn/dist/GsnTestEnvironment' );
const { parseEther, formatEther } = require("ethers/lib/utils");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
const callThroughGsn = async (contract, provider) => {
  const transaction = await contract.captureFlag()
  const receipt = await provider.waitForTransaction(transaction.hash)
  const result = receipt.logs.
    map(entry => contract.interface.parseLog(entry)).
    filter(entry => entry != null)[0];
  return result.values['0']
};  // callThroughGsn


describe("CaptureTheFlag TEST", function () {
  let paymasterFactory;
  let paymaster;
  let accounts;

  before(async function() {
    accounts = await ethers.getSigners();
  })

  // beforeEach(async function() {
  //   paymaster = await paymasterFactory.deploy();
  //   await paymaster.deployed();
  // })

  it ('Runs without GSN', async () => {
    const CaptureTheFlag = await ethers.getContractFactory("CaptureTheFlag")
		const flag = await CaptureTheFlag.deploy('0x0000000000000000000000000000000000000000');
    await flag.deployed();

    const initBalance = await ethers.provider.getBalance(accounts[0].address);
		await flag.captureFlag();
    const afterBalance = await ethers.provider.getBalance(accounts[0].address);
    expect(initBalance).to.not.equal(afterBalance);
    // const res = await transaction.wait();
    // // expect(res.event).to.be.eq("FlagCaptured");
    // console.log(res)
    // console.log(res.logs[0].args[0])
    // expect(res.logs[0].args["]).to.be.eq("FlagCaptured");
		// assert.equal(res.logs[0].args["0"], 0, "Wrong initial last caller");

		// const res2 = await flag.captureFlag();
		// assert.equal(res2.logs[0].event, "FlagCaptured", "Wrong event");
		// assert.equal(res2.logs[0].args["0"], accounts[0], "Wrong second last caller");

		// const res3 = await flag.captureFlag();
		// assert.equal(res3.logs[0].event, "FlagCaptured", "Wrong event");
		// assert.equal(res3.logs[0].args["0"], res2.logs[0].args["0"],
		// 	"Wrong third last caller");

	});

  it ('Runs with GSN', async () => {
    const Web3HttpProvider = require( 'web3-providers-http')
    const CaptureTheFlag = require("../artifacts/contracts/CaptureTheFlag.sol/CaptureTheFlag.json")
    const NaivePaymaster = require("../artifacts/contracts/NaivePaymaster.sol/NaivePaymaster.json")

		let env = await GsnTestEnvironment.startGsn('localhost')
    const { forwarderAddress , relayHubAddress, paymasterAddress } = env.contractsDeployment
		const web3provider = new Web3HttpProvider('http://localhost:8545')
		const deploymentProvider = new ethers.providers.Web3Provider(web3provider)

    const factory = await ethers.getContractFactory("CaptureTheFlag", deploymentProvider.getSigner());

		const flag = await factory.deploy(forwarderAddress)
		await flag.deployed()

    const paymasterFactory = await ethers.getContractFactory("NaivePaymaster", deploymentProvider.getSigner());
    const paymaster = await paymasterFactory.deploy()
    await paymaster.deployed()

    await paymaster.setTarget(flag.address)
    await paymaster.setRelayHub(relayHubAddress)
    await paymaster.setTrustedForwarder(forwarderAddress)

    
    let gsnProvider = await RelayProvider.newProvider({
				provider: web3provider,
				config: { paymasterAddress: paymasterAddress},
         }).init()
    const provider = new ethers.providers.Web3Provider(gsnProvider)
		const acct = gsnProvider.newAccount()
		
		const contract = await new
			ethers.Contract(flag.address, CaptureTheFlag.abi,
				provider.getSigner(acct.address, acct.privateKey))
    await contract.captureFlag();
	}); 
});
