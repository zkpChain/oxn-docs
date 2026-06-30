# Hardhat 示例工程

与 [docs/03-hardhat.md](../../docs/03-hardhat.md) 对应的最小可运行 Hardhat 工程，部署 OpenZeppelin ERC20 到 OXN Testnet。

## 从零创建（参考）

```bash
mkdir my-oxn-dapp && cd my-oxn-dapp
npm init -y
npm install --save-dev hardhat@^2.22.0
npx hardhat init           # 选 "Create a JavaScript project"，所有选项采用默认值
npm install --save-dev @oasisprotocol/sapphire-hardhat@^2.22.0 @openzeppelin/contracts
```

然后将本目录的 `hardhat.config.js`、`contracts/`、`scripts/` 复制进工程，或直接使用本示例。

## 准备

```bash
npm install
# （可选）通过环境变量覆盖默认私钥 / RPC：
# PRIVATE_KEY=0x... OXN_RPC=https://rpc.bout.network
```

## 编译合约

```bash
npm run compile
```

## 部署

```bash
npm run deploy
```

输出示例：

```
deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
MyToken deployed at: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

## 调用（机密 transfer）

1. 把 `scripts/transfer.js` 里的 `TOKEN_ADDR` 改成上一步输出的合约地址
2. 运行：

```bash
npm run transfer
```

会向 `0x000...dEaD` 转 100 个 MyToken（symbol `MTK`），并打印转账前后 sender 余额。

## 文件结构

```
hardhat/
├── hardhat.config.js          ← OXN 网络配置（oxn_testnet, chainId 186 + 加密 SDK 插件）
├── contracts/MyToken.sol      ← OpenZeppelin ERC20
├── scripts/deploy.js          ← 部署脚本（手动 gasLimit）
└── scripts/transfer.js        ← 链上交互脚本
```

## 注意事项

- `@oasisprotocol/sapphire-hardhat` 插件**必须在 `@nomicfoundation/hardhat-toolbox` 之后 require**
- 所有 deploy / transaction 都要显式传 `gasLimit`（OXN 上 estimateGas 会失败）
- ChainId 必须填 `186`，否则 ethers 会以错误的 EIP-1559 格式签名
