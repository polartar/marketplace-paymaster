const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const { ethers } = require("hardhat");

describe("Marketplace TEST", function () {
  let marketplaveFactory;

  let marketplae;
  let owner, other, author, curreny;

  before(async function() {
    [owner, other, author, curreny] = await ethers.getSigners();
    marketplaveFactory = await ethers.getContractFactory("Marketplace");
  })

  beforeEach(async function() {
    marketplae = await marketplaveFactory.deploy();
    await marketplae.deployed();
  })
  it("Should mint", async function () {
 
   });
  
});
