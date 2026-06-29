# ethers v6 示例

OXN 端到端接入示例：连接 RPC、部署 ERC20、机密调用、验证 calldata 加密。

## 运行

```bash
npm install
node quickstart.mjs
```

默认连 `https://rpc.bout.network`。脚本会在启动时用 `solc` 把 `MyToken.sol` 实时编译成字节码，**不需要预先 build**。成功结束会输出 `🎉 OXN QUICKSTART PASSED`。

可用环境变量覆盖默认值：

```bash
OXN_RPC=https://rpc.bout.network \
PRIVATE_KEY=0x...                    \
node quickstart.mjs
```

## 文件

| 文件 | 作用 |
|---|---|
| [quickstart.mjs](quickstart.mjs) | 7 步端到端演示：连通性 → estimateGas 探针 → ETH 转账 → 部署 ERC20 → 机密 view-call → 机密 transfer → 验证 calldata 加密 |
| [transfer.mjs](transfer.mjs) | 单独的机密 transfer 演示（用 `TOKEN_ADDR` 环境变量指定合约） |
| [query.mjs](query.mjs) | 单独的机密 view-call 演示 |
| [MyToken.sol](MyToken.sol) | ERC20 合约源码（基于 OpenZeppelin），脚本运行时实时编译 |

> ⚠️ 真实账户私钥不要写死在源码里，用 `PRIVATE_KEY` 环境变量。

## 想改合约？

直接编辑 [MyToken.sol](MyToken.sol) 即可。脚本每次启动都会重新编译，无需手动 build。

`quickstart.mjs` 的部署步骤依赖标准 ERC20 接口（`name`/`symbol`/`totalSupply`/`balanceOf`/`transfer`）。只要这些 ABI 不变，添加新函数不会影响接入验证。
