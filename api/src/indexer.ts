import { formatUnits, type Log } from "viem";
import { client } from "./blockchain.js";
import { ADDRESSES, NARN_USD_ABI } from "./config.js";

export interface IndexedEvent {
  type: "AutoBurned" | "CreditProfileUpdated" | "AgentRegistered" | "Transfer";
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
  data: Record<string, unknown>;
}

// In-memory event store (replace with DB for production)
const events: IndexedEvent[] = [];
const MAX_EVENTS = 10_000;

// Agent registry — maintained from AgentRegistered events
const agents = new Set<string>();

export function getAgentList(): string[] {
  return Array.from(agents);
}

export function getEvents(type?: string, limit = 100): IndexedEvent[] {
  const filtered = type ? events.filter((e) => e.type === type) : events;
  return filtered.slice(-limit).reverse();
}

export function getEventCount(): Record<string, number> {
  const counts: Record<string, number> = { total: events.length };
  for (const e of events) {
    counts[e.type] = (counts[e.type] || 0) + 1;
  }
  return counts;
}

function pushEvent(event: IndexedEvent) {
  events.push(event);
  if (events.length > MAX_EVENTS) events.shift();
}

export async function startIndexer() {
  console.log("[indexer] Starting event watcher...");

  // Watch AutoBurned
  client.watchContractEvent({
    address: ADDRESSES.narnUSD,
    abi: NARN_USD_ABI,
    eventName: "AutoBurned",
    onLogs: (logs) => {
      for (const log of logs) {
        const args = (log as any).args;
        pushEvent({
          type: "AutoBurned",
          blockNumber: Number(log.blockNumber),
          transactionHash: log.transactionHash,
          timestamp: Date.now(),
          data: {
            from: args.from,
            amount: formatUnits(args.amount, 6),
            totalBurnedCumulative: formatUnits(args.totalBurnedCumulative, 6),
          },
        });
        console.log(`[indexer] AutoBurned: ${formatUnits(args.amount, 6)} nUSD from ${args.from}`);
      }
    },
  });

  // Watch CreditProfileUpdated
  client.watchContractEvent({
    address: ADDRESSES.narnUSD,
    abi: NARN_USD_ABI,
    eventName: "CreditProfileUpdated",
    onLogs: (logs) => {
      for (const log of logs) {
        const args = (log as any).args;
        pushEvent({
          type: "CreditProfileUpdated",
          blockNumber: Number(log.blockNumber),
          transactionHash: log.transactionHash,
          timestamp: Date.now(),
          data: {
            account: args.account,
            totalTx: Number(args.totalTx),
            totalVol: formatUnits(args.totalVol, 6),
          },
        });
      }
    },
  });

  // Watch AgentRegistered
  client.watchContractEvent({
    address: ADDRESSES.narnUSD,
    abi: NARN_USD_ABI,
    eventName: "AgentRegistered",
    onLogs: (logs) => {
      for (const log of logs) {
        const args = (log as any).args;
        pushEvent({
          type: "AgentRegistered",
          blockNumber: Number(log.blockNumber),
          transactionHash: log.transactionHash,
          timestamp: Date.now(),
          data: { account: args.account, status: args.status },
        });
        if (args.status) agents.add(args.account);
        else agents.delete(args.account);
        console.log(`[indexer] Agent ${args.status ? "added" : "removed"}: ${args.account}`);
      }
    },
  });

  // Watch Transfers
  client.watchContractEvent({
    address: ADDRESSES.narnUSD,
    abi: NARN_USD_ABI,
    eventName: "Transfer",
    onLogs: (logs) => {
      for (const log of logs) {
        const args = (log as any).args;
        pushEvent({
          type: "Transfer",
          blockNumber: Number(log.blockNumber),
          transactionHash: log.transactionHash,
          timestamp: Date.now(),
          data: {
            from: args.from,
            to: args.to,
            value: formatUnits(args.value, 6),
          },
        });
      }
    },
  });

  console.log("[indexer] Watching: AutoBurned, CreditProfileUpdated, AgentRegistered, Transfer");
}
