const { ethers } = require("hardhat");
const { expect } = require("chai");
const { RelayProvider } = require('@opengsn/gsn')
const { GsnTestEnvironment } = require('@opengsn/gsn/dist/GsnTestEnvironment' );
const { parseEther } = require("ethers/lib/utils");

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

		const { forwarderAddress , relayHubAddress } = env.contractsDeployment
		const web3provider = new Web3HttpProvider('http://localhost:8545')
		const deploymentProvider = new ethers.providers.Web3Provider(web3provider)

    // const factory = new ethers.ContractFactory(
		// 	CaptureTheFlag.abi,
		// 	CaptureTheFlag.bytecode,
		// 	deploymentProvider.getSigner())
    const factory = await ethers.getContractFactory("CaptureTheFlag", deploymentProvider.getSigner());

		const flag = await factory.deploy(forwarderAddress)
		await flag.deployed()

    // const paymasterFactory = new ethers.ContractFactory(
		// 	NaivePaymaster.abi,
		// 	NaivePaymaster.bytecode,
		// 	deploymentProvider.getSigner()
		// )
    const paymasterFactory = await ethers.getContractFactory("NaivePaymaster", deploymentProvider.getSigner());

    const paymaster = await paymasterFactory.deploy()
    await paymaster.deployed()

    await paymaster.setTarget(flag.address)
    await paymaster.setRelayHub(relayHubAddress)
    await paymaster.setTrustedForwarder(forwarderAddress)

		// web3.eth.sendTransaction({
		// 	from:accounts[0],
		// 	to:paymaster.address,
		// 	value:1e18})
    await accounts[0].sendTransaction({
      to: paymaster.address,
      value: parseEther("0.1")
    })
    Gsn = require("@opengsn/provider")

    let gsnProvider = await RelayProvider.newProvider({
				provider: web3provider,
				config: { paymasterAddress: paymaster.address} }).init()
    const provider = new ethers.providers.Web3Provider(gsnProvider)
		const acct = provider.provider.newAccount()
		
    // const acct2 = provider.provider.newAccount()
    // const account = new ethers.Wallet(Buffer.from("1".repeat(64), "hex"));
    // gsnProvider.addAccount(account.privateKey);
    // etherProvider = new ethers.providers.Web3Provider(gsnProvider);
    // signer = etherProvider.getSigner(account.address);
    // console.log("Balance", (await etherProvider.getBalance(account.address)).toString())
    // await flag.connect(signer).captureFlag();

    expect(await paymaster.trustedForwarder()).to.equal(forwarderAddress);
    expect(await flag.isTrustedForwarder(forwarderAddress)).to.equal(true);
		const contract = await new
			ethers.Contract(flag.address, CaptureTheFlag.abi,
				provider.getSigner(acct.address, acct.privateKey))

		await callThroughGsn(contract, provider);
	}); 
});
