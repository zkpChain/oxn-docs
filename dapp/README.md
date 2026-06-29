# OXN DApp 开发文档

OXN（Oxn Confidential Network）是一条机密 EVM 测试链——EVM 兼容、Solidity 合约直接复用，
**默认对交易 calldata 和 view-call 自动加密**，链上观察者看不到调用方法和参数。

DApp 接入只比标准 EVM 多两件事：
1. RPC 走 OXN 端点（ChainId 186）
2. 用 SDK 包裹一次 `Provider` / `Signer`，让加密自动发生

## 文档结构

| 文件 | 内容 |
|---|---|
| [docs/01-network.md](docs/01-network.md) | 网络参数（ChainId、RPC、Explorer、Faucet、Wallet）和接入入口 |
| [docs/02-ethers.md](docs/02-ethers.md) | ethers v6 完整接入示例 |
| [docs/03-hardhat.md](docs/03-hardhat.md) | Hardhat 工程配置与部署样例 |
| [docs/04-confidential.md](docs/04-confidential.md) | 机密调用原理与验证脚本 |
| [docs/05-faq.md](docs/05-faq.md) | 常见坑：estimateGas / gasPrice / ephemeral 链状态等 |

## 可运行示例

| 目录 | 说明 |
|---|---|
| [examples/ethers/](examples/ethers/) | 端到端接入示例（部署 + 转账 + 机密验证），`node quickstart.mjs` 直接跑 |
| [examples/hardhat/](examples/hardhat/) | 最小 Hardhat 工程：OpenZeppelin ERC20 + OXN 网络配置 + 部署脚本 |

## 5 分钟快速接入

```bash
npm install ethers @oasisprotocol/sapphire-ethers-v6
```

```javascript
import { ethers } from "ethers";
import { wrapEthersProvider, wrapEthersSigner }
  from "@oasisprotocol/sapphire-ethers-v6";

const RPC = "https://rpc.bout.network";
const raw = new ethers.JsonRpcProvider(RPC);

// 关键：包裹 provider/signer，让 calldata 与 view-call 自动加密
const provider = wrapEthersProvider(raw);
const signer = wrapEthersSigner(new ethers.Wallet(YOUR_PRIVATE_KEY, raw));

// 之后跟普通 ethers 用法一样
const code = await provider.getCode(addr);
const tx = await signer.sendTransaction({
  to: addr,
  value: ethers.parseEther("1"),
  gasLimit: 100_000n,         // ⚠️ OXN 上 estimateGas 不可用，必须手动指定
});
```

完整接入步骤、合约部署、机密验证请看 [docs/02-ethers.md](docs/02-ethers.md)。

## 反馈

文档/接入问题请在 `zkpChain/oxn-docs` 仓提 Issue，或联系 OXN 团队。
