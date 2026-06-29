import { ethers } from "ethers";
import { wrapEthersSigner } from "@oasisprotocol/sapphire-ethers-v6";

// ---- 配置 ----
const RPC = process.env.OXN_RPC || "https://rpc.bout.network";
const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const TOKEN_ADDR =
  process.env.TOKEN_ADDR ||
  "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // 改成你最新部署的合约
const TO = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const AMOUNT = ethers.parseUnits("100", 18); // 转 100 个代币（18 位精度）

const ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

const provider = new ethers.JsonRpcProvider(RPC);

// 关键：用 OXN SDK 包裹 signer，交易 calldata 会被自动加密
const signer = wrapEthersSigner(new ethers.Wallet(PRIVATE_KEY, provider));

const token = new ethers.Contract(TOKEN_ADDR, ABI, signer);
const from = await signer.getAddress();

async function main() {
  console.log("from:", from);
  console.log("to:  ", TO);
  console.log("amount:", AMOUNT.toString());

  console.log("\n转账前余额:");
  console.log("  from:", (await token.balanceOf(from)).toString());
  console.log("  to:  ", (await token.balanceOf(TO)).toString());

  // 发送加密 transfer（OXN 上 estimateGas 不可用，显式指定 gasLimit）
  const tx = await token.transfer(TO, AMOUNT, { gasLimit: 500_000n });
  console.log("\ntx hash:", tx.hash);
  const receipt = await tx.wait();
  console.log("status:", receipt.status === 1 ? "success" : "failed");

  console.log("\n转账后余额:");
  console.log("  from:", (await token.balanceOf(from)).toString());
  console.log("  to:  ", (await token.balanceOf(TO)).toString());

  // 验证链上 input 是否为加密信封
  const onchain = await provider.getTransaction(tx.hash);
  const input = onchain.data;
  console.log("\n链上 input 前 80 字符:", input.slice(0, 80), "...");

  // 明文 transfer 的 calldata 会以函数选择器 0xa9059cbb 开头
  const plainSelector = "0xa9059cbb";
  if (input.startsWith(plainSelector)) {
    console.log("=> 这是【明文】交易（未加密）");
  } else {
    console.log("=> 这是【加密信封】交易（calldata 已加密）✅");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
