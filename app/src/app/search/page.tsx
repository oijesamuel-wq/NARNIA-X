"use client";

import { useState } from "react";
import { api, type SoChainNetwork, type SoChainSearchResult } from "@/lib/api";

const NETWORKS: { value: SoChainNetwork; label: string }[] = [
  { value: "BTC", label: "Bitcoin" },
  { value: "LTC", label: "Litecoin" },
  { value: "DOGE", label: "Dogecoin" },
  { value: "BTCTEST", label: "BTC Testnet" },
  { value: "LTCTEST", label: "LTC Testnet" },
  { value: "DOGETEST", label: "DOGE Testnet" },
];

function formatTime(unix: number) {
  return new Date(unix * 1000).toLocaleString();
}

function AddressResult({ result }: { result: SoChainSearchResult & { type: "address" } }) {
  const { result: data } = result;
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h3 className="text-sm font-semibold text-gray-400">Address Summary</h3>
        <p className="mt-2 break-all font-mono text-sm text-violet-400">{data.address}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
          <div>
            <p className="text-gray-500">Confirmed Balance</p>
            <p className="font-bold">{data.confirmed_balance} {result.network}</p>
          </div>
          <div>
            <p className="text-gray-500">Unconfirmed Balance</p>
            <p className="font-bold">{data.unconfirmed_balance} {result.network}</p>
          </div>
          <div>
            <p className="text-gray-500">Total Received</p>
            <p className="font-bold">{data.confirmed_received} {result.network}</p>
          </div>
          <div>
            <p className="text-gray-500">Sent Txns</p>
            <p className="font-bold">{data.txs_sent}</p>
          </div>
          <div>
            <p className="text-gray-500">Received Txns</p>
            <p className="font-bold">{data.txs_received}</p>
          </div>
          <div>
            <p className="text-gray-500">Total Txns</p>
            <p className="font-bold">{data.txs_total}</p>
          </div>
        </div>
      </div>

      {data.recentTransactions.length > 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h3 className="text-sm font-semibold text-gray-400">Recent Transactions</h3>
          <div className="mt-3 space-y-3">
            {data.recentTransactions.map((tx) => (
              <div key={tx.hash} className="rounded-lg border border-gray-800 p-3 text-sm">
                <p className="break-all font-mono text-xs text-violet-400">{tx.hash}</p>
                <div className="mt-2 flex flex-wrap gap-4 text-gray-300">
                  <span>Block: {tx.block}</span>
                  <span>Change: <span className={Number(tx.balance_change) >= 0 ? "text-green-400" : "text-red-400"}>{tx.balance_change}</span></span>
                  <span>{formatTime(tx.time)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BlockResult({ result }: { result: SoChainSearchResult & { type: "block" } }) {
  const { result: data } = result;
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
      <h3 className="text-sm font-semibold text-gray-400">Block #{data.height}</h3>
      <div className="mt-4 space-y-3 text-sm">
        <div>
          <p className="text-gray-500">Hash</p>
          <p className="break-all font-mono text-xs text-violet-400">{data.hash}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-gray-500">Transactions</p>
            <p className="font-bold">{data.txs}</p>
          </div>
          <div>
            <p className="text-gray-500">Reward</p>
            <p className="font-bold">{data.reward} {result.network}</p>
          </div>
          <div>
            <p className="text-gray-500">Fees</p>
            <p className="font-bold">{data.fees} {result.network}</p>
          </div>
          <div>
            <p className="text-gray-500">Size</p>
            <p className="font-bold">{data.size.toLocaleString()} bytes</p>
          </div>
          <div>
            <p className="text-gray-500">Difficulty</p>
            <p className="font-bold">{data.difficulty}</p>
          </div>
          <div>
            <p className="text-gray-500">Time</p>
            <p className="font-bold">{formatTime(data.time)}</p>
          </div>
        </div>
        <div>
          <p className="text-gray-500">Merkle Root</p>
          <p className="break-all font-mono text-xs text-gray-300">{data.merkle_root}</p>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [network, setNetwork] = useState<SoChainNetwork>("BTC");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SoChainSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await api.searchSoChain(network, query.trim());
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Blockchain Search</h1>
      <p className="mt-1 text-gray-400">
        Search addresses and blocks across BTC, LTC, DOGE networks via SoChain
      </p>

      <form onSubmit={handleSearch} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <select
          value={network}
          onChange={(e) => setNetwork(e.target.value as SoChainNetwork)}
          className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
        >
          {NETWORKS.map((n) => (
            <option key={n.value} value={n.value}>
              {n.label}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter address or block height..."
          className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
        />

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="rounded-lg bg-violet-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-lg border border-red-800 bg-red-900/30 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6">
          {result.type === "address" ? (
            <AddressResult result={result as SoChainSearchResult & { type: "address" }} />
          ) : (
            <BlockResult result={result as SoChainSearchResult & { type: "block" }} />
          )}
        </div>
      )}

      {!result && !loading && !error && (
        <div className="mt-12 rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
          <p className="text-gray-400">
            Enter a blockchain address or block height to search.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Powered by SoChain (chain.so) — supports Bitcoin, Litecoin, and Dogecoin networks.
          </p>
        </div>
      )}
    </div>
  );
}
