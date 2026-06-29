import { readFileSync, existsSync } from "node:fs";
import { resolve as resolvePath } from "node:path";
import { ethers } from "ethers";
import solc from "solc";
import {
  wrapEthersSigner,
  wrapEthersProvider,
} from "@oasisprotocol/sapphire-ethers-v6";

// ---------- 配置 ----------
const RPC = process.env.OXN_RPC || "https://rpc.bout.network";
const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const RECIPIENT = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const SOURCE = "MyToken.sol";
const CONTRACT_NAME = "MyToken";

const INITIAL_SUPPLY = ethers.parseUnits("1000000", 18); // 部署初始发行量
const ETH_AMOUNT = ethers.parseEther("1");               // 普通 ETH 转账金额
const TOKEN_AMOUNT = ethers.parseUnits("100", 18);       // 机密转账代币数量

// OXN 上 estimateGas 会 panic，统一手动指定 gas，绕开估算
const DEPLOY_GAS = 3_000_000n;
const TX_GAS = 500_000n;

const TRANSFER_SELECTOR = "0xa9059cbb"; // 明文 transfer(address,uint256) 选择器

// ---------- 工具 ----------
let step = 0;
function head(title) {
  step += 1;
  console.log(`\n========== [${step}] ${title} ==========`);
}
function ok(msg) {
  console.log("  ✅", msg);
}
function assert(cond, msg) {
  if (!cond) throw new Error("断言失败: " + msg);
  ok(msg);
}
function warn(msg) {
  console.log("  ⚠️ ", msg);
}

// solc import 解析：@openzeppelin/contracts/... → node_modules/@openzeppelin/contracts/...
function resolveImport(path) {
  if (path.startsWith("@") || !path.startsWith(".")) {
    const fullPath = resolvePath("node_modules", path);
    if (existsSync(fullPath)) {
      return { contents: readFileSync(fullPath, "utf8") };
    }
  }
  return { error: "Not found: " + path };
}

function compileContract(sourcePath, contractName) {
  const input = {
    language: "Solidity",
    sources: { [sourcePath]: { content: readFileSync(sourcePath, "utf8") } },
    settings: {
      outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
    },
  };
  const output = JSON.parse(
    solc.compile(JSON.stringify(input), { import: resolveImport })
  );
  const fatal = (output.errors || []).filter((e) => e.severity === "error");
  if (fatal.length) {
    throw new Error(
      "solc errors:\n" + fatal.map((e) => e.formattedMessage).join("\n")
    );
  }
  const c = output.contracts[sourcePath][contractName];
  return { abi: c.abi, bytecode: "0x" + c.evm.bytecode.object };
}

// ---------- 主流程 ----------
const rawProvider = new ethers.JsonRpcProvider(RPC);
// 包裹 provider：让 view-call(eth_call) 走加密路径
const provider = wrapEthersProvider(rawProvider);
// 包裹 signer：让交易 calldata 自动加密
const signer = wrapEthersSigner(new ethers.Wallet(PRIVATE_KEY, rawProvider));
const me = await signer.getAddress();

