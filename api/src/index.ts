import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { type Address, isAddress } from "viem";

import { PORT } from "./config.js";
import { getEcosystemMetrics, getCreditProfile, getAgentStatus } from "./blockchain.js";
import { startIndexer, getEvents, getEventCount, getAgentList } from "./indexer.js";

const app = express();
app.use(cors());
app.use(express.json());

// Rate limiting — 100 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60_000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});
app.use(limiter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "narnusd-api", timestamp: Date.now() });
});

// Ecosystem metrics (totalSupply, totalBurned, agentCount, earningStatus)
app.get("/api/metrics", async (_req, res) => {
  try {
    const metrics = await getEcosystemMetrics();
    res.json(metrics);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Full credit profile for NEXUS AI
app.get("/api/credit/:address", async (req, res) => {
  const { address } = req.params;
  if (!isAddress(address)) {
    return res.status(400).json({ error: "Invalid address" });
  }
  try {
    const profile = await getCreditProfile(address as Address);
    res.json(profile);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Batch credit profiles (POST with array of addresses)
app.post("/api/credit/batch", async (req, res) => {
  const { addresses } = req.body;
  if (!Array.isArray(addresses) || addresses.length === 0) {
    return res.status(400).json({ error: "Provide addresses array" });
  }
  if (addresses.length > 50) {
    return res.status(400).json({ error: "Max 50 addresses per batch" });
  }
  try {
    const valid = addresses.filter((a: string): a is Address => isAddress(a));
    const profiles = await Promise.all(
      valid.map((a) => getCreditProfile(a))
    );
    res.json(profiles);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List all registered agents
app.get("/api/agents", (_req, res) => {
  res.json({ agents: getAgentList(), count: getAgentList().length });
});

// Agent status for single address
app.get("/api/agents/:address", async (req, res) => {
  const { address } = req.params;
  if (!isAddress(address)) {
    return res.status(400).json({ error: "Invalid address" });
  }
  try {
    const status = await getAgentStatus(address as Address);
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Indexed events
app.get("/api/events", (req, res) => {
  const type = req.query.type as string | undefined;
  const limit = Math.min(Number(req.query.limit) || 100, 1000);
  res.json(getEvents(type, limit));
});

// Event counts
app.get("/api/events/count", (_req, res) => {
  res.json(getEventCount());
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(`[error] ${err.message}`);
  res.status(500).json({ error: "Internal server error" });
});

// Start
async function main() {
  await startIndexer();
  app.listen(PORT, () => {
    console.log(`[server] NARNIA X API running on http://localhost:${PORT}`);
    console.log(`[server] Endpoints:`);
    console.log(`  GET  /api/health`);
    console.log(`  GET  /api/metrics`);
    console.log(`  GET  /api/credit/:address`);
    console.log(`  POST /api/credit/batch`);
    console.log(`  GET  /api/agents`);
    console.log(`  GET  /api/agents/:address`);
    console.log(`  GET  /api/events?type=AutoBurned&limit=50`);
    console.log(`  GET  /api/events/count`);
  });
}

main().catch(console.error);
