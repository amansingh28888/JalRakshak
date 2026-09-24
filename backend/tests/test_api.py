"""
JalRakshak — API Integration Tests
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import get_db, Base


# ── Test database setup ───────────────────────────────────────────────────────
TEST_DATABASE_URL = "sqlite:///./test_water_quality.db"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    """Create test tables and load minimal test data."""
    Base.metadata.create_all(bind=test_engine)

    from app.utils.synthetic_data import generate_synthetic_dataset
    from app.services.import_service import import_samples_from_records

    db = TestingSessionLocal()
    try:
        records = generate_synthetic_dataset(n=100, seed=42)
        import_samples_from_records(records, db, batch_id="TEST")
    finally:
        db.close()

    yield

    # Cleanup
    import os
    test_engine.dispose()
    if os.path.exists("./test_water_quality.db"):
        try:
            os.remove("./test_water_quality.db")
        except PermissionError:
            pass


client = TestClient(app)


# ── Health endpoint ────────────────────────────────────────────────────────────

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "database_samples" in data


# ── Samples endpoint ───────────────────────────────────────────────────────────

def test_list_samples():
    response = client.get("/api/samples")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "items" in data
    assert "page" in data


def test_list_samples_pagination():
    response = client.get("/api/samples?page=1&page_size=5")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) <= 5


def test_list_samples_filter_do_not_boil():
    response = client.get("/api/samples?do_not_boil=true")
    assert response.status_code == 200
    data = response.json()
    for item in data["items"]:
        assert item["do_not_boil"] is True


def test_get_sample_not_found():
    response = client.get("/api/samples/999999")
    assert response.status_code == 404


def test_get_sample_verdict():
    # First get any sample
    list_response = client.get("/api/samples?page_size=1")
    items = list_response.json()["items"]
    if items:
        sample_id = items[0]["id"]
        response = client.get(f"/api/samples/{sample_id}/verdict")
        assert response.status_code == 200
        data = response.json()
        assert "category" in data
        assert "do_not_boil" in data
        assert "action_code" in data


# ── Dashboard endpoint ─────────────────────────────────────────────────────────

def test_dashboard_summary():
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_samples" in data
    assert "do_not_boil_alerts" in data
    assert data["total_samples"] >= 0


# ── Evaluate endpoint ──────────────────────────────────────────────────────────

def test_evaluate_safe_sample():
    payload = {
        "state_ut": "Kerala",
        "district": "Palakkad",
        "ph": 7.2,
        "turbidity_ntu": 0.5,
        "tds_mg_l": 280,
        "fluoride_mg_l": 0.6,
        "arsenic_mg_l": 0.003,
        "nitrate_mg_l": 18,
        "e_coli_mpn": 0,
        "total_coliform_mpn": 0,
    }
    response = client.post("/api/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "POTABLE_SAFE"
    assert data["do_not_boil"] is False


def test_evaluate_chemical_sample_do_not_boil():
    """CRITICAL: Chemical sample MUST produce do_not_boil=True."""
    payload = {
        "state_ut": "Rajasthan",
        "district": "Barmer",
        "fluoride_mg_l": 2.45,
        "ph": 7.2,
        "e_coli_mpn": 0,
        "total_coliform_mpn": 0,
    }
    response = client.post("/api/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["do_not_boil"] is True, "Chemical sample must return do_not_boil=True"
    assert data["category"] == "CRITICAL_CHEMICAL_TOXIN"


def test_evaluate_biological_sample_can_boil():
    """Biological-only sample: do_not_boil=False (boiling is appropriate)."""
    payload = {
        "state_ut": "Bihar",
        "district": "Patna",
        "e_coli_mpn": 500,
        "total_coliform_mpn": 1200,
        "fluoride_mg_l": 0.5,
        "arsenic_mg_l": 0.003,
        "nitrate_mg_l": 20,
    }
    response = client.post("/api/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["do_not_boil"] is False, "Biological-only sample: boiling IS appropriate"
    assert data["category"] == "UNSAFE_BIOLOGICAL_PATHOGEN"


def test_evaluate_mixed_sample_chemical_priority():
    """Mixed: do_not_boil=True (chemical priority overrides biological)."""
    payload = {
        "state_ut": "West Bengal",
        "district": "Murshidabad",
        "arsenic_mg_l": 0.08,
        "e_coli_mpn": 450,
        "total_coliform_mpn": 1800,
        "fluoride_mg_l": 0.3,
        "nitrate_mg_l": 25,
    }
    response = client.post("/api/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["do_not_boil"] is True
    assert data["category"] == "CRITICAL_MIXED_HAZARD"


# ── Demo scenarios ────────────────────────────────────────────────────────────

@pytest.mark.parametrize("scenario", ["safe", "biological", "chemical", "mixed", "physical"])
def test_demo_scenario(scenario):
    response = client.get(f"/api/demo/scenario/{scenario}")
    assert response.status_code == 200
    data = response.json()
    assert "verdict" in data
    assert "do_not_boil" in data["verdict"]

    # Chemical scenario MUST have do_not_boil=True
    if scenario == "chemical":
        assert data["verdict"]["do_not_boil"] is True
    # Biological scenario MUST have do_not_boil=False
    if scenario == "biological":
        assert data["verdict"]["do_not_boil"] is False


# ── Standards endpoint ────────────────────────────────────────────────────────

def test_standards_endpoint():
    response = client.get("/api/standards")
    assert response.status_code == 200
    data = response.json()
    assert "parameters" in data
    assert "fluoride_mg_l" in data["parameters"]
    assert "arsenic_mg_l" in data["parameters"]
    assert data["parameters"]["fluoride_mg_l"]["is_chemical_hazard"] is True


# ── AI status endpoint ────────────────────────────────────────────────────────

def test_ai_status():
    response = client.get("/api/ai/status")
    assert response.status_code == 200
    data = response.json()
    assert "gemini_configured" in data
    assert data["fallback_available"] is True
