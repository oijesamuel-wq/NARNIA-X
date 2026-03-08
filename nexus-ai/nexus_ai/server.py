"""
NEXUS AI — FastAPI server.

Endpoints:
  GET /health              — service health
  GET /scores              — all scored accounts
  GET /scores/{address}    — single account score
  POST /scores/trigger     — manually trigger a scoring cycle
"""

import logging
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI, HTTPException
from sqlalchemy import select, func

from .config import SCORING_INTERVAL
from .models import CreditScore, async_session, init_db
from .scorer import run_scoring_cycle

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger("nexus_ai")

scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    logger.info("Database initialized")

    # Schedule periodic scoring
    scheduler.add_job(run_scoring_cycle, "interval", seconds=SCORING_INTERVAL, id="scoring")
    scheduler.start()
    logger.info(f"Scheduler started (interval={SCORING_INTERVAL}s)")

    # Run initial scoring cycle
    await run_scoring_cycle()

    yield

    # Shutdown
    scheduler.shutdown()


app = FastAPI(title="NEXUS AI", version="0.1.0", lifespan=lifespan)


@app.get("/health")
async def health():
    async with async_session() as session:
        count = await session.scalar(select(func.count()).select_from(CreditScore))
    return {
        "status": "ok",
        "service": "nexus-ai",
        "scored_accounts": count,
        "scoring_interval_seconds": SCORING_INTERVAL,
    }


@app.get("/scores")
async def list_scores(limit: int = 100, min_score: float = 0):
    async with async_session() as session:
        stmt = (
            select(CreditScore)
            .where(CreditScore.nexus_score >= min_score)
            .order_by(CreditScore.nexus_score.desc())
            .limit(min(limit, 500))
        )
        result = await session.execute(stmt)
        rows = result.scalars().all()

    return [
        {
            "address": r.address,
            "nexus_score": r.nexus_score,
            "nexus_tier": r.nexus_tier,
            "on_chain_tier": r.on_chain_tier,
            "tx_count": r.tx_count,
            "volume": r.volume,
            "consecutive_weeks": r.consecutive_weeks,
            "account_age_days": r.account_age_days,
            "is_agent": r.is_agent,
            "yield_net": r.yield_net,
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
        }
        for r in rows
    ]


@app.get("/scores/{address}")
async def get_score(address: str):
    addr = address.lower()
    async with async_session() as session:
        row = await session.get(CreditScore, addr)
    if not row:
        raise HTTPException(404, detail="Address not scored yet")
    return {
        "address": row.address,
        "nexus_score": row.nexus_score,
        "nexus_tier": row.nexus_tier,
        "on_chain_tier": row.on_chain_tier,
        "tx_count": row.tx_count,
        "volume": row.volume,
        "consecutive_weeks": row.consecutive_weeks,
        "account_age_days": row.account_age_days,
        "is_agent": row.is_agent,
        "yield_net": row.yield_net,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


@app.post("/scores/trigger")
async def trigger_scoring():
    await run_scoring_cycle()
    return {"status": "ok", "message": "Scoring cycle completed"}
