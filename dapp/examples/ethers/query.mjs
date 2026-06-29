import { ethers } from "ethers";
import { wrapEthersProvider } from "@oasisprotocol/sapphire-ethers-v6";

const RPC = process.env.OXN_RPC || "https://rpc.bout.network";
const TOKEN_ADDR =
  process.env.TOKEN_ADDR || "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

const provider = wrapEthersProvider(new ethers.JsonRpcProvider(RPC));

const token = new ethers.Contract(
  TOKEN_ADDR,
  [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)"
  ],
  provider
);

const deployer = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

console.log("name:", await token.name());
console.log("symbol:", await token.symbol());
console.log("totalSupply:", (await token.totalSupply()).toString());
console.log("deployer balance:", (await token.balanceOf(deployer)).toString());
