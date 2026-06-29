# 05 — FAQ / 已知坑

## Q1：`eth_estimateGas` 为什么不可用？

`estimateGas` 在当前 OXN 镜像下会抛 `invalid BytesLike value`（已知问题，源自加密路径下 gateway 估算失败）。

**workaround**：所有交易显式传 `gasLimit`：

```javascript
{ gasLimit: 500_000n }  // 见 docs/02-ethers.md 推荐值表
```

未消耗的 gas 会退还，不浪费。

## Q2：新建账户发首笔交易报 "Invalid address" / "insufficient balance"？

这是 OXN Wallet 的一个已知 UX bug。**根因**是钱包写死了 `gasPrice: 100n`，新账户余额为 0 时付不起这点 gas，链层返回 `insufficient balance to pay fees`，**钱包把它错误地展示为 "Invalid address"**。

**workaround**：

- 用代码发交易时设 `gasPrice: 0n`（OXN 链层接受）
- 或者先用 faucet 给账户充值
- 钱包源码层面的永久修复在排期中

## Q3：链状态突然清零了？

OXN 当前以 **ephemeral 模式**运行。每次节点重启链都重新创世，
合约地址、账户余额（除 5 个预置测试账户）全部归零。

私钥和 mnemonic 不变。开发期请把部署脚本做成可重跑（保存合约地址到文件、跑 setup 任务的 idempotent 化）。

正式公开 Testnet 阶段会切换到 persistent 模式，届时另行通知。

## Q4：合约部署成功但 `getCode` 返回 `0x`？

可能原因：

1. **`gasLimit` 不够**：尝试调到 `5_000_000n` 重试
2. **`waitForDeployment()` 没等够 block**：手动 `await provider.waitForTransaction(tx.hash, 2)`
3. **链刚重启还没起完**：等节点完全启动（首次约需 60-90 秒）后再部署

## Q5：Event log 怎么看不到？

加密交易的 **event log 也是加密的**，链上观察者看不到 topic/data 明文。但合约自己内部 emit / 客户端用 wrapped provider 监听**是可以解密读到的**：

```javascript
const provider = wrapEthersProvider(raw);
const contract = new ethers.Contract(addr, abi, provider);
contract.on("Transfer", (from, to, amount) => {
  console.log("decrypted log:", from, to, amount);
});
```

> ⚠️ 但**只有发起调用方的会话密钥能解**——别人代你监听的服务无法解密你的 log。
> 需要全局可观测时（比如索引器），合约里应该 emit 一份明文版本（牺牲机密性）。

## Q6：MetaMask 添加 OXN 后弹不出确认窗？

MetaMask 在 HTTP origin 上对 `wallet_addEthereumChain` 行为不稳定，弹窗有时不出现。

**workaround**：

- 用 OXN Wallet（<https://wallet.bout.network/>）代替
- 或在 MetaMask 里**手动**填网络参数（见 docs/01-network.md）

## Q7：能用 viem / web3.js 吗？

可以，但当前 OXN 上**已知能跑通的是 ethers v6**（接入示例的验证基线）。
viem / web3.js 适配支持中，需要请联系 OXN 团队。

如无强需求，建议优先 ethers。

## Q8：能用 ethers v5 吗？

不建议。OXN SDK 已不再维护 v5 wrapper，新功能/bug fix 都只进 v6。
如果存量代码必须 v5，请联系 OXN 团队评估方案。

## Q9：合约能调外部 HTTPS API 吗？

不能直接调用（EVM 没有原生 HTTP）。OXN 提供链下 worker 在 enclave 内访问外部数据并签名注入回链的机制，
但**当前镜像未启用此能力**。需要 oracle 能力请联系团队。

## Q10：测试网升级 / 主网部署？

ChainId 186、ephemeral 模式、faucet 额度都是 testnet 设定。
生产 OXN 部署的资源/成本由 OXN 团队按项目协商，文档不涉及。

---

## 提交新问题

未覆盖的问题请在 `zkpChain/oxn-docs` 提 Issue，标题加 `[FAQ]` 前缀。
