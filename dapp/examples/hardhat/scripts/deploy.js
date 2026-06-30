const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("deployer:", deployer.address);

  const Token = await hre.ethers.getContractFactory("MyToken");

  // ⚠️ Hardhat 6.x 默认会 estimateGas，OXN 上会失败；显式传 gasLimit 绕开
  const token = await Token.deploy(
    hre.ethers.parseUnits("1000000", 18),
    { gasLimit: 3_000_000n }
  );

  await token.waitForDeployment();
  console.log("MyToken deployed at:", await token.getAddress());
}

main().catch((e) => { console.error(e); process.exit(1); });
