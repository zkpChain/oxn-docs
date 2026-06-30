# 03 — Hardhat 接入

Hardhat 是大多数 Solidity 项目的事实标准。OXN 通过插件 `@oasisprotocol/sapphire-hardhat`
**自动包裹 provider 和 signer**，你不需要手动 `wrapEthersSigner`。

## 创建 Hardhat 工程

```bash
mkdir my-oxn-dapp && cd my-oxn-dapp
npm init -y
npm install --save-dev hardhat@^2.22.0
npx hardhat init           # 选 "Create a JavaScript project"，所有选项采用默认值
npm install --save-dev @oasisprotocol/sapphire-hardhat@^2.22.0 @openzeppelin/contracts
```


## 配置 `hardhat.config.js`

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("@oasisprotocol/sapphire-hardhat");        // ⚠️ 必须在 toolbox 之后 require

const PRIVATE_KEY = process.env.PRIVATE_KEY
  || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      // ⚠️ OXN SGX runtime 暂不支持 shanghai 的 PUSH0 指令，必须 pin 到 paris
      // 否则 string-return 视图调用会报 "invalid code"（详见 docs/05-faq.md Q0）
      evmVersion: "paris",
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    oxn_testnet: {
      url: process.env.OXN_RPC || "https://rpc.bout.network",
      chainId: 186,
      accounts: [PRIVATE_KEY],
    },
  },
};
```

> 配置好后，所有 `--network oxn_testnet` 下的部署、call、tx 都会自动走加密路径。
> 你写的 Solidity 合约和部署脚本跟普通以太坊项目无差别。

## 合约示例（OpenZeppelin ERC20）

`contracts/MyToken.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("MyToken", "MTK") {
        _mint(msg.sender, initialSupply);
    }
}
```

## 部署脚本

`scripts/deploy.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("deployer:", deployer.address);

  const Token = await hre.ethers.getContractFactory("MyToken");

  // ⚠️ Hardhat 6.x 默认会 estimateGas，OXN 上会失败；显式传 gasLimit 绕开
  const token = await Token.deploy(
    hre.ethers.parseUnits("1000000", 18),
    { gasLimit: 3_000_000n }
  );

  await token.waitForDeployment();
  console.log("MyToken deployed at:", await token.getAddress());
}

main().catch((e) => { console.error(e); process.exit(1); });
```

部署并记录合约地址：

```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network oxn_testnet
```

## 链上交互脚本

`scripts/transfer.js`:

```javascript
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
```

执行 transfer：

```bash
npx hardhat run scripts/transfer.js --network oxn_testnet
```

## 与 ethers 直接接入的区别

| 方面 | 直接 ethers | Hardhat 工程 |
|---|---|---|
| 包裹 provider/signer | 手动 | 插件自动 |
| 编译 Solidity | 自己用 solc/foundry | `npx hardhat compile` |
| 部署/测试基础设施 | 自己写 | Hardhat 自带 |
| `gasLimit` 处理 | 手动 | 仍要手动（插件不修） |
| 适用场景 | 一次性脚本、bot、后端服务 | 完整 DApp 开发 |

完整 Hardhat 工程见 [examples/hardhat/](../examples/hardhat/)。
