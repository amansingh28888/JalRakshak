"""
JalRakshak — FastAPI Application Entry Point
============================================
AI-Based Water Quality Monitoring & Vernacular Alert System

Architecture Principle:
  DETERMINISTIC RULE ENGINE = SAFETY AUTHORITY
  GEMINI = VERNACULAR COMMUNICATION LAYER (never reversed)
"""
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db

settings = get_settings()

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("jalrakshak")


# ── Startup / shutdown ────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("JalRakshak starting...")
    logger.info(f"Environment: {settings.app_env}")
    logger.info(f"Database: {settings.database_url}")
    logger.info(f"Gemini available: {settings.gemini_available}")

    # Create tables
    init_db()
    logger.info("Database tables initialized.")

    # Auto-load synthetic data if database is empty
    from app.database import SessionLocal
    from app.models.water_sample import WaterSample

    db = SessionLocal()
    try:
        count = db.query(WaterSample).count()
        if count == 0:
            logger.info("Database is empty. Loading synthetic demo data...")
            from app.utils.synthetic_data import generate_synthetic_dataset
            from app.services.import_service import import_samples_from_records

            raw_path = Path(settings.raw_data_path)
            if raw_path.exists():
                logger.info(f"Found CSV dataset at {raw_path}. Loading from CSV...")
                try:
                    import pandas as pd
                    from app.utils.column_mapper import build_reverse_map

                    df = pd.read_csv(raw_path)
                    col_map = build_reverse_map(df.columns.tolist())
                    df = df.rename(columns=col_map)
                    records = df.where(df.notna(), None).to_dict(orient="records")
                    report = import_samples_from_records(records, db, batch_id="STARTUP_CSV")
                    logger.info(
                        f"CSV import complete: {report.rows_accepted} accepted, "
                        f"{report.rows_rejected} rejected."
                    )
                except Exception as e:
                    logger.warning(f"CSV import failed ({e}). Falling back to synthetic data.")
                    records = generate_synthetic_dataset(n=5000)
                    import_samples_from_records(records, db, batch_id="SYNTHETIC_FALLBACK")
            else:
                logger.info("No CSV found. Generating synthetic demo data (5000 samples)...")
                records = generate_synthetic_dataset(n=5000)
                import_samples_from_records(records, db, batch_id="SYNTHETIC")
                logger.info("Synthetic data loaded.")
        else:
            logger.info(f"Database has {count} existing samples.")
    finally:
        db.close()

    yield

    logger.info("JalRakshak shutting down.")


