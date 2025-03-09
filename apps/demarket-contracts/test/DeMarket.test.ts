import { ethers } from "hardhat";
import { expect } from "chai";

describe("DeMarket", function () {
  let deMarket: any;
  let owner: any;
  let seller: any;
  let buyer: any;
  let token: any;

  beforeEach(async function () {
    // Get test accounts
    [owner, seller, buyer] = await ethers.getSigners();

    // Deploy an ERC-20 mock contract
    const Token = await ethers.getContractFactory("ERC20Mock");

    // Pass constructor arguments as an array
    token = await Token.deploy(
      "Test Token", // name
      "TTK", // symbol
      seller.address, // initialAccount
      ethers.parseEther("1000") // initialBalance
    );

    await token.waitForDeployment();

    // Deploy the DeMarket contract
    const DeMarket = await ethers.getContractFactory("DeMarket");
    deMarket = await DeMarket.deploy(owner.address);
    await deMarket.waitForDeployment();
  });

  describe("listItem", function () {
    it("should list an item for sale", async function () {
      const price = ethers.parseEther("1");
      const quantity = ethers.parseEther("10");

      // Approve the DeMarket contract to transfer tokens on behalf of the seller
      await token.connect(seller).approve(deMarket.target, quantity);

      // List an item
      await expect(deMarket.connect(seller).listItem(token.target, price, quantity))
        .to.emit(deMarket, "ItemListed")
        .withArgs(1, seller.address, token.target, price, quantity);
    });
  });
});