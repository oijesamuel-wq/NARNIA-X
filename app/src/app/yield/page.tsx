"use client";

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits } from "viem";
import { ADDRESSES, NARN_USD_ABI } from "@/config/contracts";

export default function YieldPage() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const { data: balance } = useReadContract({
    address: ADDRESSES.narnUSD,
    abi: NARN_USD_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: balanceWithYield } = useReadContract({
    address: ADDRESSES.narnUSD,
    abi: NARN_USD_ABI,
    functionName: "balanceWithYieldOf",
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

  const { data: isWhitelisted } = useReadContract({
    address: ADDRESSES.narnUSD,
    abi: NARN_USD_ABI,
    functionName: "isWhitelisted",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: feeRate } = useReadContract({
    address: ADDRESSES.narnUSD,
    abi: NARN_USD_ABI,
    functionName: "feeRateOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const yieldArr = yieldData as [bigint, bigint, bigint] | undefined;
  const fmt = (val: bigint | undefined) => (val !== undefined ? formatUnits(val, 6) : "—");

  function handleClaim() {
    if (!address) return;
    writeContract({
      address: ADDRESSES.narnUSD,
      abi: NARN_USD_ABI,
      functionName: "claimFor",
      args: [address],
    });
  }

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-lg mt-12 rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
        <p className="text-gray-400">Connect your wallet to view yield information.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-3xl font-bold">Yield</h1>
      <p className="mt-1 text-gray-400">View and claim your accrued nUSD yield</p>

      <div className="mt-8 space-y-4">
        {/* Balance Overview */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">nUSD Balance</span>
              <span className="font-mono font-bold">{fmt(balance as bigint | undefined)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Balance + Yield</span>
              <span className="font-mono font-bold">{fmt(balanceWithYield as bigint | undefined)}</span>
            </div>
            <div className="border-t border-gray-800" />
            <div className="flex justify-between">
              <span className="text-gray-400">Accrued Yield (gross)</span>
              <span className="font-mono text-green-400">{fmt(yieldArr?.[0])}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Fee</span>
              <span className="font-mono text-yellow-400">-{fmt(yieldArr?.[1])}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Net Yield (claimable)</span>
              <span className="font-mono text-green-400 font-bold">{fmt(yieldArr?.[2])}</span>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <div className="flex justify-between">
            <span className="text-gray-400">Whitelisted</span>
            <span className={isWhitelisted ? "text-green-400" : "text-red-400"}>
              {isWhitelisted ? "Yes" : "No"}
            </span>
          </div>
          <div className="mt-2 flex justify-between">
            <span className="text-gray-400">Fee Rate</span>
            <span>{feeRate !== undefined ? `${Number(feeRate) / 100}%` : "—"}</span>
          </div>
        </div>

        {/* Claim Button */}
        <button
          onClick={handleClaim}
          disabled={isPending || isConfirming || !yieldArr?.[0]}
          className="w-full rounded-lg bg-violet-600 py-3 font-medium text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {isPending || isConfirming ? "Claiming..." : "Claim Yield"}
        </button>

        {isSuccess && (
          <p className="text-center text-sm text-green-400">
            Yield claimed!{" "}
            <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" className="underline">
              View tx
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
