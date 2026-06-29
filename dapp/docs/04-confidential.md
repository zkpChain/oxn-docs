# 04 — 机密调用原理与验证

OXN 的机密 EVM 模型：**链上数据公开可读，但合约调用的 calldata（含参数、调用方法）经过加密**，
区块浏览器/索引器看不到具体在调用什么方法、传了什么参数。

## 两层加密

| 数据类型 | 加密内容 | 解密侧 |
|---|---|---|
| **交易 calldata**（写入链） | 函数选择器 + 参数 | 节点内 enclave (SGX) 用一次性会话密钥解密执行 |
| **view-call (`eth_call`)** | 调用方法 + 参数 | 节点内 enclave；返回的 result 也加密回客户端 |

加密信封格式：[CBOR](https://cbor.io/) map，首字节 `0xa2/0xa3...`（CBOR major type 5）。
包含临时公钥、密文 body、随机 nonce 等字段。

SDK 封装了 X25519 密钥交换 + Deoxys-II 对称加密，
开发者**不需要手动加密**，只要正确包裹 provider/signer 即可。

## 验证 calldata 确实被加密

```javascript
import { ethers } from "ethers";

const raw = new ethers.JsonRpcProvider("https://rpc.bout.network");
const onchain = await raw.getTransaction(YOUR_TX_HASH);

// 三段验证：
// 1. 不是明文 transfer 选择器
console.assert(!onchain.data.startsWith("0xa9059cbb"));

// 2. 与明文 ABI 编码完全不同
const iface = new ethers.Interface(abi);
const plain = iface.encodeFunctionData("transfer", [recipient, amount]);
console.assert(onchain.data !== plain);

// 3. 站在观察者角度，用明文 ABI 无法解码加密 calldata
let decoded = null;
try { decoded = iface.parseTransaction({ data: onchain.data }); } catch {}
console.assert(decoded === null);

// 4. 信封是 CBOR map（首字节按位与 0xe0 等于 0xa0）
const firstByte = parseInt(onchain.data.slice(2, 4), 16);
console.assert((firstByte & 0xe0) === 0xa0);
```

完整可跑版本：[examples/ethers/quickstart.mjs](../examples/ethers/quickstart.mjs) 第 7 步。

## 链上观察者看到什么

加密交易在 Explorer 上的表现：

- ✅ 看得到：**from、to、value、gas、block 高度、tx hash、status**（成功/失败）
- ❌ 看不到：**调用了哪个函数、传了什么参数、event log 内容**（事件也加密）

这是"selective disclosure"模型：基础链流量（钱往哪流、花了多少 gas）公开可审计，业务语义不公开。

## 不加密的场景

下面这些**不会**加密，等同于以太坊主网：

| 类型 | 原因 |
|---|---|
| 普通 ETH 转账（无 calldata） | 没有需要加密的内容；交易载荷 = 空 |
| 合约部署 (`to == null`) | 部署字节码本身公开（任何人能复现），构造参数也公开 |
| 用普通 `ethers.JsonRpcProvider`（**未包裹**）发交易 | SDK 不会主动加密，calldata 明文上链 |

> ⚠️ **如果你看到自己的交易 calldata 是明文 `0xa9059cbb...` 开头，意味着 SDK 包裹漏了**——
> 检查 `wrapEthersSigner` 是否调用、Hardhat 项目是否 `require("@oasisprotocol/sapphire-hardhat")`。

## 进阶：Solidity 端能力

OXN 提供一组 precompile，合约里能用：

- 链上随机数（VRF-based）
- 加密签名 / 验签：secp256k1 / Ed25519 / Sr25519 / RSA
- 对称加解密
- 取当前 enclave 公钥（用于离线加密给合约的数据）

详细 ABI 与示例请联系 OXN 团队获取。
