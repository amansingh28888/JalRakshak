"""
Evaluate API and Import API.
"""
import io
import logging
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Body
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.water_sample import WaterSample
from app.rules.water_quality_rules import evaluate_sample
from app.schemas.sample import SampleEvaluateRequest
from app.services.import_service import import_samples_from_records, ImportReport
from app.utils.column_mapper import build_reverse_map

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["evaluate", "import"])


@router.post("/evaluate")
def evaluate_sample_endpoint(request: SampleEvaluateRequest):
    """
    Run the deterministic rule engine on a submitted sample.
    Returns the full water quality verdict.
    This endpoint does NOT call Gemini — verdict only.
    """
    sample_dict = {
        "ph": request.ph,
        "turbidity_ntu": request.turbidity_ntu,
        "tds_mg_l": request.tds_mg_l,
        "fluoride_mg_l": request.fluoride_mg_l,
        "arsenic_mg_l": request.arsenic_mg_l,
        "nitrate_mg_l": request.nitrate_mg_l,
        "e_coli_mpn": request.e_coli_mpn,
        "total_coliform_mpn": request.total_coliform_mpn,
    }
    verdict = evaluate_sample(sample_dict)
    return {
        **verdict.to_dict(),
        "location": {
            "state_ut": request.state_ut,
            "district": request.district,
            "village": request.village,
        },
    }


@router.post("/import")
async def import_csv(
    file: UploadFile = File(...),
    replace_existing: bool = False,
    db: Session = Depends(get_db),
):
    """
    Upload a CSV file, validate, classify with rule engine, and import to DB.
    Never replaces existing data silently — requires explicit replace_existing=True.
    """
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    try:
        import pandas as pd

        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))

        if df.empty:
            raise HTTPException(status_code=400, detail="CSV file is empty.")

        # Map columns
        col_map = build_reverse_map(df.columns.tolist())
        df = df.rename(columns=col_map)

        # Convert to list of dicts
        records = df.where(df.notna(), None).to_dict(orient="records")

        # Import
        report = import_samples_from_records(
            records=records,
            db=db,
            replace_existing=replace_existing,
        )

        return {
            "success": True,
            "filename": file.filename,
            "report": report.to_dict(),
        }

    except Exception as e:
        logger.error(f"CSV import failed: {e}")
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")


@router.post("/import/synthetic")
def import_synthetic_data(
    n: int = 5000,
    replace_existing: bool = True,
    db: Session = Depends(get_db),
):
    """
    Load synthetic demo data into the database.
    Clearly labeled as synthetic — never presented as real.
    """
    from app.utils.synthetic_data import generate_synthetic_dataset

    records = generate_synthetic_dataset(n=n)
    report = import_samples_from_records(
        records=records,
        db=db,
        batch_id="SYNTHETIC",
        replace_existing=replace_existing,
    )
    return {
        "success": True,
        "synthetic": True,
        "warning": "This is synthetic demo data, not real water quality measurements.",
        "report": report.to_dict(),
    }
