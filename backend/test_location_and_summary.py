from app.database import SessionLocal
from app.analytics.aggregations import get_dashboard_summary
from app.models.user_profile import UserProfile

db = SessionLocal()

print("--- Testing National Summary ---")
nat = get_dashboard_summary(db)
print("National Total:", nat["total_samples"], "Safe%:", nat["safe_percentage"])
assert nat["total_samples"] == 55002

print("\n--- Testing Uttar Pradesh Summary ---")
up = get_dashboard_summary(db, state="Uttar Pradesh")
print("UP Total:", up["total_samples"], "Safe%:", up["safe_percentage"])
assert up["total_samples"] == 4470
print("UP Top chemical districts:", up["top_chemical_states"][:3])

print("\n--- Testing Varanasi District Summary ---")
var = get_dashboard_summary(db, state="Uttar Pradesh", district="Varanasi")
print("Varanasi Total:", var["total_samples"], "Safe%:", var["safe_percentage"])
assert var["total_samples"] == 76

print("\n--- Testing Poonam Profile in user_profiles ---")
poonam = db.query(UserProfile).filter(UserProfile.email.ilike("%poonam%")).first()
assert poonam is not None
print("Poonam Profile:", poonam.email, poonam.role, poonam.state_ut, poonam.district)
assert poonam.state_ut == "Uttar Pradesh"
assert poonam.district == "Varanasi"

print("\nALL BACKEND TESTS PASSED!")
