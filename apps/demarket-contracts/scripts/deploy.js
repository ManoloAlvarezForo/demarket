const { ethers } = require("hardhat");

async function main() {
  // Get available accounts
  const [owner, seller, buyer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", owner.address);
  console.log(
    "Owner balance:",
    ethers.formatEther(await ethers.provider.getBalance(owner.address)),
    "ETH"
  );

  // Deploy the ERC20Mock contract
  console.log("\nDeploying ERC20Mock...");
  const Token = await ethers.getContractFactory("ERC20Mock");
  const token = await Token.deploy(
    "Test Token",
    "TTK",
    seller.address,
    ethers.parseEther("1000")
  );
  await token.waitForDeployment();

  console.log("ERC20Mock deployed to:", token.target);
  console.log(
    "Seller balance:",
    ethers.formatEther(await token.balanceOf(seller.address)),
    "TTK"
  );

  // Deploy the DeMarket contract
  console.log("\nDeploying DeMarket...");
  const DeMarket = await ethers.getContractFactory("DeMarket");
  const deMarket = await DeMarket.deploy();
  await deMarket.waitForDeployment();

  console.log("DeMarket deployed to:", deMarket.target);

  // Verify the owner of the DeMarket contract
//   console.log("DeMarket owner:", await deMarket.owner());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
