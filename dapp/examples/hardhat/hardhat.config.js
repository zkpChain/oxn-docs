require("@nomicfoundation/hardhat-toolbox");
require("@oasisprotocol/sapphire-hardhat");

const PRIVATE_KEY = process.env.PRIVATE_KEY
  || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    oxn: {
      url: process.env.OXN_RPC || "https://rpc.bout.network",
      chainId: 186,
      accounts: [PRIVATE_KEY],
    },
  },
};
