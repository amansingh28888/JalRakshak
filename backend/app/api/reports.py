import io
import csv
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet

from app.database import get_db
from app.models.water_sample import WaterSample

router = APIRouter(prefix="/api/reports", tags=["reports"])

def get_report_data(db, state_ut, district, block, village, start_date, end_date):
    q = db.query(WaterSample)
    if state_ut: q = q.filter(WaterSample.state_ut == state_ut)
    if district: q = q.filter(WaterSample.district == district)
    if village: q = q.filter(WaterSample.village == village)
    if start_date: q = q.filter(WaterSample.sample_date >= start_date)
    if end_date: q = q.filter(WaterSample.sample_date <= end_date)
    
    return q.all()

@router.get("/export/csv")
def export_csv(
    state_ut: Optional[str] = None,
    district: Optional[str] = None,
    block: Optional[str] = None,
    village: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    samples = get_report_data(db, state_ut, district, block, village, start_date, end_date)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "State", "District", "Village", "Source", "Date", "pH", "Turbidity (NTU)", "TDS (mg/L)", "Fluoride (mg/L)", "Arsenic (mg/L)", "Nitrate (mg/L)", "Iron (mg/L)", "E.coli (MPN)", "Category", "Severity"])
    
    for s in samples:
        writer.writerow([
            s.sample_id, s.state_ut, s.district, s.village, s.water_source_type, s.sample_date,
            s.ph, s.turbidity_ntu, s.tds_mg_l, s.fluoride_mg_l, s.arsenic_mg_l, s.nitrate_mg_l, s.iron_mg_l, s.e_coli_mpn,
            s.alert_category, s.severity
        ])
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=water_quality_report_{datetime.now().strftime('%Y%m%d')}.csv"}
    )

@router.get("/export/excel")
def export_excel(
    state_ut: Optional[str] = None,
    district: Optional[str] = None,
    block: Optional[str] = None,
    village: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    samples = get_report_data(db, state_ut, district, block, village, start_date, end_date)
    data = []
    for s in samples:
        data.append({
            "ID": s.sample_id,
            "State": s.state_ut,
            "District": s.district,
            "Village": s.village,
            "Source": s.water_source_type,
            "Date": s.sample_date,
            "pH": s.ph,
            "Turbidity (NTU)": s.turbidity_ntu,
            "TDS (mg/L)": s.tds_mg_l,
            "Fluoride (mg/L)": s.fluoride_mg_l,
            "Arsenic (mg/L)": s.arsenic_mg_l,
            "Nitrate (mg/L)": s.nitrate_mg_l,
            "Iron (mg/L)": s.iron_mg_l,
            "E.coli (MPN)": s.e_coli_mpn,
            "Category": s.alert_category,
            "Severity": s.severity
        })
        
    df = pd.DataFrame(data)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name="Water Samples")
        
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=water_quality_report_{datetime.now().strftime('%Y%m%d')}.xlsx"}
    )

@router.get("/export/pdf")
def export_pdf(
    state_ut: Optional[str] = None,
    district: Optional[str] = None,
    block: Optional[str] = None,
    village: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    samples = get_report_data(db, state_ut, district, block, village, start_date, end_date)
    
    output = io.BytesIO()
    doc = SimpleDocTemplate(output, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()
    
    elements.append(Paragraph("JALRAKSHAK - Water Quality Report", styles['Title']))
    elements.append(Spacer(1, 12))
    
    # Metadata
    elements.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
    elements.append(Paragraph(f"Location: {state_ut or 'All'} > {district or 'All'} > {village or 'All'}", styles['Normal']))
    elements.append(Paragraph(f"Date Range: {start_date or 'Any'} to {end_date or 'Any'}", styles['Normal']))
    elements.append(Spacer(1, 12))
    
    # KPIs
    total = len(samples)
    safe = sum(1 for s in samples if s.alert_category == 'POTABLE_SAFE')
    critical = sum(1 for s in samples if s.severity == 'CRITICAL')
    
    elements.append(Paragraph(f"<b>Executive Summary</b>", styles['Heading2']))
    elements.append(Paragraph(f"Total Samples: {total}", styles['Normal']))
    elements.append(Paragraph(f"Safe Samples: {safe}", styles['Normal']))
    elements.append(Paragraph(f"Critical Samples: {critical}", styles['Normal']))
    elements.append(Spacer(1, 12))
    
    # Data Table
    if total > 0:
        table_data = [["Date", "District", "pH", "Fluoride", "Arsenic", "Status"]]
        # Limit to 50 rows for PDF
        for s in samples[:50]:
            table_data.append([
                str(s.sample_date), 
                str(s.district), 
                str(round(s.ph, 2) if s.ph else "-"), 
                str(round(s.fluoride_mg_l, 2) if s.fluoride_mg_l else "-"), 
                str(round(s.arsenic_mg_l, 3) if s.arsenic_mg_l else "-"), 
                str(s.alert_category)
            ])
            
        t = Table(table_data)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#16324F")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 12),
            ('BACKGROUND', (0,1), (-1,-1), colors.beige),
            ('GRID', (0,0), (-1,-1), 1, colors.black)
        ]))
        elements.append(t)
        
        if total > 50:
            elements.append(Spacer(1, 12))
            elements.append(Paragraph(f"* Table truncated to first 50 results.", styles['Italic']))
            
    doc.build(elements)
    
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=water_quality_report_{datetime.now().strftime('%Y%m%d')}.pdf"}
    )
