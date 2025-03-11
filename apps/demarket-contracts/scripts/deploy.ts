import { ethers } from "hardhat";

/**
 * Deploys the DMX Token contract with an initial supply.
 * @returns {Promise<Contract>} - The deployed DMX Token contract.
 */
async function deployDMXToken() {
  console.log("\nDeploying DMX Token...");
  const DMXToken = await ethers.getContractFactory("DMX");
  // Initial supply is set to 1000 tokens (in wei)
  const initialSupply = ethers.parseEther("1000");
  const dmxToken = await DMXToken.deploy(initialSupply);
  await dmxToken.waitForDeployment();
  console.log("DMX Token deployed to:", dmxToken.target);
  return dmxToken;
}

/**
 * Deploys the DeMarket contract.
 * @returns {Promise<Contract>} - The deployed DeMarket contract.
 */
async function deployDeMarket() {
  console.log("\nDeploying DeMarket...");
  const DeMarket = await ethers.getContractFactory("DeMarket");
  const deMarket = await DeMarket.deploy();
  await deMarket.waitForDeployment();
  console.log("DeMarket deployed to:", deMarket.target);
  return deMarket;
}

async function main() {
  const [owner, seller] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", owner.address);
  console.log(
    "Owner balance:",
    ethers.formatEther(await ethers.provider.getBalance(owner.address)),
    "ETH"
  );

  // Deploy DMX Token
  const dmxToken = await deployDMXToken();

  // Transfer 100 DMX tokens to the seller for testing
  const transferAmount = ethers.parseEther("100");
  const transferTx = await dmxToken.transfer(seller.address, transferAmount);
  await transferTx.wait();
  console.log(
    "Seller balance:",
    ethers.formatEther(await dmxToken.balanceOf(seller.address)),
    "DMX"
  );

  // Deploy DeMarket
  const deMarket = await deployDeMarket();

  // Check if the DeMarket contract has an owner() function
  try {
    const ownerAddress = await deMarket.owner();
    console.log("DeMarket owner:", ownerAddress);
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
