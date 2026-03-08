"""
Subgraph client for NEXUS AI.

Queries The Graph for historical indexed data: accounts, burns, transfers.
Falls back to the narnusd-api REST endpoints if subgraph is unavailable.
"""

import logging
from typing import Optional

import httpx

from .config import SUBGRAPH_URL

logger = logging.getLogger("nexus_ai.subgraph")

ACCOUNTS_QUERY = """
query GetAccounts($first: Int!, $skip: Int!, $minTx: BigInt!) {
  accounts(
    first: $first
    skip: $skip
    where: { totalTransactions_gte: $minTx }
    orderBy: totalVolumeTransferred
    orderDirection: desc
  ) {
    id
    balance
    isAgent
    creditTier
    totalTransactions
    totalVolumeTransferred
    firstTransactionTime
    lastTransactionTime
    consecutiveWeeksActive
  }
}
"""

PROTOCOL_QUERY = """
query GetProtocol {
  protocol(id: "1") {
    totalSupply
    totalBurned
    agentCount
    transferCount
    burnCount
  }
}
"""

BURNS_QUERY = """
query GetBurns($first: Int!) {
  autoBurns(first: $first, orderBy: blockTimestamp, orderDirection: desc) {
    id
    from { id }
    amount
    totalBurnedCumulative
    blockTimestamp
    transactionHash
  }
}
"""


async def _query(query: str, variables: Optional[dict] = None) -> Optional[dict]:
    """Execute a GraphQL query against the subgraph."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                SUBGRAPH_URL,
                json={"query": query, "variables": variables or {}},
            )
            resp.raise_for_status()
            data = resp.json()
            if "errors" in data:
                logger.warning(f"Subgraph errors: {data['errors']}")
                return None
            return data.get("data")
    except Exception as e:
        logger.warning(f"Subgraph query failed: {e}")
        return None


async def fetch_accounts_from_subgraph(
    first: int = 100, skip: int = 0, min_tx: int = 0
) -> Optional[list[dict]]:
    """Fetch accounts from subgraph. Returns None if unavailable."""
    data = await _query(ACCOUNTS_QUERY, {"first": first, "skip": skip, "minTx": str(min_tx)})
    if data and "accounts" in data:
        return data["accounts"]
    return None


async def fetch_protocol_stats() -> Optional[dict]:
    """Fetch protocol-level stats from subgraph."""
    data = await _query(PROTOCOL_QUERY)
    if data and "protocol" in data:
        return data["protocol"]
    return None


async def fetch_recent_burns(first: int = 50) -> Optional[list[dict]]:
    """Fetch recent AutoBurn events from subgraph."""
    data = await _query(BURNS_QUERY, {"first": first})
    if data and "autoBurns" in data:
        return data["autoBurns"]
    return None


async def is_subgraph_available() -> bool:
    """Check if the subgraph is reachable and has data."""
    stats = await fetch_protocol_stats()
    return stats is not None
