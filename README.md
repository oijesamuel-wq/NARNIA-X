# NARNIA X — NarnUSD (nUSD) Ecosystem

A yield-bearing stablecoin extension built on the [M0 Foundation](https://m0.org) `m-extensions` framework, with on-chain credit scoring, autoburn mechanics, and an AI-powered risk assessment layer.

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│  NarnUSD (nUSD) │────▶│  Subgraph    │────▶│  NEXUS AI   │
│  Solidity EVM   │     │  The Graph   │     │  Python/FastAPI
│  Sepolia        │     │  Indexer     │     │  Credit Scoring
└────────┬────────┘     └──────────────┘     └──────┬──────┘
         │                                          │
    ┌────▼────────┐     ┌──────────────┐           │
    │  Backend API │◀───│  Frontend    │◀──────────┘
    │  Express/TS  │    │  Next.js 14  │
    │  Port 3001   │    │  Port 3000   │
    └──────────────┘    └──────────────┘
```

## Components

| Directory | Description | Stack |
|-----------|-------------|-------|
| `contracts/` | NarnUSD smart contract (MEarnerManager + autoburn, credit profiles, agent registry) | Solidity 0.8.26, Foundry |
| `api/` | Backend REST API + event indexer | TypeScript, Express, viem |
| `api/subgraph/` | The Graph subgraph for indexed event history | AssemblyScript, Graph CLI |
| `app/` | NARNIA X web frontend | Next.js 14, wagmi v2, RainbowKit, Tailwind |
| `nexus-ai/` | NEXUS AI credit scoring service | Python, FastAPI, SQLAlchemy, APScheduler |

## Key Contract Addresses (Sepolia)

- **nUSD Proxy:** `0x5f78eAbe8Bfe73b2EE23e51E9645D545649d20D4`
- **Implementation:** `0xb5592E8071FcfAB2F15D45494Fd9B4f27f17a254`
- **ProxyAdmin:** `0x6BFFb3A77520aac75F1469D2b87AB800E11EcE0f`
- **SwapFacility:** `0xB6807116b3B1B321a390594e31ECD6e0076f6278`
- **M Token:** `0x866A2BF4E572CbcF37D5071A7a58503Bfb36be1b`

All contracts verified on [Etherscan](https://sepolia.etherscan.io/address/0x5f78eAbe8Bfe73b2EE23e51E9645D545649d20D4#readProxyContract).

## Features

### NarnUSD Contract
- **Autoburn:** 0.10% (10 bps) burned from every transfer
- **Credit Profiles:** Per-address on-chain history (tx count, volume, weeks active, timestamps)
- **5-Tier Credit System:** New → Starter → Established → Reliable → Premium
- **Agent Registry:** Admin-managed registry for remittance corridor operators
- **ERC-7201 Storage:** Namespaced storage for upgrade safety

### NEXUS AI
- **10-Tier Scoring:** More granular than on-chain (0–9 vs 0–4)
- **Weighted Formula:** 6 factors — tx count, volume, consecutive weeks, account age, agent status, yield participation
- **Periodic Refresh:** Scoring runs on a configurable cron (default 5 min)
- **REST API:** `GET /scores`, `GET /scores/{address}`, `POST /scores/trigger`

## Quick Start

```bash
# Backend API (port 3001)
cd api && npm install && npm run dev

# Frontend (port 3000)
cd app && npm install && npm run dev

# NEXUS AI (port 8000)
cd nexus-ai && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn nexus_ai.server:app --port 8000
```

## License

BUSL-1.1 (contracts), MIT (everything else)
