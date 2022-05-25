const { expect } = require("chai");
const { parseEther, formatEther } = require("ethers/lib/utils");
const { ethers, upgrades } = require("hardhat");
const { RelayProvider } = require('@opengsn/provider')
const { GsnTestEnvironment } = require('@opengsn/dev' )
const Web3HttpProvider = require( 'web3-providers-http');
const { Contract } = require("ethers");

describe("Marketplace TEST", function () {
  let marketplaceFactory;
  let mockERC1155Factory;
  let mockERC721Factory;
  let tokenRegistryFactory;
  let mockERC20Factory;

  let marketplace;
  let mockERC1155;
  let mockERC721;
  let tokenRegistery;
  let mockERC20;
  let owner, other, author, curreny;
  let paymasterAddress, forwarderAddress, relayHubAddress;
  before(async function() {
    let env = await GsnTestEnvironment.startGsn('localhost')
    
    paymasterAddress = env.contractsDeployment.paymasterAddress;
    forwarderAddress = env.contractsDeployment.forwarderAddress;
    relayHubAddress = env.contractsDeployment.relayHubAddress;
    [owner, other, author, curreny] = await ethers.getSigners();
    marketplaceFactory = await ethers.getContractFactory("Marketplace");
    mockERC1155Factory = await ethers.getContractFactory("MockERC1155");
    mockERC721Factory = await ethers.getContractFactory("MockERC721");
    tokenRegistryFactory = await ethers.getContractFactory("TokenRegistry");
    mockERC20Factory = await ethers.getContractFactory("MockERC20");

    await author.sendTransaction({
      to: owner.address,
      value: parseEther("1")
    })
  })

  beforeEach(async function() {
    mockERC1155 = await mockERC1155Factory.deploy();
    await mockERC1155.deployed();
   
    mockERC721 = await mockERC721Factory.deploy();
    await mockERC721.deployed();

    tokenRegistery = await tokenRegistryFactory.deploy();
    await tokenRegistery.deployed();

    mockERC20 = await mockERC20Factory.deploy();
    await mockERC20.deployed();

    await mockERC1155.mint(1, 4);

    marketplace = await upgrades.deployProxy(marketplaceFactory, [tokenRegistery.address, forwarderAddress], { kind: "uups"});
    await marketplace.deployed();
    
    await tokenRegistery.register(mockERC20.address, "mock",18 ,"mock", {value: parseEther("20")});

    await mockERC1155.setApprovalForAll(marketplace.address, true)
  })

  it('should not pay for gas (balance=0)', async () => {
    let from
    const web3provider = new Web3HttpProvider('http://localhost:8545')
    const deploymentProvider= new ethers.providers.Web3Provider(web3provider)

    const paymasterFactory = await ethers.getContractFactory("NaivePaymaster", deploymentProvider.getSigner());
    const paymaster = await paymasterFactory.deploy()
    await paymaster.deployed()

    await paymaster.setTarget(marketplace.address)
    await paymaster.setRelayHub(relayHubAddress)
    await paymaster.setTrustedForwarder(forwarderAddress)
    paymasterAddress = paymaster.address;
    
    const MarketplaceABI = require("../artifacts/contracts/Marketplace.sol/Marketplace.json").abi;
    let gsnContract = new Contract(marketplace.address, MarketplaceABI, deploymentProvider.getSigner());
    const config = await {
        paymasterAddress: paymasterAddress,
        auditorsCount: 0
    }
    let gsnProvider = RelayProvider.newProvider({provider: web3provider, config})
    await gsnProvider.init()
    // The above is the full provider configuration. can use the provider returned by startGsn:

    const account = new ethers.Wallet(Buffer.from('1'.repeat(64),'hex'), new ethers.providers.Web3Provider(gsnProvider))
    gsnProvider.addAccount(account.privateKey)
    from = account.address

    // gsnProvider is now an rpc provider with GSN support. make it an ethers provider:
    const etherProvider = new ethers.providers.Web3Provider(gsnProvider)
    const signer = etherProvider.getSigner(from);
    gsnContract = gsnContract.connect(signer)

    //transfer the nft to new accout
    await mockERC1155.setApprovalForAll(from, true);

    // for NFT approval, send some funds to new account
    await other.sendTransaction({
      to: paymasterAddress,
      value: parseEther("1")
    })
    await other.sendTransaction({
      to: from,
      value: parseEther("1")
    })

    await mockERC1155.connect(account).setApprovalForAll(marketplace.address, true);
    await mockERC1155.safeTransferFrom(owner.address, from, 1, 3, ethers.utils.formatBytes32String(""));

    const initBalance = await ethers.provider.getBalance(from);
    await gsnContract.list(mockERC1155.address, 1, parseEther("1"), 3, mockERC20.address);
    const afterBalance = await ethers.provider.getBalance(from);
    expect(initBalance).to.be.equal(afterBalance)
    expect(await mockERC1155.balanceOf(gsnContract.address, 1)).to.be.equal(3);
    expect(await mockERC1155.balanceOf(owner.address, 1)).to.be.equal(1);

    const id = ethers.utils.solidityKeccak256(["address", "address", "uint256", "uint256"], [from, mockERC1155.address, 1, parseEther("1")]);

    expect(await gsnContract.isExistId(id)).to.be.equal(true);
  })
});
