# Hardhat 示例工程

最小可运行的 Hardhat 工程，部署一个 OpenZeppelin ERC20 到 OXN。

## 准备

```bash
npm install
# （可选）创建 .env 设置 PRIVATE_KEY、OXN_RPC
```

## 编译合约

```bash
npm run compile
```

## 部署

```bash
# 默认连 https://rpc.bout.network
npm run deploy

# 或显式覆盖：
OXN_RPC=https://rpc.bout.network PRIVATE_KEY=0x... npm run deploy
```

输出会打印部署后的合约地址，例如：

```
MyToken deployed at: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

## 调用（机密 transfer）

```bash
TOKEN_ADDR=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 npm run transfer
```

会向默认接收方转 100 个 MyToken（合约 symbol 为 `MTK`），并验证链上 calldata 是加密的（首字节 CBOR map）。

## 文件结构

```
hardhat/
├── hardhat.config.js          ← OXN 网络配置（chainId 186 + 加密 SDK 插件）
├── contracts/MyToken.sol      ← OpenZeppelin ERC20
├── scripts/deploy.js          ← 部署脚本（手动 gasLimit）
└── scripts/transfer.js        ← 调用脚本 + 加密验证
```

## 注意事项

- `@oasisprotocol/sapphire-hardhat` 插件**必须在 `@nomicfoundation/hardhat-toolbox` 之后 require**
- 所有 deploy / transaction 都要显式传 `gasLimit`（OXN 上 estimateGas 会失败）
- ChainId 必须填 `186`，否则 ethers 会以错误的 EIP-1559 格式签名
