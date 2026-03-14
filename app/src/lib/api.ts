const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface Metrics {
  totalSupply: string;
  totalBurned: string;
  agentCount: number;
  isEarningEnabled: boolean;
  feeRecipient: string;
  contract: string;
  chain: string;
  chainId: number;
}

export interface CreditProfile {
  address: string;
  balance: string;
  isWhitelisted: boolean;
  isAgent: boolean;
  feeRate: number;
  creditTier: number;
  creditTierName: string;
  creditProfile: {
    totalTransactions: number;
    totalVolumeTransferred: string;
    firstTransactionTime: number;
    lastTransactionTime: number;
    consecutiveWeeksActive: number;
    lastActiveWeek: number;
  };
  yield: {
    gross: string;
    fee: string;
    net: string;
  };
}

export interface AgentList {
  agents: string[];
  count: number;
}

export interface IndexedEvent {
  type: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
  data: Record<string, unknown>;
}

async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as Record<string, string>).error || `API ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// --- SoChain types ---

export type SoChainNetwork = "BTC" | "LTC" | "DOGE" | "BTCTEST" | "LTCTEST" | "DOGETEST";

export interface SoChainSearchResultAddress {
  type: "address";
  network: string;
  query: string;
  result: {
    address: string;
    confirmed_balance: string;
    unconfirmed_balance: string;
    confirmed_received: string;
    txs_sent: number;
    txs_received: number;
    txs_total: number;
    recentTransactions: {
      hash: string;
      value_sent: string;
      value_received: string;
      balance_change: string;
      time: number;
      block: number;
      price: string;
    }[];
  };
}

export interface SoChainSearchResultBlock {
  type: "block";
  network: string;
  query: string;
  result: {
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

export type SoChainSearchResult = SoChainSearchResultAddress | SoChainSearchResultBlock;

export const api = {
  getMetrics: () => fetchJSON<Metrics>("/api/metrics"),
  getCreditProfile: (address: string) => fetchJSON<CreditProfile>(`/api/credit/${address}`),
  getAgents: () => fetchJSON<AgentList>("/api/agents"),
  getAgentStatus: (address: string) => fetchJSON<{ address: string; isAgent: boolean; isWhitelisted: boolean }>(`/api/agents/${address}`),
  getEvents: (type?: string, limit = 100) =>
    fetchJSON<IndexedEvent[]>(`/api/events?${type ? `type=${type}&` : ""}limit=${limit}`),
  getEventCount: () => fetchJSON<Record<string, number>>("/api/events/count"),

  // SoChain search
  searchSoChain: (network: SoChainNetwork, query: string) =>
    fetchJSON<SoChainSearchResult>(`/api/sochain/search/${network}/${encodeURIComponent(query)}`),
};
