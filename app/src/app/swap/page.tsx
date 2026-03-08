"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { ADDRESSES, SWAP_FACILITY_ABI, ERC20_ABI, NARN_USD_ABI } from "@/config/contracts";

export default function SwapPage() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"wrap" | "unwrap">("wrap");

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const { data: mBalance } = useReadContract({
    address: ADDRESSES.mToken,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: nusdBalance } = useReadContract({
    address: ADDRESSES.narnUSD,
    abi: NARN_USD_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: allowance } = useReadContract({
    address: ADDRESSES.mToken,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, ADDRESSES.swapFacility] : undefined,
    query: { enabled: !!address },
  });

  const parsedAmount = amount ? parseUnits(amount, 6) : BigInt(0);
  const needsApproval = mode === "wrap" && allowance !== undefined && parsedAmount > (allowance as bigint);

  function handleApprove() {
    writeContract({
      address: ADDRESSES.mToken,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [ADDRESSES.swapFacility, parsedAmount],
    });
  }

  function handleSwap() {
    if (!address) return;

    if (mode === "wrap") {
      writeContract({
        address: ADDRESSES.swapFacility,
        abi: SWAP_FACILITY_ABI,
        functionName: "swapInM",
        args: [ADDRESSES.narnUSD, parsedAmount, address],
      });
    } else {
      writeContract({
        address: ADDRESSES.swapFacility,
        abi: SWAP_FACILITY_ABI,
        functionName: "swapOutM",
        args: [ADDRESSES.narnUSD, parsedAmount, address],
      });
    }
  }

  const fmt = (val: bigint | undefined) => (val !== undefined ? formatUnits(val, 6) : "0");

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-3xl font-bold">Swap</h1>
      <p className="mt-1 text-gray-400">Wrap $M into nUSD or unwrap back to $M</p>

      <div className="mt-8 rounded-xl border border-gray-800 bg-gray-900 p-6">
        {/* Mode Toggle */}
        <div className="flex rounded-lg bg-gray-800 p-1">
          <button
            onClick={() => setMode("wrap")}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              mode === "wrap" ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Wrap ($M → nUSD)
          </button>
          <button
            onClick={() => setMode("unwrap")}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              mode === "unwrap" ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Unwrap (nUSD → $M)
          </button>
        </div>

        {/* Balance */}
        <div className="mt-4 flex justify-between text-sm text-gray-400">
          <span>{mode === "wrap" ? "$M" : "nUSD"} Balance:</span>
          <span>{mode === "wrap" ? fmt(mBalance as bigint | undefined) : fmt(nusdBalance as bigint | undefined)}</span>
        </div>

        {/* Amount Input */}
        <div className="mt-2">
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-lg text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
          />
        </div>

        {/* Action Button */}
        <div className="mt-4">
          {!isConnected ? (
            <p className="text-center text-gray-400">Connect wallet to swap</p>
          ) : needsApproval ? (
            <button
              onClick={handleApprove}
              disabled={isPending || isConfirming}
              className="w-full rounded-lg bg-violet-600 py-3 font-medium text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {isPending || isConfirming ? "Approving..." : "Approve $M"}
            </button>
          ) : (
            <button
              onClick={handleSwap}
              disabled={isPending || isConfirming || !amount}
              className="w-full rounded-lg bg-violet-600 py-3 font-medium text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {isPending || isConfirming
                ? "Processing..."
                : mode === "wrap"
                ? "Wrap to nUSD"
                : "Unwrap to $M"}
            </button>
          )}
        </div>

        {/* Status */}
        {isSuccess && (
          <p className="mt-3 text-center text-sm text-green-400">
            Transaction confirmed!{" "}
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              className="underline"
            >
              View
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
