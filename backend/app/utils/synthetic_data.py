"""
JalRakshak — Synthetic Demo Data Generator
==========================================
Generates realistic water quality demo data when the actual CSV is unavailable.
This allows the application to run for demonstrations without the dataset.

IMPORTANT: Synthetic data is clearly labeled as such and never presented as real data.
The distribution approximately matches the expected benchmark:
  37.4% POTABLE_SAFE
  21.8% UNSAFE_BIOLOGICAL_PATHOGEN
  19.4% CRITICAL_CHEMICAL_TOXIN
  16.6% MODERATE_PHYSICAL_PARAM
   4.8% CRITICAL_MIXED_HAZARD
"""
from __future__ import annotations

import hashlib
import random
from typing import Optional

# Indian states and representative districts
INDIA_LOCATIONS = [
    ("Rajasthan", "Barmer", 25.75, 71.39),
    ("Rajasthan", "Jodhpur", 26.29, 73.02),
    ("Rajasthan", "Bikaner", 28.02, 73.31),
    ("Rajasthan", "Jaipur", 26.91, 75.79),
    ("Gujarat", "Kutch", 23.73, 69.86),
    ("Gujarat", "Surendranagar", 22.73, 71.63),
    ("Gujarat", "Patan", 23.85, 72.13),
    ("West Bengal", "Murshidabad", 24.18, 88.27),
    ("West Bengal", "Malda", 25.01, 88.14),
    ("West Bengal", "North 24 Parganas", 22.85, 88.53),
    ("Bihar", "Bhojpur", 25.56, 84.44),
    ("Bihar", "Vaishali", 25.67, 85.07),
    ("Bihar", "Patna", 25.59, 85.14),
    ("Uttar Pradesh", "Unnao", 26.55, 80.49),
    ("Uttar Pradesh", "Ballia", 25.75, 84.15),
    ("Uttar Pradesh", "Ghazipur", 25.58, 83.57),
    ("Punjab", "Bathinda", 30.21, 74.95),
    ("Punjab", "Muktsar", 30.47, 74.52),
    ("Haryana", "Rewari", 28.20, 76.62),
    ("Haryana", "Jhajjar", 28.61, 76.65),
    ("Andhra Pradesh", "Prakasam", 15.34, 79.64),
    ("Andhra Pradesh", "Nellore", 14.44, 79.99),
    ("Telangana", "Nalgonda", 17.04, 79.27),
    ("Telangana", "Medak", 18.05, 78.27),
    ("Assam", "Dhubri", 26.02, 89.97),
    ("Assam", "Barpeta", 26.33, 91.00),
    ("Karnataka", "Kolar", 13.14, 78.13),
    ("Karnataka", "Tumkur", 13.34, 77.10),
    ("Madhya Pradesh", "Shivpuri", 25.42, 77.66),
    ("Madhya Pradesh", "Gwalior", 26.22, 78.18),
    ("Chhattisgarh", "Raipur", 21.25, 81.63),
    ("Jharkhand", "Ranchi", 23.34, 85.31),
    ("Odisha", "Sambalpur", 21.47, 83.97),
    ("Maharashtra", "Amravati", 20.93, 77.75),
    ("Tamil Nadu", "Villupuram", 11.94, 79.49),
    ("Kerala", "Palakkad", 10.77, 76.66),
]

WATER_SOURCES = ["Groundwater", "Piped Tap", "Surface Water", "Borewell", "Handpump"]
SEASONS = ["Pre-monsoon", "Post-monsoon"]
VILLAGES = [
    "Rampur", "Shivnagar", "Laxmipur", "Krishnapur", "Saraswatipur",
    "Bholanath Tola", "Devpur", "Surajpur", "Chandanpur", "Gangapur",
    "Sitapur", "Harijanwada", "Bastipur", "Motipur", "Ratnapur",
]


def _jitter(lat: float, lon: float, spread: float = 0.5) -> tuple[float, float]:
    return (
        round(lat + random.uniform(-spread, spread), 4),
        round(lon + random.uniform(-spread, spread), 4),
    )


def _sample_id(i: int) -> str:
    h = hashlib.md5(str(i).encode()).hexdigest()[:6].upper()
    return f"SYN-{i:05d}-{h}"


def generate_safe_sample(i: int, loc: tuple) -> dict:
    state, district, base_lat, base_lon = loc
    lat, lon = _jitter(base_lat, base_lon)
    return {
        "sample_id": _sample_id(i),
        "state_ut": state,
        "district": district,
        "village": random.choice(VILLAGES),
        "water_source_type": random.choice(WATER_SOURCES),
        "season_cycle": random.choice(SEASONS),
        "latitude": lat,
        "longitude": lon,
        "ph": round(random.uniform(6.6, 8.4), 2),
        "turbidity_ntu": round(random.uniform(0.1, 0.9), 2),
        "tds_mg_l": round(random.uniform(100, 480), 1),
        "fluoride_mg_l": round(random.uniform(0.1, 0.9), 3),
        "arsenic_mg_l": round(random.uniform(0.001, 0.009), 4),
        "nitrate_mg_l": round(random.uniform(5, 40), 2),
        "e_coli_mpn": 0.0,
        "total_coliform_mpn": 0.0,
    }


def generate_biological_sample(i: int, loc: tuple) -> dict:
    s = generate_safe_sample(i, loc)
    s["e_coli_mpn"] = round(random.uniform(2, 1800), 1)
    s["total_coliform_mpn"] = round(random.uniform(10, 5000), 1)
    return s


def generate_chemical_sample(i: int, loc: tuple) -> dict:
    """Chemical contamination — triggers DO NOT BOIL."""
    s = generate_safe_sample(i, loc)
    s["e_coli_mpn"] = 0.0
    s["total_coliform_mpn"] = 0.0
    choice = random.choice(["fluoride", "arsenic", "nitrate"])
    if choice == "fluoride":
        s["fluoride_mg_l"] = round(random.uniform(1.6, 6.0), 3)
    elif choice == "arsenic":
        s["arsenic_mg_l"] = round(random.uniform(0.06, 0.25), 4)
    else:
        s["nitrate_mg_l"] = round(random.uniform(46, 180), 2)
    return s


def generate_physical_sample(i: int, loc: tuple) -> dict:
    s = generate_safe_sample(i, loc)
    choice = random.choice(["turbidity", "tds", "ph"])
    if choice == "turbidity":
        s["turbidity_ntu"] = round(random.uniform(2, 25), 2)
    elif choice == "tds":
        s["tds_mg_l"] = round(random.uniform(510, 2500), 1)
    else:
        s["ph"] = random.choice([
            round(random.uniform(4.5, 6.4), 2),
            round(random.uniform(8.6, 10.5), 2),
        ])
    return s


def generate_mixed_sample(i: int, loc: tuple) -> dict:
    """Mixed chemical + biological — chemical priority, DO NOT BOIL."""
    s = generate_chemical_sample(i, loc)
    s["e_coli_mpn"] = round(random.uniform(5, 500), 1)
    s["total_coliform_mpn"] = round(random.uniform(20, 2000), 1)
    return s


def generate_synthetic_dataset(n: int = 5000, seed: int = 42) -> list[dict]:
    """
    Generate n synthetic water quality samples approximating benchmark distribution.
    Target distribution:
      37.4% safe
      21.8% biological
      19.4% chemical
      16.6% physical
       4.8% mixed
    """
    random.seed(seed)

    # Proportions → counts
    counts = {
        "safe": int(n * 0.374),
        "bio": int(n * 0.218),
        "chem": int(n * 0.194),
        "phys": int(n * 0.166),
        "mixed": n - int(n * 0.374) - int(n * 0.218) - int(n * 0.194) - int(n * 0.166),
    }

    samples = []
    idx = 1

    generators = [
        ("safe", generate_safe_sample, counts["safe"]),
        ("bio", generate_biological_sample, counts["bio"]),
        ("chem", generate_chemical_sample, counts["chem"]),
        ("phys", generate_physical_sample, counts["phys"]),
        ("mixed", generate_mixed_sample, counts["mixed"]),
    ]

    for _, gen_fn, count in generators:
        for _ in range(count):
            loc = random.choice(INDIA_LOCATIONS)
            samples.append(gen_fn(idx, loc))
            idx += 1

    random.shuffle(samples)
    return samples
