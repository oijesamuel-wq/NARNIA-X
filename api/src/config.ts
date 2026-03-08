import "dotenv/config";

export const RPC_URL = process.env.RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/-ZBEQPr8Em_0DYUkKesVh";
export const PORT = Number(process.env.PORT) || 3001;

export const ADDRESSES = {
  narnUSD: "0x5f78eAbe8Bfe73b2EE23e51E9645D545649d20D4" as const,
  swapFacility: "0xB6807116b3B1B321a390594e31ECD6e0076f6278" as const,
  mToken: "0x866A2BF4E572CbcF37D5071A7a58503Bfb36be1b" as const,
};

export const NARN_USD_ABI = [
  // Views
  { inputs: [], name: "name", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "symbol", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalSupply", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "isEarningEnabled", outputs: [{ type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalBurned", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "agentCount", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "feeRecipient", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "account", type: "address" }], name: "isWhitelisted", outputs: [{ type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "account", type: "address" }], name: "isAgent", outputs: [{ type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "account", type: "address" }], name: "feeRateOf", outputs: [{ type: "uint16" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "account", type: "address" }], name: "getCreditTier", outputs: [{ type: "uint8" }], stateMutability: "view", type: "function" },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "creditProfileOf",
    outputs: [{ type: "tuple", components: [
      { name: "totalTransactions", type: "uint64" },
      { name: "totalVolumeTransferred", type: "uint128" },
      { name: "firstTransactionTime", type: "uint64" },
      { name: "lastTransactionTime", type: "uint64" },
      { name: "consecutiveWeeksActive", type: "uint32" },
      { name: "lastActiveWeek", type: "uint32" },
    ]}],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "accruedYieldAndFeeOf",
    outputs: [
      { name: "yieldWithFee", type: "uint256" },
      { name: "fee", type: "uint256" },
      { name: "yieldNetOfFee", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // Events
  { type: "event", name: "AutoBurned", inputs: [{ name: "from", type: "address", indexed: true }, { name: "amount", type: "uint256", indexed: false }, { name: "totalBurnedCumulative", type: "uint256", indexed: false }] },
  { type: "event", name: "CreditProfileUpdated", inputs: [{ name: "account", type: "address", indexed: true }, { name: "totalTx", type: "uint64", indexed: false }, { name: "totalVol", type: "uint128", indexed: false }] },
  { type: "event", name: "AgentRegistered", inputs: [{ name: "account", type: "address", indexed: true }, { name: "status", type: "bool", indexed: false }] },
  { type: "event", name: "Transfer", inputs: [{ name: "from", type: "address", indexed: true }, { name: "to", type: "address", indexed: true }, { name: "value", type: "uint256", indexed: false }] },
] as const;
