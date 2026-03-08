from datetime import datetime

from sqlalchemy import Column, String, Float, Integer, DateTime, Boolean
from sqlalchemy.ext.asyncio import AsyncAttrs, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from .config import DATABASE_URL


class Base(AsyncAttrs, DeclarativeBase):
    pass


class CreditScore(Base):
    __tablename__ = "credit_scores"

    address = Column(String, primary_key=True, index=True)
    # On-chain tier (0–4) from the contract
    on_chain_tier = Column(Integer, nullable=False, default=0)
    # NEXUS weighted score (0.0–100.0)
    nexus_score = Column(Float, nullable=False, default=0.0)
    # NEXUS tier (0–9, more granular than on-chain)
    nexus_tier = Column(Integer, nullable=False, default=0)
    # Component scores
    tx_count = Column(Integer, default=0)
    volume = Column(Float, default=0.0)
    consecutive_weeks = Column(Integer, default=0)
    account_age_days = Column(Integer, default=0)
    is_agent = Column(Boolean, default=False)
    yield_net = Column(Float, default=0.0)
    # Metadata
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, expire_on_commit=False)


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
