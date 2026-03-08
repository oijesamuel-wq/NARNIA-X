export const CHAIN_ID = 11155111; // Sepolia

export const ADDRESSES = {
  narnUSD: "0x5f78eAbe8Bfe73b2EE23e51E9645D545649d20D4" as const,
  swapFacility: "0xB6807116b3B1B321a390594e31ECD6e0076f6278" as const,
  mToken: "0x866A2BF4E572CbcF37D5071A7a58503Bfb36be1b" as const,
};

export const NARN_USD_ABI = [
  // View
  { inputs: [], name: "name", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "symbol", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "decimals", outputs: [{ type: "uint8" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalSupply", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "isEarningEnabled", outputs: [{ type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "currentIndex", outputs: [{ type: "uint128" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "feeRecipient", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalPrincipal", outputs: [{ type: "uint112" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "projectedTotalSupply", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "account", type: "address" }], name: "isWhitelisted", outputs: [{ type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "account", type: "address" }], name: "feeRateOf", outputs: [{ type: "uint16" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "account", type: "address" }], name: "principalOf", outputs: [{ type: "uint112" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "account", type: "address" }], name: "accruedYieldOf", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "account", type: "address" }], name: "accruedFeeOf", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "account", type: "address" }], name: "balanceWithYieldOf", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "accruedYieldAndFeeOf",
    outputs: [{ name: "yieldWithFee", type: "uint256" }, { name: "fee", type: "uint256" }, { name: "yieldNetOfFee", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  { inputs: [{ name: "role", type: "bytes32" }, { name: "account", type: "address" }], name: "hasRole", outputs: [{ type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "DEFAULT_ADMIN_ROLE", outputs: [{ type: "bytes32" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "EARNER_MANAGER_ROLE", outputs: [{ type: "bytes32" }], stateMutability: "view", type: "function" },
  // Write
  { inputs: [{ name: "account", type: "address" }], name: "claimFor", outputs: [{ name: "yieldWithFee", type: "uint256" }, { name: "fee", type: "uint256" }, { name: "yieldNetOfFee", type: "uint256" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "enableEarning", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "disableEarning", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "account", type: "address" }, { name: "status", type: "bool" }, { name: "feeRate", type: "uint16" }], name: "setAccountInfo", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "feeRecipient_", type: "address" }], name: "setFeeRecipient", outputs: [], stateMutability: "nonpayable", type: "function" },
  // NarnUSD custom features
  { inputs: [], name: "totalBurned", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "agentCount", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
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
  { inputs: [{ name: "account", type: "address" }], name: "isAgent", outputs: [{ type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "account", type: "address" }, { name: "status", type: "bool" }], name: "setAgent", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "AUTOBURN_BPS", outputs: [{ type: "uint16" }], stateMutability: "view", type: "function" },
] as const;

export const SWAP_FACILITY_ABI = [
  { inputs: [{ name: "extensionOut", type: "address" }, { name: "amount", type: "uint256" }, { name: "recipient", type: "address" }], name: "swapInM", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "extensionIn", type: "address" }, { name: "amount", type: "uint256" }, { name: "recipient", type: "address" }], name: "swapOutM", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "tokenIn", type: "address" }, { name: "tokenOut", type: "address" }, { name: "amount", type: "uint256" }, { name: "recipient", type: "address" }], name: "swap", outputs: [], stateMutability: "nonpayable", type: "function" },
] as const;

export const ERC20_ABI = [
  { inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], name: "approve", outputs: [{ type: "bool" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], name: "allowance", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
] as const;
