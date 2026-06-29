# 02 — ethers v6 接入

OXN 走标准 EVM 接口，但默认对 calldata 和 view-call 加密。
**所有 ethers `Provider` 和 `Signer` 都必须用 OXN SDK 包裹一次**，
否则发出去的交易是明文 calldata，链层会按"非加密"路径处理（部分合约会拒绝执行）。

## 依赖

```bash
npm install ethers@^6.16.0 @oasisprotocol/sapphire-ethers-v6@^6.0.1
```

## 最小可运行示例

```javascript
import { ethers } from "ethers";
import { wrapEthersProvider, wrapEthersSigner }
  from "@oasisprotocol/sapphire-ethers-v6";

const RPC = "https://rpc.bout.network";
const PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const raw = new ethers.JsonRpcProvider(RPC);
const provider = wrapEthersProvider(raw);                              // 加密 view-call
const signer = wrapEthersSigner(new ethers.Wallet(PRIVATE_KEY, raw));  // 加密交易 calldata

const me = await signer.getAddress();
console.log("sender:", me, "balance:", ethers.formatEther(await raw.getBalance(me)));
```

> **包裹 raw 还是包裹 wrapped？** `wrapEthersSigner` 接受的是一个 `Signer`，
> 内部会处理 provider 包裹（你不需要把已包裹的 provider 再传给它）。
> 直接 `new ethers.Wallet(PRIVATE_KEY, raw)` 就好。

## 部署合约

```javascript
import { readFileSync } from "node:fs";

const artifact = JSON.parse(readFileSync("MyToken.json", "utf8"));
const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);

// ⚠️ OXN 上 estimateGas 会 panic，必须手动指定 gasLimit
const contract = await factory.deploy(
  ethers.parseUnits("1000000", 18),
  { gasLimit: 3_000_000n }
);
await contract.waitForDeployment();
console.log("deployed at:", await contract.getAddress());
```

## 调用合约（机密 view-call）

```javascript
const token = new ethers.Contract(tokenAddr, abi, provider);  // 用 wrapped provider
const name = await token.name();          // eth_call 走加密路径，链上看不到 selector
const balance = await token.balanceOf(me);
```

view-call 加密是 OXN 的核心机密性能力。即使是只读查询，
链上观察者也看不到调用者关心的方法/参数（包括 `balanceOf` 查的是哪个地址）。

## 发送交易（机密 transfer）

```javascript
const tokenW = new ethers.Contract(tokenAddr, abi, signer);  // 用 wrapped signer

const tx = await tokenW.transfer(
  recipient,
  ethers.parseUnits("100", 18),
  { gasLimit: 500_000n }
);
await tx.wait();

// 验证 calldata 已加密
const onchain = await raw.getTransaction(tx.hash);
console.log(onchain.data.slice(0, 80));  // 应以 0xa2/0xa3 开头（CBOR map），而不是 0xa9059cbb
```

## 推荐 gasLimit 速查

| 调用类型 | 推荐 `gasLimit` |
|---|---|
| 普通 ETH 转账 | `100_000n` |
| ERC20 transfer | `500_000n` |
| 简单合约部署（ERC20） | `3_000_000n` |
| 大合约部署 | `5_000_000n`+ 起步 |

> 这是手动估算下限，链层不会因为多给就多扣，未用完会退还。

## 完整脚本

参考 [examples/ethers/quickstart.mjs](../examples/ethers/quickstart.mjs)，
覆盖 7 步：连通性 → estimateGas 探针 → ETH 转账 → 部署 ERC20 → 机密 view-call → 机密 transfer → 验证 calldata 加密。

直接跑：

```bash
cd examples/ethers
npm install
node quickstart.mjs
```

成功结束会输出 `🎉 OXN QUICKSTART PASSED`。
