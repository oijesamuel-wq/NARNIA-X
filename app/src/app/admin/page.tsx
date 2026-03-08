"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ADDRESSES, NARN_USD_ABI } from "@/config/contracts";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function TxButton({
  onClick,
  disabled,
  loading,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
    >
      {loading ? "Processing..." : children}
    </button>
  );
}

export default function AdminPage() {
  const { address, isConnected } = useAccount();

  // Form state
  const [whitelistAddr, setWhitelistAddr] = useState("");
  const [whitelistFeeRate, setWhitelistFeeRate] = useState("");
  const [feeRecipientAddr, setFeeRecipientAddr] = useState("");
  const [agentAddr, setAgentAddr] = useState("");

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  // Read contract state
  const { data: isEarningEnabled } = useReadContract({
    address: ADDRESSES.narnUSD,
    abi: NARN_USD_ABI,
    functionName: "isEarningEnabled",
  });

  const { data: feeRecipient } = useReadContract({
    address: ADDRESSES.narnUSD,
    abi: NARN_USD_ABI,
    functionName: "feeRecipient",
  });

  const { data: adminRole } = useReadContract({
    address: ADDRESSES.narnUSD,
    abi: NARN_USD_ABI,
    functionName: "DEFAULT_ADMIN_ROLE",
  });

  const { data: isAdmin } = useReadContract({
    address: ADDRESSES.narnUSD,
    abi: NARN_USD_ABI,
    functionName: "hasRole",
    args: adminRole && address ? [adminRole, address] : undefined,
    query: { enabled: !!adminRole && !!address },
  });

  const { data: earnerRole } = useReadContract({
    address: ADDRESSES.narnUSD,
    abi: NARN_USD_ABI,
    functionName: "EARNER_MANAGER_ROLE",
  });

  const { data: isEarnerManager } = useReadContract({
    address: ADDRESSES.narnUSD,
    abi: NARN_USD_ABI,
    functionName: "hasRole",
    args: earnerRole && address ? [earnerRole, address] : undefined,
    query: { enabled: !!earnerRole && !!address },
  });

  const loading = isPending || isConfirming;

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-lg mt-12 rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
        <p className="text-gray-400">Connect your wallet to access admin functions.</p>
      </div>
    );
  }

  if (!isAdmin && !isEarnerManager) {
    return (
      <div className="mx-auto max-w-2xl mt-12 rounded-xl border border-red-900 bg-gray-900 p-8 text-center">
        <p className="text-red-400">Your wallet does not have admin or earner manager roles.</p>
        <p className="mt-2 text-sm text-gray-500 font-mono">{address}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">Admin</h1>
      <p className="mt-1 text-gray-400">Manage NarnUSD extension settings</p>

      {/* Role Badges */}
      <div className="mt-4 flex gap-2">
        {isAdmin && (
          <span className="rounded-full bg-violet-600/20 px-3 py-1 text-xs text-violet-400">Admin</span>
        )}
        {isEarnerManager && (
          <span className="rounded-full bg-green-600/20 px-3 py-1 text-xs text-green-400">Earner Manager</span>
        )}
      </div>

      <div className="mt-8 space-y-6">
        {/* Earning Toggle */}
        <Section title="Earning Status">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">
                Status:{" "}
                <span className={isEarningEnabled ? "text-green-400" : "text-red-400"}>
                  {isEarningEnabled ? "Enabled" : "Disabled"}
                </span>
              </p>
            </div>
            <TxButton
              loading={loading}
              onClick={() =>
                writeContract({
                  address: ADDRESSES.narnUSD,
                  abi: NARN_USD_ABI,
                  functionName: isEarningEnabled ? "disableEarning" : "enableEarning",
                })
              }
            >
              {isEarningEnabled ? "Disable Earning" : "Enable Earning"}
            </TxButton>
          </div>
        </Section>

        {/* Whitelist Account */}
        <Section title="Whitelist Account">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Account address (0x...)"
              value={whitelistAddr}
              onChange={(e) => setWhitelistAddr(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
            />
            <input
              type="number"
              placeholder="Fee rate in bps (e.g. 500 = 5%)"
              value={whitelistFeeRate}
              onChange={(e) => setWhitelistFeeRate(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <TxButton
                loading={loading}
                disabled={!whitelistAddr}
                onClick={() =>
                  writeContract({
                    address: ADDRESSES.narnUSD,
                    abi: NARN_USD_ABI,
                    functionName: "setAccountInfo",
                    args: [whitelistAddr as `0x${string}`, true, Number(whitelistFeeRate || 0)],
                  })
                }
              >
                Whitelist
              </TxButton>
              <TxButton
                loading={loading}
                disabled={!whitelistAddr}
                onClick={() =>
                  writeContract({
                    address: ADDRESSES.narnUSD,
                    abi: NARN_USD_ABI,
                    functionName: "setAccountInfo",
                    args: [whitelistAddr as `0x${string}`, false, 0],
                  })
                }
              >
                Remove
              </TxButton>
            </div>
          </div>
        </Section>

        {/* Fee Recipient */}
        <Section title="Fee Recipient">
          <p className="text-sm text-gray-400 font-mono mb-3">
            Current: {feeRecipient ? `${(feeRecipient as string).slice(0, 10)}...${(feeRecipient as string).slice(-8)}` : "—"}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New fee recipient address (0x...)"
              value={feeRecipientAddr}
              onChange={(e) => setFeeRecipientAddr(e.target.value)}
              className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
            />
            <TxButton
              loading={loading}
              disabled={!feeRecipientAddr}
              onClick={() =>
                writeContract({
                  address: ADDRESSES.narnUSD,
                  abi: NARN_USD_ABI,
                  functionName: "setFeeRecipient",
                  args: [feeRecipientAddr as `0x${string}`],
                })
              }
            >
              Update
            </TxButton>
          </div>
        </Section>

        {/* Agent Registry */}
        <Section title="Agent Registry">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Agent address (0x...) — must be whitelisted"
              value={agentAddr}
              onChange={(e) => setAgentAddr(e.target.value)}
              className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
            />
            <TxButton
              loading={loading}
              disabled={!agentAddr}
              onClick={() =>
                writeContract({
                  address: ADDRESSES.narnUSD,
                  abi: NARN_USD_ABI,
                  functionName: "setAgent",
                  args: [agentAddr as `0x${string}`, true],
                })
              }
            >
              Add Agent
            </TxButton>
            <TxButton
              loading={loading}
              disabled={!agentAddr}
              onClick={() =>
                writeContract({
                  address: ADDRESSES.narnUSD,
                  abi: NARN_USD_ABI,
                  functionName: "setAgent",
                  args: [agentAddr as `0x${string}`, false],
                })
              }
            >
              Remove
            </TxButton>
          </div>
        </Section>

        {/* Tx Status */}
        {isSuccess && (
          <p className="text-center text-sm text-green-400">
            Transaction confirmed!{" "}
            <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" className="underline">
              View
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
