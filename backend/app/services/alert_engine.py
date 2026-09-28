import logging
from datetime import datetime
import os
import psycopg2
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.water_sample import WaterSample
from app.services.email_service import send_alert_email
from app.database import SessionLocal

logger = logging.getLogger(__name__)

def process_alerts_for_sample(sample_id: int):
    """
    Background task to process district-based alerts when a new sample is created.
    """
    db = SessionLocal()
    try:
        sample = db.query(WaterSample).filter(WaterSample.id == sample_id).first()
        if not sample:
            logger.error(f"process_alerts_for_sample: Sample {sample_id} not found.")
            return

        if sample.severity not in ["CRITICAL", "HIGH"]:
            logger.info(f"Sample {sample_id} severity is {sample.severity}, no alert needed.")
            return

        state = sample.state_ut
        district = sample.district
        
        if not state or not district:
            logger.error(f"Sample {sample_id} missing state or district for alert routing.")
            return

        # Connect to Supabase postgres for citizens
        supabase_url = os.getenv("SUPABASE_DATABASE_URL")
        pg_conn = psycopg2.connect(supabase_url)
        pg_cursor = pg_conn.cursor()

        pg_cursor.execute("""
            SELECT c.id, c.full_name, c.email 
            FROM citizen_profiles c
            JOIN locations l ON c.state_id = l.state_id AND c.district_id = l.district_id
            WHERE l.state_name = %s AND l.district_name = %s AND c.email IS NOT NULL
        """, (state, district))
        citizens = pg_cursor.fetchall()
        
        if not citizens:
            logger.info(f"No citizens found in {district}, {state}. Skipping alerts.")
            return

        sample_info = {
            "district": sample.district,
            "state_ut": sample.state_ut,
            "village": sample.village,
            "severity": sample.severity,
            "sample_id": sample.sample_id,
            "sample_date": sample.sample_date,
            "primary_contaminant": sample.primary_contaminant,
        }
        
        if sample.primary_contaminant:
            try:
                col_map = {
                    "Fluoride": ("fluoride_mg_l", "mg/L", 1.5),
                    "Nitrate": ("nitrate_mg_l", "mg/L", 45.0),
                    "Arsenic": ("arsenic_mg_l", "mg/L", 0.01),
                    "Iron": ("iron_mg_l", "mg/L", 1.0),
                    "pH": ("ph", "pH", 8.5)
                }
                if sample.primary_contaminant in col_map:
                    col_name, unit, limit = col_map[sample.primary_contaminant]
                    sample_info["contaminant_value"] = getattr(sample, col_name)
                    sample_info["contaminant_unit"] = unit
                    sample_info["contaminant_limit"] = limit
                else:
                    sample_info["contaminant_value"] = "Detected"
                    sample_info["contaminant_unit"] = ""
                    sample_info["contaminant_limit"] = "Standard Limit"
            except Exception:
                pass

        for citizen in citizens:
            citizen_id = citizen[0]
            citizen_name = citizen[1]
            citizen_email = citizen[2]
            
            pg_cursor.execute("""
                SELECT id FROM notification_logs 
                WHERE alert_id = %s AND citizen_id = %s AND channel = 'EMAIL'
            """, (sample.id, citizen_id))
            existing_log = pg_cursor.fetchone()
            
            if existing_log:
                logger.info(f"Alert already sent to {citizen_email} for sample {sample.id}. Skipping.")
                continue
                
            success = send_alert_email(citizen_email, citizen_name, sample_info)
            
            status = "SENT" if success else "FAILED"
            pg_cursor.execute("""
                INSERT INTO notification_logs (alert_id, citizen_id, channel, recipient, status, sent_at)
                VALUES (%s, %s, 'EMAIL', %s, %s, %s)
            """, (sample.id, citizen_id, citizen_email, status, datetime.utcnow() if success else None))
            
        pg_conn.commit()
        pg_conn.close()
        logger.info(f"Finished processing alerts for sample {sample.id}")
    except Exception as e:
        logger.error(f"Error processing alerts for sample {sample_id}: {e}")
    finally:
        db.close()
