const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
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
  let paymasterAddress, forwarderAddress;
  before(async function() {
    let env = await GsnTestEnvironment.startGsn('localhost')

    paymasterAddress = env.contractsDeployment.paymasterAddress;
    forwarderAddress = env.contractsDeployment.forwarderAddress;
    [owner, other, author, curreny] = await ethers.getSigners();
    marketplaceFactory = await ethers.getContractFactory("Marketplace");
    mockERC1155Factory = await ethers.getContractFactory("MockERC1155");
    mockERC721Factory = await ethers.getContractFactory("MockERC721");
    tokenRegistryFactory = await ethers.getContractFactory("TokenRegistry");
    mockERC20Factory = await ethers.getContractFactory("MockERC20");
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

  // it("Should only let admin upgrade", async function () {
  //   let v2Factory = await ethers.getContractFactory("Marketplace2", other);
  //   await expect(upgrades.upgradeProxy(marketplace.address, v2Factory)).to.be.reverted;

  //   v2Factory = await ethers.getContractFactory("Marketplace2", owner);
  //   const v2 = await upgrades.upgradeProxy(marketplace.address, v2Factory);

  //   expect(await v2.name()).to.be.equal("Marketplace2");
  // });

  // it("Should only list ERC721 or ERC1155", async function () {
  //   await expect(marketplace.list(owner.address, 1, parseEther("100"), 1, mockERC20.address)).to.be.reverted;
  //  });

  // it("Should not list if the price is less than min price", async function () {
  //   await expect(marketplace.list(mockERC1155.address, 1, parseEther("0.9"), 1, mockERC20.address)).to.be.revertedWith("Price less than minimum");
  // });
  
  // it("Should not list with quantity = 0", async function () {
  //   await expect(marketplace.list(mockERC1155.address, 1, parseEther("1"), 0, mockERC20.address)).to.be.revertedWith("Quantity is 0");
  //  });

  // it("Should not list when not insufficient balance", async function () {
  //   await expect(marketplace.list(mockERC1155.address, 1, parseEther("1"), 5, mockERC20.address)).to.be.revertedWith("insufficient balance");
  //  });
  
  // it("Should list NFT", async function () {
  //   await marketplace.list(mockERC1155.address, 1, parseEther("1"), 3, mockERC20.address);
  //   expect(await mockERC1155.balanceOf(marketplace.address, 1)).to.be.equal(3);
  //   expect(await mockERC1155.balanceOf(owner.address, 1)).to.be.equal(1);

  //   const id = ethers.utils.solidityKeccak256(["address", "address", "uint256", "uint256"], [owner.address, mockERC1155.address, 1, parseEther("1")]);

  //   expect(await marketplace.isExistId(id)).to.be.equal(true);
  //  });

  // it("Should get list with id", async function () {
  //   await marketplace.list(mockERC1155.address, 1, parseEther("1"), 3, mockERC20.address);
  //   const id = ethers.utils.solidityKeccak256(["address", "address", "uint256", "uint256"], [owner.address, mockERC1155.address, 1, parseEther("1")]);
   
  //   const list = await marketplace.getListing(id);
  //   expect(list.seller).to.be.equal(owner.address);
  //   expect(list.contractAddress).to.be.equal(mockERC1155.address);
  //   expect(list.price).to.be.equal(parseEther("1"));
  //   expect(list.quantity).to.be.equal(3);
  // });

  // it("Should buy the NFT with token", async function () {
  //   const id = ethers.utils.solidityKeccak256(["address", "address", "uint256", "uint256"], [owner.address, mockERC1155.address, 1, parseEther("1")]);
  //   await expect(marketplace.connect(other).buyWithToken(id, 1)).to.be.revertedWith("not existing id");
  //   await marketplace.list(mockERC1155.address, 1, parseEther("1"), 3, mockERC20.address);

  //   mockAnotherERC20 = await mockERC20Factory.deploy();
  //   await mockAnotherERC20.deployed();

  //   await expect(marketplace.connect(other).buyWithToken(id, 1)).to.be.reverted;

  //   mockERC20.transfer(other.address, parseEther("4"));
  //   mockERC20.connect(other).approve(marketplace.address, parseEther("4"));

  //   await expect(() => marketplace.connect(other).buyWithToken(id, 1)).to.be.changeTokenBalance(mockERC20, owner, parseEther("1"));
  //   expect(await mockERC1155.balanceOf(other.address, 1)).to.be.equal(1);
  //   expect(await mockERC1155.balanceOf(marketplace.address, 1)).to.be.equal(2);

  //   await marketplace.connect(other).buyWithToken(id, 1);
  //   await expect(marketplace.connect(other).buyWithToken(id, 2)).to.be.revertedWith("Quantity unavailable");
  // });

  // it("Should buy the NFT with native asset", async function () {
  //   const id = ethers.utils.solidityKeccak256(["address", "address", "uint256", "uint256"], [owner.address, mockERC1155.address, 1, parseEther("1")]);
  //   await expect(marketplace.buy(id, 1, {value: parseEther("1")})).to.be.revertedWith("not existing id");
  //   await marketplace.list(mockERC1155.address, 1, parseEther("1"), 3, ethers.constants.AddressZero);

  //   mockAnotherERC20 = await mockERC20Factory.deploy();
  //   await mockAnotherERC20.deployed();

  //   await expect(marketplace.connect(other).buy(id, 1, {value: parseEther("0.9")})).to.be.reverted;

  //   await expect(() => marketplace.connect(other).buy(id, 1, {value: parseEther("1")})).to.be.changeEtherBalance(owner, parseEther("1"));
  //   expect(await mockERC1155.balanceOf(other.address, 1)).to.be.equal(1);
  // });

  // it("Should not cancel the list when not owner", async function () {
  //   const id = ethers.utils.solidityKeccak256(["address", "address", "uint256", "uint256"], [owner.address, mockERC1155.address, 1, parseEther("1")]);
  //   await expect(marketplace.cancelList(id)).to.be.revertedWith("not existing id");
  //   await marketplace.list(mockERC1155.address, 1, parseEther("1"), 3, mockERC20.address);

  //   await expect(marketplace.connect(other).cancelList(id)).to.be.revertedWith("not list owner");

  //   // check balance before cancel the list
  //   expect(await mockERC1155.balanceOf(owner.address, 1)).to.be.equal(1);
  //   await marketplace.cancelList(id);
  //   // check balance after cancel the list
  //   expect(await mockERC1155.balanceOf(owner.address, 1)).to.be.equal(4);

  //   await expect(marketplace.connect(other).cancelList(id)).to.be.revertedWith("not existing id");
  // });

  // it("Should get all listings", async function () {
  //   const id1 = ethers.utils.solidityKeccak256(["address", "address", "uint256", "uint256"], [owner.address, mockERC1155.address, 1, parseEther("1")]);
  //   await marketplace.list(mockERC1155.address, 1, parseEther("1"), 3, mockERC20.address);

  //   mockERC1155.connect(other).mint(2, 4)
  //   mockERC1155.connect(other).setApprovalForAll(marketplace.address, true);
  //   const id2 = ethers.utils.solidityKeccak256(["address", "address", "uint256", "uint256"], [other.address, mockERC1155.address, 2, parseEther("1")]);
  //   await marketplace.connect(other).list(mockERC1155.address, 2, parseEther("1"), 2, mockERC20.address);

  //   const listings = await marketplace.getListings();
  //   expect(listings.length).to.be.equal(2);
  // });

    it('should not pay for gas (balance=0)', async () => {
      let from
      const web3provider = new Web3HttpProvider('http://localhost:8545')
      const deploymentProvider= new ethers.providers.Web3Provider(web3provider)

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
      await owner.sendTransaction({
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
