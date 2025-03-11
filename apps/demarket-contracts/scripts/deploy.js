const { ethers } = require("hardhat");

async function main() {
  const [owner, seller] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", owner.address);
  console.log(
    "Owner balance:",
    ethers.formatEther(await ethers.provider.getBalance(owner.address)),
    "ETH"
  );

  // Deploy DMX Token
  console.log("\nDeploying DMX Token...");
  const DMXToken = await ethers.getContractFactory("DMX");
  const dmxToken = await DMXToken.deploy(ethers.parseEther("1000"));
  await dmxToken.waitForDeployment();

  console.log("DMX Token deployed to:", dmxToken.target);

  // Transfer tokens to seller
  await dmxToken.transfer(seller.address, ethers.parseEther("100"));
  console.log(
    "Seller balance:",
    ethers.formatEther(await dmxToken.balanceOf(seller.address)),
    "DMX"
  );

  // Deploy DeMarket
  console.log("\nDeploying DeMarket...");
  const DeMarket = await ethers.getContractFactory("DeMarket");
  const deMarket = await DeMarket.deploy();
  await deMarket.waitForDeployment();

  console.log("DeMarket deployed to:", deMarket.target);

  // If DeMarket has an owner, check it
  try {
    console.log("DeMarket owner:", await deMarket.owner());
  } catch (error) {
    console.log("DeMarket contract does not have an owner function.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
