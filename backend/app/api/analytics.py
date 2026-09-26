import io
import csv
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, case, desc, asc, and_
import pandas as pd
import numpy as np
from openpyxl import Workbook
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet

from app.database import get_db
from app.models.water_sample import WaterSample


router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/trends")
def get_trends(
    state_ut: Optional[str] = None,
    district: Optional[str] = None,
    block: Optional[str] = None,
    village: Optional[str] = None,
    parameter: str = "fluoride_mg_l",
    days: int = Query(365, ge=7, le=3650),
    db: Session = Depends(get_db)
):
    # Ensure parameter is a valid column
    if not hasattr(WaterSample, parameter):
        raise HTTPException(status_code=400, detail="Invalid parameter")
        
    param_col = getattr(WaterSample, parameter)

    q = db.query(WaterSample.sample_date, func.avg(param_col).label("avg_val"))
    
    if state_ut: q = q.filter(WaterSample.state_ut == state_ut)
    if district: q = q.filter(WaterSample.district == district)
    if village: q = q.filter(WaterSample.village == village)
    
    # Date filtering
    cutoff_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    q = q.filter(WaterSample.sample_date >= cutoff_date)
    q = q.filter(WaterSample.sample_date != None)
    q = q.filter(param_col != None)
    
    q = q.group_by(WaterSample.sample_date).order_by(WaterSample.sample_date.asc())
    
    results = q.all()
    if not results:
        return {"data": [], "summary": {"status": "Insufficient historical data for reliable trend analysis."}}
        
    df = pd.DataFrame(results, columns=["date", "value"])
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date")
    
    latest_val = df["value"].iloc[-1]
    avg_val = df["value"].mean()
    min_val = df["value"].min()
    max_val = df["value"].max()
    sample_count = len(df)
    
    # Calculate trend slope using linear regression if enough points
    trend = "Stable"
    pct_change = 0.0
    if sample_count > 1:
        x = np.arange(len(df))
        y = df["value"].values
        slope, _ = np.polyfit(x, y, 1)
        if slope > 0.01:
            trend = "Increasing"
        elif slope < -0.01:
            trend = "Decreasing"
            
        first_val = df["value"].iloc[0]
        if first_val != 0:
            pct_change = ((latest_val - first_val) / first_val) * 100
            
    summary = {
        "latest_value": round(latest_val, 3),
        "average": round(avg_val, 3),
        "minimum": round(min_val, 3),
        "maximum": round(max_val, 3),
        "sample_count": sample_count,
        "trend": trend,
        "percentage_change": round(pct_change, 1)
    }
    
    # Convert dates back to string for JSON serialization
    df["date"] = df["date"].dt.strftime("%Y-%m-%d")
    data_list = df.to_dict(orient="records")

    return {"data": data_list, "summary": summary}


@router.get("/forecast")
def get_forecast(
    state_ut: Optional[str] = None,
    district: Optional[str] = None,
    village: Optional[str] = None,
    parameter: str = "fluoride_mg_l",
    horizon: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db)
):
    if not hasattr(WaterSample, parameter):
        raise HTTPException(status_code=400, detail="Invalid parameter")
        
    param_col = getattr(WaterSample, parameter)

    q = db.query(WaterSample.sample_date, func.avg(param_col).label("avg_val"))
    if state_ut: q = q.filter(WaterSample.state_ut == state_ut)
    if district: q = q.filter(WaterSample.district == district)
    if village: q = q.filter(WaterSample.village == village)
    
    q = q.filter(WaterSample.sample_date != None)
    q = q.filter(param_col != None)
    q = q.group_by(WaterSample.sample_date).order_by(WaterSample.sample_date.asc())
    
    results = q.all()
    if len(results) < 5:
        return {"error": "Not enough historical observations to generate a reliable forecast."}
        
    df = pd.DataFrame(results, columns=["date", "value"])
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date")
    
    # Simple Linear Regression for forecast
    x = np.arange(len(df))
    y = df["value"].values
    slope, intercept = np.polyfit(x, y, 1)
    
    last_date = df["date"].iloc[-1]
    
    forecast_data = []
    # Generate points for horizon
    # To avoid too many points, we might just generate weekly or end points, but let's do endpoints
    
    # Determine step size depending on horizon to avoid hundreds of points
    step = max(1, horizon // 10)
    
    for i in range(1, horizon + 1, step):
        f_date = last_date + timedelta(days=i)
        f_val = slope * (len(df) + i - 1) + intercept
        forecast_data.append({"date": f_date.strftime("%Y-%m-%d"), "forecast_value": round(max(0, f_val), 3)})
        
    current_val = round(y[-1], 3)
    predicted_val = forecast_data[-1]["forecast_value"]
    
    trend = "Stable"
    if slope > 0.01: trend = "Increasing"
    elif slope < -0.01: trend = "Decreasing"

    # Convert historical
    df["date"] = df["date"].dt.strftime("%Y-%m-%d")
    hist_data = df.to_dict(orient="records")

    return {
        "historical": hist_data,
        "forecast": forecast_data,
        "summary": {
            "current_value": current_val,
            "forecast_value": predicted_val,
            "trend": trend,
            "horizon": horizon,
            "method": "Linear Regression",
            "historical_samples": len(df)
        }
    }


@router.get("/compare")
def get_compare(
    location1_state: str,
    location1_district: str,
    location2_state: str,
    location2_district: str,
    location3_state: Optional[str] = None,
    location3_district: Optional[str] = None,
    parameter: str = "fluoride_mg_l",
    db: Session = Depends(get_db)
):
    if not hasattr(WaterSample, parameter):
        raise HTTPException(status_code=400, detail="Invalid parameter")
        
    param_col = getattr(WaterSample, parameter)
    
    locations = [
        {"state": location1_state, "district": location1_district},
        {"state": location2_state, "district": location2_district},
    ]
    if location3_state and location3_district:
        locations.append({"state": location3_state, "district": location3_district})
        
    results = []
    for loc in locations:
        q = db.query(
            func.avg(param_col).label("avg"),
            func.max(param_col).label("max"),
            func.min(param_col).label("min"),
            func.count(WaterSample.id).label("count")
        ).filter(
            WaterSample.state_ut == loc["state"],
            WaterSample.district == loc["district"],
            param_col != None
        ).first()
        
        results.append({
            "state": loc["state"],
            "district": loc["district"],
            "avg": round(q.avg, 3) if q.avg else 0,
            "max": round(q.max, 3) if q.max else 0,
            "min": round(q.min, 3) if q.min else 0,
            "count": q.count or 0
        })
        
    return {"comparison": results}
