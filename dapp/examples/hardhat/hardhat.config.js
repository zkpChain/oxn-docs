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