# ── Application ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="JalRakshak API",
    description=(
        "AI-Based Water Quality Monitoring & Vernacular Alert System. "
        "Deterministic rule engine for safety decisions; Gemini for Hindi communication only."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
from app.api.samples import router as samples_router
from app.api.dashboard import router as dashboard_router
from app.api.alerts import router as alerts_router
from app.api.map import router as map_router
from app.api.evaluate import router as evaluate_router
from app.api.ai import router as ai_router
from app.api.worker import router as worker_router
from app.api.admin import router as admin_router
from app.api.auth import router as auth_router

app.include_router(samples_router)
app.include_router(dashboard_router)
app.include_router(alerts_router)
app.include_router(map_router)
app.include_router(evaluate_router)
app.include_router(ai_router)
app.include_router(worker_router)
app.include_router(admin_router)
app.include_router(auth_router)


# ── Core endpoints ────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    """Health check endpoint."""
    from app.database import SessionLocal
    from app.models.water_sample import WaterSample

    db = SessionLocal()
    try:
        count = db.query(WaterSample).count()
    finally:
        db.close()

    return {
        "status": "ok",
        "service": "JalRakshak",
        "version": "1.0.0",
        "gemini_configured": settings.gemini_available,
        "database_samples": count,
    }


@app.get("/api/states")
def api_states():
    from app.database import SessionLocal
    from app.models.water_sample import WaterSample
    from sqlalchemy import distinct

    db = SessionLocal()
    try:
        rows = db.query(distinct(WaterSample.state_ut)).order_by(WaterSample.state_ut).all()
        return [r[0] for r in rows if r[0]]
    finally:
        db.close()


@app.get("/api/districts")
def api_districts(state: str = None):
    from app.database import SessionLocal
    from app.models.water_sample import WaterSample
    from sqlalchemy import distinct

    db = SessionLocal()
    try:
        q = db.query(distinct(WaterSample.district)).order_by(WaterSample.district)
        if state:
            q = q.filter(WaterSample.state_ut == state)
        rows = q.all()
        return [r[0] for r in rows if r[0]]
    finally:
        db.close()


@app.get("/api/standards")
def api_standards():
    """Return the configured water quality standards (IS 10500:2012)."""
    from app.rules.standards import WATER_STANDARDS, ACTION_CODE_LABELS, CATEGORY_LABELS

    return {
        "reference": "IS 10500:2012 — Bureau of Indian Standards, Drinking Water Specification",
        "parameters": {
            k: {
                "name": v.name,
                "unit": v.unit,
                "acceptable_limit": v.acceptable_limit,
                "permissible_limit": v.permissible_limit,
                "lower_limit": v.lower_limit,
                "upper_limit": v.upper_limit,
                "no_relaxation": v.no_relaxation,
                "is_chemical_hazard": v.is_chemical_hazard,
                "is_biological_hazard": v.is_biological_hazard,
                "is_physical_param": v.is_physical_param,
                "interpretation": v.interpretation,
                "recommended_action": v.recommended_action,
                "reference": v.reference,
            }
            for k, v in WATER_STANDARDS.items()
        },
        "action_codes": ACTION_CODE_LABELS,
        "categories": CATEGORY_LABELS,
    }


@app.get("/api/demo/scenario/{scenario}")
def demo_scenario(scenario: str):
    """
    Return a pre-built demo scenario for UI demonstration.
    Scenarios: safe, biological, chemical, mixed, physical
    """
    SCENARIOS = {
        "safe": {
            "name": "Scenario A — Safe Water",
            "description": "All parameters within IS 10500:2012 acceptable limits.",
            "sample": {
                "state_ut": "Kerala",
                "district": "Palakkad",
                "village": "Chandanpur",
                "water_source_type": "Piped Tap",
                "ph": 7.2,
                "turbidity_ntu": 0.5,
                "tds_mg_l": 280,
                "fluoride_mg_l": 0.6,
                "arsenic_mg_l": 0.003,
                "nitrate_mg_l": 18,
                "e_coli_mpn": 0,
                "total_coliform_mpn": 0,
            },
        },
        "biological": {
            "name": "Scenario B — Biological Contamination",
            "description": "E. coli detected. Boiling/chlorination is the correct action.",
            "sample": {
                "state_ut": "Bihar",
                "district": "Vaishali",
                "village": "Rampur",
                "water_source_type": "Handpump",
                "ph": 7.1,
                "turbidity_ntu": 2.1,
                "tds_mg_l": 420,
                "fluoride_mg_l": 0.5,
                "arsenic_mg_l": 0.004,
                "nitrate_mg_l": 22,
                "e_coli_mpn": 320,
                "total_coliform_mpn": 1200,
            },
        },
        "chemical": {
            "name": "Scenario C — Chemical Contamination (DO NOT BOIL)",
            "description": "Fluoride exceeds permissible limit. Boiling concentrates fluoride — DO NOT BOIL.",
            "sample": {
                "state_ut": "Rajasthan",
                "district": "Barmer",
                "village": "Laxmipur",
                "water_source_type": "Groundwater",
                "ph": 7.8,
                "turbidity_ntu": 0.3,
                "tds_mg_l": 850,
                "fluoride_mg_l": 2.45,
                "arsenic_mg_l": 0.004,
                "nitrate_mg_l": 28,
                "e_coli_mpn": 0,
                "total_coliform_mpn": 0,
            },
        },
        "mixed": {
            "name": "Scenario D — Mixed Chemical + Biological (Chemical Priority)",
            "description": "Both arsenic and E. coli detected. Chemical priority — DO NOT BOIL.",
            "sample": {
                "state_ut": "West Bengal",
                "district": "Murshidabad",
                "village": "Krishnapur",
                "water_source_type": "Groundwater",
                "ph": 7.3,
                "turbidity_ntu": 3.2,
                "tds_mg_l": 680,
                "fluoride_mg_l": 0.4,
                "arsenic_mg_l": 0.08,
                "nitrate_mg_l": 35,
                "e_coli_mpn": 450,
                "total_coliform_mpn": 1800,
            },
        },
        "physical": {
            "name": "Scenario E — Physical Parameter Concern",
            "description": "High turbidity and TDS. Filtration and retest required.",
            "sample": {
                "state_ut": "Assam",
                "district": "Dhubri",
                "village": "Gangapur",
                "water_source_type": "Surface Water",
                "ph": 7.0,
                "turbidity_ntu": 18.5,
                "tds_mg_l": 1250,
                "fluoride_mg_l": 0.3,
                "arsenic_mg_l": 0.002,
                "nitrate_mg_l": 15,
                "e_coli_mpn": 0,
                "total_coliform_mpn": 0,
            },
        },
    }

    if scenario not in SCENARIOS:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=404,
            detail=f"Scenario '{scenario}' not found. Valid: {list(SCENARIOS.keys())}"
        )

    scenario_data = SCENARIOS[scenario]
    # Run rule engine on scenario
    from app.rules.water_quality_rules import evaluate_sample

    verdict = evaluate_sample(scenario_data["sample"])
    return {
        **scenario_data,
        "verdict": verdict.to_dict(),
    }
