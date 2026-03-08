import os

# Data sources
NARNUSD_API_URL = os.getenv("NARNUSD_API_URL", "http://localhost:3001")
SUBGRAPH_URL = os.getenv(
    "SUBGRAPH_URL",
    # Placeholder — replace with actual Subgraph Studio endpoint once deployed
    "http://localhost:8000/subgraphs/name/narnusd-sepolia",
)

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///nexus_scores.db")

# Scoring weights (these are the stub weights — the AI model layer replaces them later)
SCORING_WEIGHTS = {
    "transaction_count": 0.15,
    "volume": 0.25,
    "consecutive_weeks": 0.30,
    "account_age_days": 0.10,
    "is_agent": 0.10,
    "yield_participation": 0.10,
}

# Cron interval (seconds)
SCORING_INTERVAL = int(os.getenv("SCORING_INTERVAL", "300"))  # 5 minutes default
