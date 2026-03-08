"""
NEXUS AI Scorer — data pipeline stub.

Pulls CreditProfile data from the narnusd-api backend (which in turn reads the
subgraph / on-chain), computes a weighted credit score, and persists to SQLite.

The scoring formula is a simple weighted sum for now. The AI model layer
(e.g. an XGBoost or transformer-based model) replaces `compute_score()` later.
"""

import logging
from datetime import datetime, timezone

import httpx
from sqlalchemy import select

from .config import NARNUSD_API_URL, SCORING_WEIGHTS
from .models import CreditScore, async_session

logger = logging.getLogger("nexus_ai.scorer")


async def _fetch_all_profiles() -> list[dict]:
    """Fetch credit profiles for all known accounts via the batch endpoint."""
    async with httpx.AsyncClient(timeout=30) as client:
        # Step 1: get agents list (these are the accounts we know about)
        agents_resp = await client.get(f"{NARNUSD_API_URL}/api/agents")
        agents_resp.raise_for_status()
        agent_addresses = agents_resp.json().get("agents", [])

        # Step 2: get recent event addresses (capture accounts that aren't agents)
        events_resp = await client.get(f"{NARNUSD_API_URL}/api/events?limit=500")
        events_resp.raise_for_status()
        events = events_resp.json()

        seen = set(agent_addresses)
        for ev in events:
            for key in ("from", "to", "account"):
                addr = ev.get("data", {}).get(key)
                if addr and addr != "0x0000000000000000000000000000000000000000":
                    seen.add(addr)

        addresses = list(seen)
        if not addresses:
            logger.info("No addresses to score")
            return []

        # Step 3: batch fetch credit profiles
        batch_resp = await client.post(
            f"{NARNUSD_API_URL}/api/credit/batch",
            json={"addresses": addresses[:50]},  # API max is 50
        )
        batch_resp.raise_for_status()
        return batch_resp.json()


def compute_score(profile: dict) -> float:
    """
    Weighted credit score (0–100). This is the stub formula.
    Replace with ML model inference later.
    """
    w = SCORING_WEIGHTS
    cp = profile.get("creditProfile", {})

    # Normalize components to 0–1 range
    tx_norm = min(cp.get("totalTransactions", 0) / 1000, 1.0)
    vol_norm = min(float(cp.get("totalVolumeTransferred", "0")) / 1_000_000, 1.0)
    weeks_norm = min(cp.get("consecutiveWeeksActive", 0) / 52, 1.0)

    first_tx = cp.get("firstTransactionTime", 0)
    if first_tx > 0:
        age_days = (datetime.now(timezone.utc).timestamp() - first_tx) / 86400
        age_norm = min(age_days / 365, 1.0)
    else:
        age_norm = 0.0

    agent_norm = 1.0 if profile.get("isAgent") else 0.0
    yield_norm = min(float(profile.get("yield", {}).get("net", "0")) / 10_000, 1.0)

    raw = (
        w["transaction_count"] * tx_norm
        + w["volume"] * vol_norm
        + w["consecutive_weeks"] * weeks_norm
        + w["account_age_days"] * age_norm
        + w["is_agent"] * agent_norm
        + w["yield_participation"] * yield_norm
    )

    return round(raw * 100, 2)


def score_to_tier(score: float) -> int:
    """Map 0–100 score to 0–9 tier (more granular than on-chain 0–4)."""
    if score >= 90:
        return 9
    return int(score // 10)


async def run_scoring_cycle():
    """One full scoring cycle: fetch → compute → persist."""
    logger.info("Starting scoring cycle...")

    try:
        profiles = await _fetch_all_profiles()
    except Exception as e:
        logger.error(f"Failed to fetch profiles: {e}")
        return

    if not profiles:
        logger.info("No profiles to score")
        return

    async with async_session() as session:
        for p in profiles:
            addr = p.get("address", "").lower()
            if not addr:
                continue

            score = compute_score(p)
            tier = score_to_tier(score)
            cp = p.get("creditProfile", {})

            first_tx = cp.get("firstTransactionTime", 0)
            age_days = int((datetime.now(timezone.utc).timestamp() - first_tx) / 86400) if first_tx > 0 else 0

            # Upsert
            existing = await session.get(CreditScore, addr)
            if existing:
                existing.on_chain_tier = p.get("creditTier", 0)
                existing.nexus_score = score
                existing.nexus_tier = tier
                existing.tx_count = cp.get("totalTransactions", 0)
                existing.volume = float(cp.get("totalVolumeTransferred", "0"))
                existing.consecutive_weeks = cp.get("consecutiveWeeksActive", 0)
                existing.account_age_days = age_days
                existing.is_agent = p.get("isAgent", False)
                existing.yield_net = float(p.get("yield", {}).get("net", "0"))
                existing.updated_at = datetime.utcnow()
            else:
                session.add(CreditScore(
                    address=addr,
                    on_chain_tier=p.get("creditTier", 0),
                    nexus_score=score,
                    nexus_tier=tier,
                    tx_count=cp.get("totalTransactions", 0),
                    volume=float(cp.get("totalVolumeTransferred", "0")),
                    consecutive_weeks=cp.get("consecutiveWeeksActive", 0),
                    account_age_days=age_days,
                    is_agent=p.get("isAgent", False),
                    yield_net=float(p.get("yield", {}).get("net", "0")),
                ))

        await session.commit()

    logger.info(f"Scored {len(profiles)} accounts")
