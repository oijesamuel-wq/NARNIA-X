"use client";

import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { ADDRESSES, NARN_USD_ABI } from "@/config/contracts";
import { useMetrics, useCreditProfile, useEvents } from "@/lib/useApi";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { address, isConnected } = useAccount();

  // Protocol stats from backend API (not on-chain)
  const { data: metrics, loading: metricsLoading } = useMetrics();

  // User credit profile from backend API
  const { data: profile, loading: profileLoading } = useCreditProfile(
    isConnected ? address : undefined,
  );

  // Balance + yield still read on-chain (wallet-specific, real-time)
  const { data: balance } = useReadContract({
    address: ADDRESSES.narnUSD,
    abi: NARN_USD_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: yieldData } = useReadContract({
    address: ADDRESSES.narnUSD,
    abi: NARN_USD_ABI,
    functionName: "accruedYieldAndFeeOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Recent events from backend
  const { data: recentEvents } = useEvents(undefined, 5);

  const fmt = (val: bigint | undefined) => (val !== undefined ? formatUnits(val, 6) : "\u2014");

  return (
    <div>
      <h1 className="text-3xl font-bold">NARNIA X</h1>
      <p className="mt-1 text-gray-400">NarnUSD (nUSD) Dashboard</p>

      {/* Protocol Stats — from backend API */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Supply"
          value={metricsLoading ? "..." : `${metrics?.totalSupply ?? "0"} nUSD`}
        />
        <StatCard
          label="Earning Status"
          value={metricsLoading ? "..." : metrics?.isEarningEnabled ? "Active" : "Inactive"}
          sub={metrics?.isEarningEnabled ? "Yield is accruing" : "Pending governance approval"}
        />
        <StatCard
          label="Total Burned"
          value={metricsLoading ? "..." : `${metrics?.totalBurned ?? "0"} nUSD`}
          sub="0.10% autoburn per transfer"
        />
        <StatCard
          label="Registered Agents"
          value={metricsLoading ? "..." : String(metrics?.agentCount ?? 0)}
          sub="Remittance corridor operators"
        />
      </div>

      {/* User Stats — credit profile from API, balance/yield on-chain */}
      {isConnected && (
        <>
          <h2 className="mt-10 text-xl font-semibold">Your Account</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="nUSD Balance" value={fmt(balance as bigint | undefined)} />
            <StatCard
              label="Accrued Yield"
              value={fmt(yieldData ? (yieldData as [bigint, bigint, bigint])[2] : undefined)}
              sub={yieldData ? `Fee: ${fmt((yieldData as [bigint, bigint, bigint])[1])}` : undefined}
            />
            <StatCard
              label="Whitelisted"
              value={profileLoading ? "..." : profile?.isWhitelisted ? "Yes" : "No"}
            />
            <StatCard
              label="Credit Tier"
              value={profileLoading ? "..." : profile?.creditTierName ?? "\u2014"}
              sub={profile ? `Tier ${profile.creditTier}/4 \u2022 ${profile.creditProfile.totalTransactions} txns` : undefined}
            />
            <StatCard
              label="Fee Rate"
              value={profileLoading ? "..." : profile ? `${profile.feeRate}%` : "\u2014"}
            />
            <StatCard
              label="Agent"
              value={profileLoading ? "..." : profile?.isAgent ? "Yes" : "No"}
            />
          </div>

          {/* Credit Profile Detail */}
          {profile && (
            <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-6">
              <h3 className="text-sm font-semibold text-gray-400">Credit Profile</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm text-gray-300">
                <p>Volume: {profile.creditProfile.totalVolumeTransferred} nUSD</p>
                <p>Weeks Active: {profile.creditProfile.consecutiveWeeksActive}</p>
                <p>Yield (net): {profile.yield.net} nUSD</p>
              </div>
            </div>
          )}
        </>
      )}

      {!isConnected && (
        <div className="mt-12 rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
          <p className="text-gray-400">Connect your wallet to view your account details.</p>
        </div>
      )}

      {/* Recent Activity — from backend event indexer */}
      {recentEvents && recentEvents.length > 0 && (
        <div className="mt-10 rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h3 className="text-sm font-semibold text-gray-400">Recent Activity</h3>
          <div className="mt-3 space-y-2">
            {recentEvents.map((ev) => (
              <div key={ev.transactionHash + ev.blockNumber} className="flex items-center justify-between text-sm">
                <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-300">{ev.type}</span>
                <a
                  href={`https://sepolia.etherscan.io/tx/${ev.transactionHash}`}
                  target="_blank"
                  className="font-mono text-xs text-violet-400 hover:underline"
                >
                  {ev.transactionHash.slice(0, 10)}...{ev.transactionHash.slice(-6)}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contract Info */}
      <div className="mt-10 rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h3 className="text-sm font-semibold text-gray-400">Contract Addresses</h3>
        <div className="mt-3 space-y-2 text-sm font-mono text-gray-300">
          <p>nUSD Proxy: {ADDRESSES.narnUSD}</p>
          <p>SwapFacility: {ADDRESSES.swapFacility}</p>
          <p>M Token: {ADDRESSES.mToken}</p>
        </div>
        <a
          href={`https://sepolia.etherscan.io/address/${ADDRESSES.narnUSD}`}
          target="_blank"
          className="mt-3 inline-block text-sm text-violet-400 hover:underline"
        >
          View on Etherscan \u2192
        </a>
      </div>
    </div>
  );
}
