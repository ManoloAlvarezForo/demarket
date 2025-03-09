const { ethers } = require("hardhat");

async function main() {
  // Obtener las cuentas disponibles
  const [owner, seller, buyer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", owner.address);

  // Desplegar el contrato ERC20Mock
  const Token = await ethers.getContractFactory("ERC20Mock");
  const token = await Token.deploy("Test Token", "TTK", seller.address, ethers.parseEther("1000"));
  await token.waitForDeployment();

  console.log("ERC20Mock deployed to:", token.target);

  // Desplegar el contrato DeMarket
  const DeMarket = await ethers.getContractFactory("DeMarket");
  const deMarket = await DeMarket.deploy(owner.address);
  await deMarket.waitForDeployment();

  console.log("DeMarket deployed to:", deMarket.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });