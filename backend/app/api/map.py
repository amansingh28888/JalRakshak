"""
JalRakshak — Map API

Returns geographic data for Leaflet markers.

Coordinate priority:
1. Real sample GPS coordinates, when available.
2. Known district centroid, approximate.
3. State/UT centroid with deterministic visual offset, approximate.
4. India fallback with deterministic visual offset, approximate.

IMPORTANT:
Fallback coordinates are administrative/visual approximations.
They must never be presented as exact sample GPS coordinates.
"""

from __future__ import annotations

import hashlib
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.water_sample import WaterSample


router = APIRouter(prefix="/api/map", tags=["map"])


# ─────────────────────────────────────────────────────────────────────────────
# Known district centroids
# ─────────────────────────────────────────────────────────────────────────────

DISTRICT_CENTROIDS: dict[str, tuple[float, float]] = {
    "jaipur": (26.9124, 75.7873),
    "jodhpur": (26.2389, 73.0243),
    "barmer": (25.7532, 71.3970),
    "kutch": (23.7337, 69.8597),
    "murshidabad": (24.0988, 88.2679),
    "patna": (25.5941, 85.1376),
    "lucknow": (26.8467, 80.9462),
    "nalgonda": (17.0575, 79.2684),
    "bathinda": (30.2110, 74.9455),
    "dhubri": (26.0207, 89.9743),
}


# ─────────────────────────────────────────────────────────────────────────────
# State / UT administrative centers
# ─────────────────────────────────────────────────────────────────────────────

STATE_CENTROIDS: dict[str, tuple[float, float]] = {
    "andaman and nicobar islands": (11.7401, 92.6586),
    "andhra pradesh": (15.9129, 79.7400),
    "arunachal pradesh": (28.2180, 94.7278),
    "assam": (26.2006, 92.9376),
    "bihar": (25.0961, 85.3131),
    "chandigarh": (30.7333, 76.7794),
    "chhattisgarh": (21.2787, 81.8661),
    "dadra and nagar haveli and daman and diu": (20.1809, 73.0169),
    "delhi": (28.6139, 77.2090),
    "goa": (15.2993, 74.1240),
    "gujarat": (22.2587, 71.1924),
    "haryana": (29.0588, 76.0856),
    "himachal pradesh": (31.1048, 77.1734),
    "jammu and kashmir": (33.7782, 76.5762),
    "jharkhand": (23.6102, 85.2799),
    "karnataka": (15.3173, 75.7139),
    "kerala": (10.8505, 76.2711),
    "ladakh": (34.1526, 77.5771),
    "lakshadweep": (10.5667, 72.6417),
    "madhya pradesh": (22.9734, 78.6569),
    "maharashtra": (19.7515, 75.7139),
    "manipur": (24.6637, 93.9063),
    "meghalaya": (25.4670, 91.3662),
    "mizoram": (23.1645, 92.9376),
    "nagaland": (26.1584, 94.5624),
    "odisha": (20.9517, 85.0985),
    "puducherry": (11.9416, 79.8083),
    "punjab": (31.1471, 75.3412),
    "rajasthan": (27.0238, 74.2179),
    "sikkim": (27.5330, 88.5122),
    "tamil nadu": (11.1271, 78.6569),
    "telangana": (18.1124, 79.0193),
    "tripura": (23.9408, 91.9882),
    "uttar pradesh": (26.8467, 80.9462),
    "uttarakhand": (30.0668, 79.0193),
    "west bengal": (22.9868, 87.8550),
}


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _normalize(value: Optional[str]) -> str:
    """Normalize state/district names for reliable lookup."""
    if not value:
        return ""

    value = value.strip().lower()

    replacements = {
        "&": "and",
        "_": " ",
        "-": " ",
        ",": " ",
    }

    for old, new in replacements.items():
        value = value.replace(old, new)

    return " ".join(value.split())


def _safe_coordinates(
    lat: float,
    lon: float,
) -> tuple[float, float]:
    """Keep coordinates within valid Earth ranges."""
    lat = max(-90.0, min(90.0, lat))
    lon = max(-180.0, min(180.0, lon))

    return round(lat, 6), round(lon, 6)


def _visual_offset(seed_text: str) -> tuple[float, float]:
    """
    Create a deterministic small visual offset.

    This prevents markers from stacking exactly on top of each other
    when several districts use the same state-level fallback.

    This is NOT a geographic estimate of the actual sample location.
    """

    digest = hashlib.sha256(
        seed_text.encode("utf-8")
    ).digest()

    a = int.from_bytes(digest[:4], "big") / 0xFFFFFFFF
    b = int.from_bytes(digest[4:8], "big") / 0xFFFFFFFF

    # Approximately ±0.5 degrees.
    lat_offset = (a - 0.5) * 1.0
    lon_offset = (b - 0.5) * 1.0

    return lat_offset, lon_offset


def _resolve_coordinates(
    sample: WaterSample,
) -> tuple[float, float, bool, str, str]:
    """
    Resolve coordinates for a sample.

    Returns:
        latitude,
        longitude,
        approximate,
        coordinate_source,
        location_precision
    """

    # ── 1. Actual sample GPS ──────────────────────────────────────────────────

    if (
        sample.latitude is not None
        and sample.longitude is not None
    ):
        lat, lon = _safe_coordinates(
            float(sample.latitude),
            float(sample.longitude),
        )

        return (
            lat,
            lon,
            False,
            "sample_gps",
            "gps",
        )

    state_key = _normalize(sample.state_ut)
    district_key = _normalize(sample.district)

    # ── 2. Known district centroid ───────────────────────────────────────────

    district_center = DISTRICT_CENTROIDS.get(district_key)

    if district_center:
        lat, lon = _safe_coordinates(
            district_center[0],
            district_center[1],
        )

        return (
            lat,
            lon,
            True,
            "district_centroid",
            "district",
        )

    # ── 3. State/UT center + visual offset ────────────────────────────────────

    state_center = STATE_CENTROIDS.get(state_key)

    if state_center:
        seed = f"{state_key}|{district_key}"

        lat_offset, lon_offset = _visual_offset(seed)

        lat = state_center[0] + lat_offset
        lon = state_center[1] + lon_offset

        lat, lon = _safe_coordinates(lat, lon)

        return (
            lat,
            lon,
            True,
            "state_centroid_visual_offset",
            "state",
        )

    # ── 4. India fallback ─────────────────────────────────────────────────────

    seed = f"india|{state_key}|{district_key}"

    lat_offset, lon_offset = _visual_offset(seed)

    lat = 20.5937 + (lat_offset * 0.5)
    lon = 78.9629 + (lon_offset * 0.5)

    lat, lon = _safe_coordinates(lat, lon)

    return (
        lat,
        lon,
        True,
        "india_fallback_visual_offset",
        "india",
    )


# ─────────────────────────────────────────────────────────────────────────────
# Map samples endpoint
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/samples")
def map_samples(
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    do_not_boil: Optional[bool] = Query(None),
    limit: int = Query(2000, ge=1, le=5000),
    db: Session = Depends(get_db),
):
    """
    Return map marker data for Leaflet.

    Coordinate priority:

        GPS
          ↓
        District centroid
          ↓
        State/UT center + visual offset
          ↓
        India fallback

    All non-GPS coordinates are explicitly marked approximate.
    """

    q = db.query(WaterSample)

    # ── Filters ───────────────────────────────────────────────────────────────

    if state:
        q = q.filter(
            WaterSample.state_ut.ilike(f"%{state}%")
        )

    if district:
        q = q.filter(
            WaterSample.district.ilike(f"%{district}%")
        )

    if category:
        q = q.filter(
            WaterSample.alert_category == category
        )

    if do_not_boil is not None:
        q = q.filter(
            WaterSample.do_not_boil == do_not_boil
        )

    # Count all matching records before applying map limit.
    total = q.count()

    # Stable ordering.
    samples = (
        q.order_by(WaterSample.id.asc())
        .limit(limit)
        .all()
    )

    markers = []

    for sample in samples:
        (
            lat,
            lon,
            approximate,
            coordinate_source,
            location_precision,
        ) = _resolve_coordinates(sample)

        markers.append(
            {
                "id": sample.id,
                "sample_id": sample.sample_id,

                "lat": lat,
                "lon": lon,

                "approximate": approximate,
                "coordinate_source": coordinate_source,
                "location_precision": location_precision,

                "state_ut": sample.state_ut,
                "district": sample.district,
                "village": sample.village,

                "category": sample.alert_category,
                "severity": sample.severity,
                "action_code": sample.action_code,

                "do_not_boil": sample.do_not_boil,
                "primary_contaminant": sample.primary_contaminant,

                "water_source_type": sample.water_source_type,
                "season_cycle": sample.season_cycle,

                # sample_date is stored as a string in the current model.
                # DO NOT call .isoformat() here.
                "sample_date": sample.sample_date,
            }
        )

    return {
        "markers": markers,
        "total": total,
        "returned": len(markers),
        "limit": limit,
        "has_more": total > len(markers),

        "coordinate_policy": {
            "gps": (
                "Exact sample GPS when available."
            ),
            "district": (
                "Approximate administrative district centroid."
            ),
            "state": (
                "Approximate state/UT center with "
                "deterministic visual offset."
            ),
            "india": (
                "Fallback India center with "
                "deterministic visual offset."
            ),
        },
    }