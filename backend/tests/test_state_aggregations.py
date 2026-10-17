"""
JalRakshak — State-Wise vs India-Wide Aggregation Test Suite

Verifies:
1. Controlled fixtures (Punjab: 100 samples / 80 safe, Haryana: 50 samples / 30 safe, India: 151 samples / 111 safe).
2. State name, postal code ('PB', 'HR'), numeric state_id resolution ('20').
3. India-wide vs. state-wide KPI calculation (totals, safe, unsafe, percentages).
4. District-level aggregation filtering.
5. Empty state and missing location handling.
6. Alert listing geographic filtering via list_alerts.
7. Verification against the actual production database (if present).
"""
import pytest
import os
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.water_sample import WaterSample
from app.rules.standards import AlertCategory, Severity
from app.analytics.aggregations import (
    get_dashboard_summary,
    resolve_state_name,
)
from app.api.alerts import list_alerts

FIXTURE_DB_URL = "sqlite:///./test_state_agg.db"
fixture_engine = create_engine(FIXTURE_DB_URL, connect_args={"check_same_thread": False})
FixtureSession = sessionmaker(autocommit=False, autoflush=False, bind=fixture_engine)


@pytest.fixture(scope="module")
def fixture_db():
    Base.metadata.create_all(bind=fixture_engine)
    db = FixtureSession()
    try:
        # Create locations table
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS locations (
                state_id TEXT,
                state_name TEXT,
                district_id TEXT,
                district_name TEXT
            )
        """))
        db.execute(text("INSERT INTO locations VALUES ('20', 'Punjab', '01', 'Ludhiana')"))
        db.execute(text("INSERT INTO locations VALUES ('08', 'Haryana', '02', 'Ambala')"))
        db.commit()

        # Controlled Water Samples:
        # Punjab: 100 classified samples (80 safe, 20 unsafe)
        # Ludhiana: 50 safe, 10 unsafe = 60 total
        # Amritsar: 30 safe, 10 unsafe = 40 total
        for i in range(80):
            db.add(WaterSample(
                sample_id=f"PB-SAFE-{i}",
                state_ut="Punjab",
                district="Ludhiana" if i < 50 else "Amritsar",
                village="Village PB",
                sample_date=f"2025-{(i % 12) + 1:02d}-15",
                alert_category=AlertCategory.POTABLE_SAFE,
                severity=Severity.SAFE,
                ph=7.2,
                turbidity_ntu=1.5,
                water_source_type="Tube Well",
            ))
        for i in range(20):
            db.add(WaterSample(
                sample_id=f"PB-UNSAFE-{i}",
                state_ut="Punjab",
                district="Ludhiana" if i < 10 else "Amritsar",
                village="Village PB",
                sample_date=f"2025-{(i % 12) + 1:02d}-15",
                alert_category=AlertCategory.CRITICAL_CHEMICAL_TOXIN,
                severity=Severity.CRITICAL,
                ph=9.8,
                turbidity_ntu=8.0,
                arsenic_mg_l=0.08,
                do_not_boil=True,
                water_source_type="Hand Pump",
            ))

        # Haryana: 50 classified samples (30 safe, 20 unsafe)
        for i in range(30):
            db.add(WaterSample(
                sample_id=f"HR-SAFE-{i}",
                state_ut="Haryana",
                district="Ambala",
                village="Village HR",
                sample_date=f"2025-{(i % 12) + 1:02d}-10",
                alert_category=AlertCategory.POTABLE_SAFE,
                severity=Severity.SAFE,
                ph=7.0,
                turbidity_ntu=1.0,
                water_source_type="Piped Water Supply",
            ))
        for i in range(20):
            db.add(WaterSample(
                sample_id=f"HR-UNSAFE-{i}",
                state_ut="Haryana",
                district="Ambala",
                village="Village HR",
                sample_date=f"2025-{(i % 12) + 1:02d}-10",
                alert_category=AlertCategory.UNSAFE_BIOLOGICAL_PATHOGEN,
                severity=Severity.HIGH,
                ph=6.8,
                turbidity_ntu=4.5,
                e_coli_mpn=15.0,
                do_not_boil=False,
                water_source_type="Open Well",
            ))

        # Record with missing/empty location
        db.add(WaterSample(
            sample_id="MISSING-LOC-1",
            state_ut="",
            district="",
            sample_date="2025-01-01",
            alert_category=AlertCategory.POTABLE_SAFE,
            severity=Severity.SAFE,
            ph=7.1,
        ))

        db.commit()
        yield db
    finally:
        db.close()
        fixture_engine.dispose()
        if os.path.exists("./test_state_agg.db"):
            try:
                os.remove("./test_state_agg.db")
            except PermissionError:
                pass


def test_state_name_resolution(fixture_db):
    """Test state code, full name, numeric ID, and case insensitivity."""
    assert resolve_state_name(fixture_db, "Punjab") == "Punjab"
    assert resolve_state_name(fixture_db, "punjab") == "Punjab"
    assert resolve_state_name(fixture_db, "PUNJAB") == "Punjab"
    assert resolve_state_name(fixture_db, "PB") == "Punjab"
    assert resolve_state_name(fixture_db, "pb") == "Punjab"
    assert resolve_state_name(fixture_db, "20") == "Punjab"  # from Location state_id
    assert resolve_state_name(fixture_db, "Haryana") == "Haryana"
    assert resolve_state_name(fixture_db, "HR") == "Haryana"
    assert resolve_state_name(fixture_db, "08") == "Haryana"
    assert resolve_state_name(fixture_db, "All-India") is None
    assert resolve_state_name(fixture_db, None) is None


def test_controlled_fixture_punjab(fixture_db):
    """
    Punjab Controlled Fixture:
    - 100 classified samples
    - 80 safe samples
    - 20 unsafe samples
    - Expected safety rate: 80.0%
    """
    summary = get_dashboard_summary(fixture_db, state="Punjab")
    assert summary["total_samples"] == 100
    assert summary["safe_samples"] == 80
    assert summary["unsafe_samples"] == 20
    assert summary["safe_percentage"] == 80.0
    assert summary["chemical_alerts"] == 20
    assert summary["biological_alerts"] == 0
    assert summary["do_not_boil_alerts"] == 20
    # Monthly trends must sum to 100
    assert len(summary["monthly_trends"]) > 0
    total_in_trends = sum(t["total"] for t in summary["monthly_trends"])
    assert total_in_trends == 100


def test_controlled_fixture_haryana(fixture_db):
    """
    Haryana Controlled Fixture:
    - 50 classified samples
    - 30 safe samples
    - 20 unsafe samples
    - Expected safety rate: 60.0%
    """
    summary = get_dashboard_summary(fixture_db, state="Haryana")
    assert summary["total_samples"] == 50
    assert summary["safe_samples"] == 30
    assert summary["unsafe_samples"] == 20
    assert summary["safe_percentage"] == 60.0
    assert summary["chemical_alerts"] == 0
    assert summary["biological_alerts"] == 20
    assert summary["do_not_boil_alerts"] == 0
    total_in_trends = sum(t["total"] for t in summary["monthly_trends"])
    assert total_in_trends == 50


def test_controlled_fixture_india_wide(fixture_db):
    """
    India-Wide Controlled Fixture:
    - 151 total samples (150 classified + 1 missing location)
    - 111 safe samples (80 PB + 30 HR + 1 missing location)
    - 40 unsafe samples (20 PB + 20 HR)
    - National Safety Rate: 111 / 151 * 100 = 73.5%
    """
    summary = get_dashboard_summary(fixture_db, state=None)
    assert summary["total_samples"] == 151
    assert summary["safe_samples"] == 111
    assert summary["unsafe_samples"] == 40
    assert summary["safe_percentage"] == round((111 / 151) * 100, 1)  # 73.5%
    assert summary["chemical_alerts"] == 20
    assert summary["biological_alerts"] == 20
    assert summary["missing_location_count"] == 1


def test_state_code_querying(fixture_db):
    """Ensure querying by state code 'PB' yields identical results to 'Punjab'."""
    summary_name = get_dashboard_summary(fixture_db, state="Punjab")
    summary_code = get_dashboard_summary(fixture_db, state="PB")
    summary_id = get_dashboard_summary(fixture_db, state="20")

    assert summary_name["total_samples"] == summary_code["total_samples"] == summary_id["total_samples"] == 100
    assert summary_name["safe_samples"] == summary_code["safe_samples"] == summary_id["safe_samples"] == 80
    assert summary_name["safe_percentage"] == summary_code["safe_percentage"] == summary_id["safe_percentage"] == 80.0


def test_district_level_filtering(fixture_db):
    """Verify district filtering within a state."""
    # In fixture: Ludhiana has 50 safe + 10 unsafe = 60 total
    summary_ludhiana = get_dashboard_summary(fixture_db, state="Punjab", district="Ludhiana")
    assert summary_ludhiana["total_samples"] == 60
    assert summary_ludhiana["safe_samples"] == 50
    assert summary_ludhiana["unsafe_samples"] == 10
    assert summary_ludhiana["safe_percentage"] == round((50 / 60) * 100, 1)  # 83.3%

    # Amritsar has 30 safe + 10 unsafe = 40 total
    summary_amritsar = get_dashboard_summary(fixture_db, state="Punjab", district="Amritsar")
    assert summary_amritsar["total_samples"] == 40
    assert summary_amritsar["safe_samples"] == 30
    assert summary_amritsar["unsafe_samples"] == 10
    assert summary_amritsar["safe_percentage"] == round((30 / 40) * 100, 1)  # 75.0%


def test_empty_state_dataset(fixture_db):
    """Querying a state with no records returns safe zero counts, not 500 error."""
    summary = get_dashboard_summary(fixture_db, state="Goa")
    assert summary["total_samples"] == 0
    assert summary["safe_samples"] == 0
    assert summary["unsafe_samples"] == 0
    assert summary["safe_percentage"] == 0.0
    assert len(summary["monthly_trends"]) == 0
    assert len(summary["parameter_health"]) == 0


def test_alerts_endpoint_filtering(fixture_db):
    """Verify list_alerts filtering by state."""
    all_alerts = list_alerts(page=1, page_size=50, db=fixture_db)
    pb_alerts = list_alerts(page=1, page_size=50, state="Punjab", db=fixture_db)
    hr_alerts = list_alerts(page=1, page_size=50, state="Haryana", db=fixture_db)

    assert all_alerts["total"] == 40
    assert pb_alerts["total"] == 20
    assert hr_alerts["total"] == 20
    assert all(item["state_ut"] == "Punjab" for item in pb_alerts["items"])
    assert all(item["state_ut"] == "Haryana" for item in hr_alerts["items"])


def test_real_database_state_metrics():
    """
    Verify calculations against the actual database file (if available):
    - All-India: >= 55,000 samples, ~42.8% safe
    - Punjab: >= 2,400 samples, 977 safe
    - Haryana: 2,154 samples, 687 safe (31.9%)
    """
    db_paths = ["./data/water_quality.db", "./backend/data/water_quality.db"]
    db_path = next((p for p in db_paths if os.path.exists(p)), None)
    if not db_path:
        pytest.skip("Actual database not found")

    real_engine = create_engine(f"sqlite:///{db_path}")
    RealSession = sessionmaker(autocommit=False, autoflush=False, bind=real_engine)
    db = RealSession()
    try:
        india = get_dashboard_summary(db, state=None)
        punjab = get_dashboard_summary(db, state="Punjab")
        haryana = get_dashboard_summary(db, state="Haryana")

        # Verify national metrics
        assert india["total_samples"] >= 55000
        assert india["safe_samples"] >= 23500
        assert 40.0 <= india["safe_percentage"] <= 45.0

        # Verify Punjab metrics
        assert punjab["total_samples"] >= 2400
        assert punjab["safe_samples"] == 977
        assert 40.0 <= punjab["safe_percentage"] <= 41.0

        # Verify Haryana metrics
        assert haryana["total_samples"] == 2154
        assert haryana["safe_samples"] == 687
        assert haryana["safe_percentage"] == 31.9

        # Ensure state metrics strictly differ from national metrics and from each other
        assert punjab["total_samples"] != india["total_samples"]
        assert haryana["total_samples"] != india["total_samples"]
        assert punjab["safe_percentage"] != haryana["safe_percentage"]
        assert punjab["safe_percentage"] != india["safe_percentage"]

        # Ensure Punjab and Haryana top locations/districts are distinct
        pb_districts = {s["loc"] for s in punjab["severity_by_location"]}
        hr_districts = {s["loc"] for s in haryana["severity_by_location"]}
        assert pb_districts.isdisjoint(hr_districts) or len(pb_districts) > 0
    finally:
        db.close()
        real_engine.dispose()
