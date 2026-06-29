const hre = require("hardhat");

async function main() {
  const TOKEN_ADDR = process.env.TOKEN_ADDR;
  const RECIPIENT = process.env.RECIPIENT
    || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

  if (!TOKEN_ADDR) {
    throw new Error("请设置 TOKEN_ADDR 环境变量（来自 deploy.js 输出）");
  }

  const [sender] = await hre.ethers.getSigners();
  const token = await hre.ethers.getContractAt("MyToken", TOKEN_ADDR);

  const balBefore = await token.balanceOf(RECIPIENT);

  const amount = hre.ethers.parseUnits("100", 18);
  const tx = await token.transfer(RECIPIENT, amount, { gasLimit: 500_000n });
  console.log("tx hash:", tx.hash);
  await tx.wait();

  const balAfter = await token.balanceOf(RECIPIENT);
  console.log("recipient delta:", (balAfter - balBefore).toString());

  // 验证 calldata 已加密
  const raw = new hre.ethers.JsonRpcProvider(hre.network.config.url);
  const onchain = await raw.getTransaction(tx.hash);
  const isEncrypted =
    !onchain.data.startsWith("0xa9059cbb") &&
    (parseInt(onchain.data.slice(2, 4), 16) & 0xe0) === 0xa0;
  console.log("calldata encrypted:", isEncrypted ? "✅" : "❌（SDK 包裹失效）");
}

main().catch((e) => { console.error(e); process.exit(1); });
