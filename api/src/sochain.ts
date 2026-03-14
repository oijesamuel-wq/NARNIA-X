/**
 * SoChain (chain.so) API v3 client
 * Blockchain explorer for BTC, LTC, DOGE networks
 */

const SOCHAIN_BASE = "https://chain.so/api/v3";
const SOCHAIN_API_KEY = process.env.SOCHAIN_API_KEY || "";

const SUPPORTED_NETWORKS = ["BTC", "LTC", "DOGE", "BTCTEST", "LTCTEST", "DOGETEST"] as const;
export type SoChainNetwork = (typeof SUPPORTED_NETWORKS)[number];

export function isValidNetwork(network: string): network is SoChainNetwork {
  return SUPPORTED_NETWORKS.includes(network.toUpperCase() as SoChainNetwork);
}

async function soFetch<T>(path: string): Promise<T> {
  const headers: Record<string, string> = { "Accept": "application/json" };
  if (SOCHAIN_API_KEY) {
    headers["API-KEY"] = SOCHAIN_API_KEY;
  }

  const res = await fetch(`${SOCHAIN_BASE}${path}`, { headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SoChain API error ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// --- Types ---

export interface SoChainBalance {
  status: string;
  data: {
    address: string;
    confirmed: string;
    unconfirmed: string;
  };
}

export interface SoChainAddressSummary {
  status: string;
  data: {
    address: string;
    confirmed_balance: string;
    unconfirmed_balance: string;
    confirmed_received: string;
    txs_sent: number;
    txs_received: number;
    txs_total: number;
  };
}

export interface SoChainTransaction {
  hash: string;
  value_sent: string;
  value_received: string;
  balance_change: string;
  time: number;
  block: number;
  price: string;
}

export interface SoChainTransactions {
  status: string;
  data: {
    address: string;
    transactions: SoChainTransaction[];
  };
}

export interface SoChainTxCounts {
  status: string;
  data: {
    address: string;
    sent: number;
    received: number;
    total: number;
  };
}

export interface SoChainBlock {
  status: string;
  data: {
    hash: string;
    height: number;
    difficulty: string;
    merkle_root: string;
    txs: number;
    reward: string;
    fees: string;
    time: number;
    size: number;
  };
}

// --- API methods ---

export async function getBalance(network: SoChainNetwork, address: string): Promise<SoChainBalance> {
  return soFetch<SoChainBalance>(`/balance/${network}/${address}`);
}

export async function getAddressSummary(network: SoChainNetwork, address: string): Promise<SoChainAddressSummary> {
  return soFetch<SoChainAddressSummary>(`/address_summary/${network}/${address}`);
}

export async function getTransactions(network: SoChainNetwork, address: string, page = 1): Promise<SoChainTransactions> {
  return soFetch<SoChainTransactions>(`/transactions/${network}/${address}/${page}`);
}

export async function getTransactionCounts(network: SoChainNetwork, address: string): Promise<SoChainTxCounts> {
  return soFetch<SoChainTxCounts>(`/transaction_counts/${network}/${address}`);
}

export async function getBlock(network: SoChainNetwork, blockHeight: number): Promise<SoChainBlock> {
  return soFetch<SoChainBlock>(`/block/${network}/${blockHeight}`);
}

/** Unified search: detects if query is a block height or address, queries accordingly */
export async function searchSoChain(network: SoChainNetwork, query: string) {
  const trimmed = query.trim();

  // If it looks like a block height (all digits)
  if (/^\d+$/.test(trimmed)) {
    const block = await getBlock(network, Number(trimmed));
    return { type: "block" as const, network, query: trimmed, result: block.data };
  }

  // Otherwise treat as address
  const [summary, txData] = await Promise.all([
    getAddressSummary(network, trimmed),
    getTransactions(network, trimmed, 1),
  ]);

  return {
    type: "address" as const,
    network,
    query: trimmed,
    result: {
      ...summary.data,
      recentTransactions: txData.data.transactions,
    },
  };
}
