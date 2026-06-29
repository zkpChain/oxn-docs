const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("deployer:", deployer.address);
  console.log("balance: ", hre.ethers.formatEther(balance), "TEST");

  const initialSupply = hre.ethers.parseUnits("1000000", 18);
  const Token = await hre.ethers.getContractFactory("MyToken");

  // OXN 上 estimateGas 不可用，显式指定 gasLimit
  const token = await Token.deploy(initialSupply, { gasLimit: 3_000_000n });
  await token.waitForDeployment();

  const addr = await token.getAddress();
  console.log("MyToken deployed at:", addr);
  console.log("\n复制到 transfer.js / 前端 abi:\n  TOKEN_ADDR =", addr);
}

main().catch((e) => { console.error(e); process.exit(1); });
