# 01 — 网络参数与接入入口

## 核心参数

| 项 | 值 |
|---|---|
| 链名 | OXN Testnet |
| ChainId | **186** (`0xba`) |
| RPC | `https://rpc.bout.network` |
| 货币符号 | TEST |
| 精度 | 18 |
| 默认 mnemonic（仅测试） | `test test test test test test test test test test test junk` |

## 公开入口

| 服务 | URL | 说明 |
|---|---|---|
| EVM JSON-RPC | <https://rpc.bout.network> | DApp 用这个；HTTP/HTTPS 都接受 POST |
| Wallet | <https://wallet.bout.network/> | OXN 官方钱包 |
| Explorer | <https://explorer.bout.network/> | 区块浏览器 |
| Faucet | <https://faucet.bout.network/> | 测试币领取，单次 10 TEST |

## 测试账户

测试网预置 5 个账户，每个 10000 TEST：

| # | EVM 地址 | 私钥 |
|---|---|---|
| 0 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| 1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| 2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| 3 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` |
| 4 | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | `0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a` |

> ⚠️ **测试网 ephemeral**：当前 OXN 链状态在节点重启时会清零。账户私钥不变，但余额、合约会丢——开发期请把部署脚本做成可重跑。

## 在 MetaMask 添加 OXN

| 字段 | 值 |
|---|---|
| Network Name | OXN Testnet |
| RPC URL | `https://rpc.bout.network` |
| Chain ID | `186` |
| Currency Symbol | TEST |
| Block Explorer | `https://explorer.bout.network` |

> 推荐使用 OXN Wallet（<https://wallet.bout.network/>），原生适配 OXN 网络无需手动配置。
