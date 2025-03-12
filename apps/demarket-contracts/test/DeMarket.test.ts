import { ethers } from "hardhat";
import { expect } from "chai";

describe("DeMarket", function () {
  let deMarket: any;
  let seller: any;
  let buyer: any;
  let token: any;

  beforeEach(async function () {
    // Get test accounts
    [seller, buyer] = await ethers.getSigners();

    // Deploy an ERC-20 mock contract
    const Token = await ethers.getContractFactory("ERC20Mock");

    // Deploy token with initial balance for seller
    token = await Token.deploy(
      "Test Token", // Token name
      "TTK", // Token symbol
      seller.address, // Initial account to receive tokens
      ethers.parseEther("1000") // Initial balance (1000 tokens in wei)
    );
    await token.waitForDeployment();

    // Deploy the DeMarket contract
    const DeMarket = await ethers.getContractFactory("DeMarket");
    deMarket = await DeMarket.deploy();
    await deMarket.waitForDeployment();
  });

  describe("listItem", function () {
    it("should list an item for sale", async function () {
      const price = ethers.parseEther("1"); // 1 ETH (in wei)
      const quantity = ethers.parseEther("10"); // 10 tokens (in wei)
      const name = "Test Item";

      // Approve the DeMarket contract to transfer tokens on behalf of the seller
      await token.connect(seller).approve(deMarket.target, quantity);

      // List an item and verify the event is emitted with correct arguments
      await expect(
        deMarket.connect(seller).listItem(token.target, name, price, quantity)
      )
        .to.emit(deMarket, "ItemListed")
        .withArgs(1, seller.address, token.target, name, price, quantity);
    });
  });

  describe("purchaseItem", function () {
    it("should allow a buyer to purchase an item", async function () {
      // Seller lists 10 tokens at 1 ETH each
      const price = ethers.parseEther("1");
      const quantity = ethers.parseEther("10");
      const name = "Test Item";

      await token.connect(seller).approve(deMarket.target, quantity);
      await deMarket
        .connect(seller)
        .listItem(token.target, name, price, quantity);

      // Buyer purchases 5 tokens
      const purchaseQuantity = 5;
      const totalPrice = price * BigInt(purchaseQuantity); // 5 ETH in wei

      // Verify the purchase transaction emits the correct event
      await expect(
        deMarket
          .connect(buyer)
          .purchaseItem(1, purchaseQuantity, { value: totalPrice })
      )
        .to.emit(deMarket, "ItemPurchased")
        .withArgs(1, buyer.address, purchaseQuantity);

      // Verify seller's balance in the contract increased by 5 ETH
      const sellerEarned = await deMarket.balances(seller.address);
      expect(sellerEarned).to.equal(totalPrice);

      // Verify the item quantity decreased by the purchased amount
      const listedItem = await deMarket.items(1);
      expect(listedItem.quantity).to.equal(quantity - BigInt(purchaseQuantity));
    });
  });

  describe("withdrawFunds", function () {
    it("should allow seller to withdraw funds", async function () {
      // Seller lists 10 tokens at 1 ETH each
      const price = ethers.parseEther("1");
      const quantity = ethers.parseEther("10");
      const name = "Test Item";

      await token.connect(seller).approve(deMarket.target, quantity);
      await deMarket
        .connect(seller)
        .listItem(token.target, name, price, quantity);

      // Buyer purchases 5 tokens
      const purchaseQuantity = 5;
      const totalPrice = price * BigInt(purchaseQuantity);
      await deMarket
        .connect(buyer)
        .purchaseItem(1, purchaseQuantity, { value: totalPrice });

      // Verify seller's balance in the contract is 5 ETH
      const sellerEarned = await deMarket.balances(seller.address);
      expect(sellerEarned).to.equal(totalPrice);

      // Seller withdraws funds
      const tx = await deMarket.connect(seller).withdrawFunds();
      await tx.wait();

      // Verify seller's balance in the contract is now 0
      const sellerBalanceAfter = await deMarket.balances(seller.address);
      expect(sellerBalanceAfter).to.equal(0);
    });
  });

  describe("authorizeItem", function () {
    it("should authorize an item using an EIP-712 signature", async function () {
      // Seller lists 10 tokens at 1 ETH each
      const price = ethers.parseEther("1");
      const quantity = ethers.parseEther("10");
      const name = "Test Item";

      await token.connect(seller).approve(deMarket.target, quantity);
      await deMarket
        .connect(seller)
        .listItem(token.target, name, price, quantity);

      // Prepare the EIP-712 message to sign
      const nonce = await deMarket.nonces(seller.address);
      const network = await ethers.provider.getNetwork();
      const domain = {
        name: "Marketplace",
        version: "1",
        chainId: network.chainId,
        verifyingContract: deMarket.target,
      };
      const types = {
        ItemAuthorization: [
          { name: "itemId", type: "uint256" },
          { name: "quantity", type: "uint256" },
          { name: "seller", type: "address" },
          { name: "nonce", type: "uint256" },
        ],
      };
      const value = {
        itemId: 1,
        quantity: quantity, // Quantity in wei (already BigInt)
        seller: seller.address,
        nonce: nonce, // Nonce (already BigInt)
      };

      // Sign the EIP-712 message
      const signature = await seller.signTypedData(domain, types, value);

      // Verify the authorization transaction emits the correct event
      await expect(
        deMarket.connect(seller).authorizeItem(1, quantity, signature)
      ).to.emit(deMarket, "ItemAuthorized");
    });
  });
});
