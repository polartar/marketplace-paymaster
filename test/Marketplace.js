const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const { ethers } = require("hardhat");

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

  before(async function() {
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

    marketplace = await marketplaceFactory.deploy(tokenRegistery.address);
    await marketplace.deployed();
    
    await tokenRegistery.register(mockERC20.address, "mock",18 ,"mock", {value: parseEther("20")});

    await mockERC1155.setApprovalForAll(marketplace.address, true)
  })
  it("Should only list ERC721 or ERC1155", async function () {
    await expect(marketplace.list(owner.address, 1, parseEther("100"), 1, mockERC20.address)).to.be.reverted;
   });

  it("Should not list if the price is less than min price", async function () {
    await expect(marketplace.list(mockERC1155.address, 1, parseEther("0.9"), 1, mockERC20.address)).to.be.revertedWith("Price less than minimum");
  });
  
  it("Should not list with quantity = 0", async function () {
    await expect(marketplace.list(mockERC1155.address, 1, parseEther("1"), 0, mockERC20.address)).to.be.revertedWith("Quantity is 0");
   });

  it("Should not list when not insufficient balance", async function () {
    await expect(marketplace.list(mockERC1155.address, 1, parseEther("1"), 5, mockERC20.address)).to.be.revertedWith("insufficient balance");
   });
  
  it("Should list NFT", async function () {
    await marketplace.list(mockERC1155.address, 1, parseEther("1"), 3, mockERC20.address);
    expect(await marketplace.balanceOf(marketplace.address, 1)).to.be.equal(3);
    expect(await marketplace.balanceOf(owner.address, 1)).to.be.equal(1);

    const id = ethers.utils.solidityKeccak256(["address", "address", "uint256", "uint256"], [owner.address, mockERC1155.address, 1, parseEther("1")]);
    expect(await marketplace.isExistId(id)).to.be.equal(true);
   });

  it("Should get list with id", async function () {
    await marketplace.list(mockERC1155.address, 1, parseEther("1"), 3, mockERC20.address);
    const id = ethers.utils.solidityKeccak256(["address", "address", "uint256", "uint256"], [owner.address, mockERC1155.address, 1, parseEther("1")]);
   
    const list = await marketplace.getListing(id);
    expecdt(list.seller).to.be.equal(owner.address);
    expecdt(list.contractAddress).to.be.equal(mockERC1155.address);
    expecdt(list.price).to.be.equal(parseEther("1"));
    expecdt(list.quantity).to.be.equal(3);
  });

  it("Should buy the NFT with token", async function () {
    const id = ethers.utils.solidityKeccak256(["address", "address", "uint256", "uint256"], [owner.address, mockERC1155.address, 1, parseEther("1")]);
    await expect(marketplace.buyWithToken(id, mockERC20.address, 1)).to.be.revertedWith("not existing id");
    await marketplace.list(mockERC1155.address, 1, parseEther("1"), 3, mockERC20.address);

    mockAnotherERC20 = await mockERC20Factory.deploy();
    await mockAnotherERC20.deployed();
    await expect(marketplace.buyWithToken(id, mockAnotherERC20.address, 1)).to.be.revertedWith("not registerd token");

    await expect(marketplace.connect(other).buyWithToken(id, mockERC20.address, 1)).to.be.reverted;

    mockERC20.transfer(other.address, parseEther("1"));
    mockERC20.approve(marketplace.address, parseEther("1"));

    await expect(marketplace.connect(other).buyWithToken(id, mockERC20.address, 1)).to.be.changeTokenBalance(mockERC20, owner, parseEther("1"));
    expect(await mockERC1155.balanceOf(other.address)).to.be.equal(1);
  });

  it("Should buy the NFT with native asset", async function () {
    const id = ethers.utils.solidityKeccak256(["address", "address", "uint256", "uint256"], [owner.address, mockERC1155.address, 1, parseEther("1")]);
    await expect(marketplace.buy(id, mockERC20.address, 1, {value: parseEther("1")})).to.be.revertedWith("not existing id");
    await marketplace.list(mockERC1155.address, 1, parseEther("1"), 3, ethers.constants.AddressZero);

    mockAnotherERC20 = await mockERC20Factory.deploy();
    await mockAnotherERC20.deployed();

    await expect(marketplace.connect(other).buy(id, mockERC20.address, 1, {value: parseEther("0.9")})).to.be.reverted;

    await expect(marketplace.connect(other).buy(id, mockERC20.address, 1, {value: parseEther("1")})).to.be.changeEtherBalances(owner, parseEther("1"));
    expect(await mockERC1155.balanceOf(other.address)).to.be.equal(1);
  });
});
