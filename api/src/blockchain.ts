import { createPublicClient, http, formatUnits, type Address } from "viem";
import { sepolia } from "viem/chains";
import { RPC_URL, ADDRESSES, NARN_USD_ABI } from "./config.js";

export const client = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL),
});

const contract = { address: ADDRESSES.narnUSD, abi: NARN_USD_ABI } as const;

const TIER_NAMES = ["New", "Starter", "Established", "Reliable", "Premium"];

export async function getEcosystemMetrics() {
  const [totalSupply, totalBurned, agentCount, isEarningEnabled, feeRecipient] =
    await Promise.all([
      client.readContract({ ...contract, functionName: "totalSupply" }),
      client.readContract({ ...contract, functionName: "totalBurned" }),
      client.readContract({ ...contract, functionName: "agentCount" }),
      client.readContract({ ...contract, functionName: "isEarningEnabled" }),
      client.readContract({ ...contract, functionName: "feeRecipient" }),
    ]);

  return {
    totalSupply: formatUnits(totalSupply, 6),
    totalBurned: formatUnits(totalBurned, 6),
    agentCount: Number(agentCount),
    isEarningEnabled,
    feeRecipient,
    contract: ADDRESSES.narnUSD,
    chain: "sepolia",
    chainId: 11155111,
  };
}

export async function getCreditProfile(address: Address) {
  const [profile, tier, balance, isWhitelisted, isAgent, feeRate, yieldData] =
    await Promise.all([
      client.readContract({ ...contract, functionName: "creditProfileOf", args: [address] }),
      client.readContract({ ...contract, functionName: "getCreditTier", args: [address] }),
      client.readContract({ ...contract, functionName: "balanceOf", args: [address] }),
      client.readContract({ ...contract, functionName: "isWhitelisted", args: [address] }),
      client.readContract({ ...contract, functionName: "isAgent", args: [address] }),
      client.readContract({ ...contract, functionName: "feeRateOf", args: [address] }),
      client.readContract({ ...contract, functionName: "accruedYieldAndFeeOf", args: [address] }),
    ]);

  return {
    address,
    balance: formatUnits(balance, 6),
    isWhitelisted,
    isAgent,
    feeRate: Number(feeRate) / 100,
    creditTier: Number(tier),
    creditTierName: TIER_NAMES[Number(tier)] || "Unknown",
    creditProfile: {
      totalTransactions: Number(profile.totalTransactions),
      totalVolumeTransferred: formatUnits(profile.totalVolumeTransferred, 6),
      firstTransactionTime: Number(profile.firstTransactionTime),
      lastTransactionTime: Number(profile.lastTransactionTime),
      consecutiveWeeksActive: Number(profile.consecutiveWeeksActive),
      lastActiveWeek: Number(profile.lastActiveWeek),
    },
    yield: {
      gross: formatUnits(yieldData[0], 6),
      fee: formatUnits(yieldData[1], 6),
      net: formatUnits(yieldData[2], 6),
    },
  };
}

export async function getAgentStatus(address: Address) {
  const [isAgent, isWhitelisted] = await Promise.all([
    client.readContract({ ...contract, functionName: "isAgent", args: [address] }),
    client.readContract({ ...contract, functionName: "isWhitelisted", args: [address] }),
  ]);
  return { address, isAgent, isWhitelisted };
}