async function main() {
  console.log("RPC:", RPC);
  console.log("sender:", me);

  // 0. 基本连通性
  head("检查链连通性");
  const net = await rawProvider.getNetwork();
  ok(`chainId = ${net.chainId}`);
  const myBal = await rawProvider.getBalance(me);
  ok(`sender ETH 余额 = ${ethers.formatEther(myBal)}`);

  // 1. eth_estimateGas 探针（已知 OXN 上可能 panic）
  //    不静默绕过：显式探测并报告，便于发现 gateway 配置问题。
  head("eth_estimateGas 探针");
  let estimateGasWorks = false;
  try {
    const est = await signer.estimateGas({ to: RECIPIENT, value: ETH_AMOUNT });
    estimateGasWorks = true;
    ok(`estimateGas 可用，预估 = ${est.toString()} gas`);
  } catch (e) {
    const reason = (e?.shortMessage || e?.message || String(e)).split("\n")[0];
    warn(`estimateGas 不可用：${reason}`);
    warn("已知现象：本测试改用手动 gasLimit 绕过；如生产环境需依赖估算，请排查镜像 / gateway");
  }

  // 2. 普通 ETH 转账（明文，无 calldata）
  head("普通 ETH 转账");
  const before = await rawProvider.getBalance(RECIPIENT);
  const ethTx = await signer.sendTransaction({
    to: RECIPIENT,
    value: ETH_AMOUNT,
    gasLimit: 100_000n,
  });
  console.log("  tx:", ethTx.hash);
  const ethRcpt = await ethTx.wait();
  assert(ethRcpt.status === 1, "ETH 转账成功");
  const after = await rawProvider.getBalance(RECIPIENT);
  assert(
    after - before === ETH_AMOUNT,
    `收款方增加 ${ethers.formatEther(after - before)} ETH`
  );

  // 2. 部署标准 ERC20（从 MyToken.sol 实时编译）
  head("部署 ERC20 合约");
  console.log(`  编译 ${SOURCE} (solc ${solc.version()})...`);
  const { abi, bytecode } = compileContract(SOURCE, CONTRACT_NAME);
  ok(`bytecode = ${(bytecode.length - 2) / 2} bytes`);
  const factory = new ethers.ContractFactory(abi, bytecode, signer);
  const contract = await factory.deploy(INITIAL_SUPPLY, {
    gasLimit: DEPLOY_GAS,
  });
  await contract.waitForDeployment();
  const tokenAddr = await contract.getAddress();
  ok(`合约部署成功: ${tokenAddr}`);
  const code = await rawProvider.getCode(tokenAddr);
  assert(code !== "0x", "链上存在合约字节码");

  // 3. 查询 name / symbol / totalSupply（加密 eth_call）
  head("查询 ERC20 元数据 (机密 view-call)");
  const token = new ethers.Contract(tokenAddr, abi, provider);
  const name = await token.name();
  const symbol = await token.symbol();
  const totalSupply = await token.totalSupply();
  ok(`name        = ${name}`);
  ok(`symbol      = ${symbol}`);
  ok(`totalSupply = ${totalSupply.toString()}`);
  assert(totalSupply === INITIAL_SUPPLY, "totalSupply 等于初始发行量");

  // 4. 机密转账（calldata 加密）
  head("机密 ERC20 转账");
  const tokenW = new ethers.Contract(tokenAddr, abi, signer);
  const balBefore = await token.balanceOf(RECIPIENT);
  const tTx = await tokenW.transfer(RECIPIENT, TOKEN_AMOUNT, {
    gasLimit: TX_GAS,
  });
  console.log("  tx:", tTx.hash);
  const tRcpt = await tTx.wait();
  assert(tRcpt.status === 1, "机密转账成功");

  const balAfter = await token.balanceOf(RECIPIENT);
  assert(
    balAfter - balBefore === TOKEN_AMOUNT,
    `收款方代币增加 ${(balAfter - balBefore).toString()}`
  );

  // 7. 验证链上交易 calldata 确实被加密（机密性的正反两面证明）
  head("验证 calldata 已加密 + 明文不可解码");
  const onchain = await rawProvider.getTransaction(tTx.hash);
  console.log("  input 前 80 字符:", onchain.data.slice(0, 80));

  // 正面：对比明文编码，确认链上 input 与明文 transfer 形态不同
  const iface = new ethers.Interface(abi);
  const plainData = iface.encodeFunctionData("transfer", [RECIPIENT, TOKEN_AMOUNT]);
  assert(
    !onchain.data.startsWith(TRANSFER_SELECTOR),
    "input 不是明文 transfer 选择器 (0xa9059cbb)"
  );
  assert(
    onchain.data !== plainData,
    "链上 input 与明文 ABI 编码不一致（已变形为加密信封）"
  );

  // 反面（机密性核心）：站在链上观察者角度，用明文 ABI 尝试解码加密 calldata，应当失败。
  // 这证明仅凭链上数据无法还原出调用的方法和参数。
  let decoded = null;
  try {
    decoded = iface.parseTransaction({ data: onchain.data });
  } catch {
    // 预期：解码抛错
  }
  assert(
    decoded === null,
    "明文 ABI 无法将加密 calldata 解码为任何已知方法（观察者看不到 transfer/收款方/金额）"
  );

  // 信封格式自检：OXN 加密信封是 CBOR map，以 0xa2/0xa3... 开头（major type 5）。
  const firstByte = parseInt(onchain.data.slice(2, 4), 16);
  assert(
    (firstByte & 0xe0) === 0xa0,
    `input 是 CBOR map 信封 (首字节 0x${firstByte.toString(16)})`
  );

  console.log("\n🎉 OXN QUICKSTART PASSED");
}

main().catch((err) => {
  console.error("\n❌ OXN QUICKSTART FAILED\n", err);
  process.exit(1);
});
