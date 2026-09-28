import os
import json
import logging
import urllib.request
import urllib.error

logger = logging.getLogger(__name__)

EMAIL_API_KEY = os.getenv("EMAIL_API_KEY")
EMAIL_FROM = os.getenv("EMAIL_FROM", "alerts@jalrakshak.org")
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "JalRakshak")

def send_alert_email(to_email: str, citizen_name: str, sample_info: dict) -> bool:
    """
    Sends an alert email to a citizen using a transactional email API (e.g. Resend).
    """
    subject = f"JalRakshak Water Quality Alert - {sample_info.get('district')}"
    
    # Construct plain text body as requested
    body = f"Hello {citizen_name},\n\n"
    body += "JalRakshak has detected a water-quality issue in your district.\n\n"
    body += f"District:\n{sample_info.get('district')}\n\n"
    body += f"State:\n{sample_info.get('state_ut')}\n\n"
    body += f"Status:\n{sample_info.get('severity')}\n\n"
    body += "The latest water testing indicates that one or more water-quality parameters require attention.\n\n"
    
    location = sample_info.get("village") or "your area"
    body += f"Affected location:\n{location}\n\n"
    body += "Please check the JalRakshak application for detailed information and follow the latest local water-safety advisory.\n\n"
    body += f"Sample ID:\n{sample_info.get('sample_id')}\n\n"
    body += f"Detected:\n{sample_info.get('sample_date')}\n\n"
    
    if sample_info.get('primary_contaminant'):
        body += f"Parameter: {sample_info.get('primary_contaminant')}\n"
        body += f"Detected: {sample_info.get('contaminant_value')} {sample_info.get('contaminant_unit')}\n"
        body += f"Recommended limit: {sample_info.get('contaminant_limit')} {sample_info.get('contaminant_unit')}\n\n"
        
    body += "Regards,\nJalRakshak\nWater Quality Monitoring System"

    # Simulate if no API key or test key
    if not EMAIL_API_KEY or EMAIL_API_KEY == "re_test_key":
        logger.info(f"[SIMULATED EMAIL] To: {to_email} | Subject: {subject}")
        logger.info(f"Body: \n{body}")
        return True

    # Example integration with Resend API
    req_data = {
        "from": f"{EMAIL_FROM_NAME} <{EMAIL_FROM}>",
        "to": [to_email],
        "subject": subject,
        "text": body
    }

    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=json.dumps(req_data).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {EMAIL_API_KEY}",
            "Content-Type": "application/json"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as response:
            if response.status in (200, 201):
                logger.info(f"Email sent successfully to {to_email}")
                return True
            else:
                logger.error(f"Email API returned status {response.status}")
                return False
    except urllib.error.URLError as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False
