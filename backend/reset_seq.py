from app.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    db.execute(text("SELECT setval(pg_get_serial_sequence('water_samples', 'id'), coalesce(max(id),0) + 1, false) FROM water_samples;"))
    db.commit()
    print('Sequence reset successfully.')
except Exception as e:
    print(f'Error: {e}')
finally:
    db.close()
