const hre = require("hardhat");
// deploy 后把地址填这里，或: TOKEN_ADDR=0x... npx hardhat run scripts/transfer.js --network oxn_testnet
const TOKEN_ADDR = "xxx";
const RECIPIENT = "0x000000000000000000000000000000000000dEaD";

async function main() {
  let tokenAddress;
  try {
    tokenAddress = hre.ethers.getAddress(TOKEN_ADDR);
  } catch {
    throw new Error(
      `无效的 TOKEN_ADDR: "${TOKEN_ADDR}"，请先运行 deploy 并把合约地址写入脚本`
    );
  }

  const [sender] = await hre.ethers.getSigners();
  const token = await hre.ethers.getContractAt(
    "MyToken",
    tokenAddress
  );

  console.log("sender:", sender.address);
  console.log("sender balance before:", (await token.balanceOf(sender.address)).toString());

  const tx = await token.transfer(
    RECIPIENT,
    hre.ethers.parseUnits("100", 18),
    { gasLimit: 500_000n }
  );
  console.log("tx:", tx.hash);
  await tx.wait();
  console.log("sender balance after:", (await token.balanceOf(sender.address)).toString());
}

main().catch((e) => { console.error(e); process.exit(1); });
