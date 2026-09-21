import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.rules.standards import ActionCode
from app.rules.water_quality_rules import MessageType

client = TestClient(app)

def mock_gemini_success_english():
    mock_response = MagicMock()
    mock_response.text = '''
    {
      "warning_title": "✅ Safe to Drink",
      "warning": "According to the test, the water at this location is currently safe to drink.",
      "caution": "Continue to test your water regularly.",
      "solution": "You may consume this water. Store in clean containers.",
      "short_message": "Water is safe to drink ✅",
      "target_language": "English",
      "language_code": "en"
    }
    '''
    return mock_response

def mock_gemini_success_punjabi():
    mock_response = MagicMock()
    mock_response.text = '''
    {
      "warning_title": "✅ ਪਾਣੀ ਸੁਰੱਖਿਅਤ ਹੈ",
      "warning": "ਪਾਣੀ ਸੁਰੱਖਿਅਤ ਹੈ",
      "caution": "ਪਾਣੀ ਸੁਰੱਖਿਅਤ ਹੈ",
      "solution": "ਪਾਣੀ ਸੁਰੱਖਿਅਤ ਹੈ",
      "short_message": "ਪਾਣੀ ਸੁਰੱਖਿਅਤ ਹੈ ✅",
      "target_language": "Punjabi",
      "language_code": "pa"
    }
    '''
    return mock_response

def mock_gemini_unsafe_chemical():
    mock_response = MagicMock()
    mock_response.text = '''
    {
      "warning_title": "🚨 Chemical Contamination",
      "warning": "Fluoride = 2.5 mg/L.",
      "caution": "Do not rely on boiling.",
      "solution": "Use alternative source.",
      "short_message": "Unsafe",
      "target_language": "English",
      "language_code": "en"
    }
    '''
    return mock_response

def mock_gemini_invalid_json():
    mock_response = MagicMock()
    mock_response.text = "This is not JSON"
    return mock_response

def mock_gemini_unsafe_claiming_safe():
    mock_response = MagicMock()
    # Malicious/hallucinated response claiming it's safe when it's not
    mock_response.text = '''
    {
      "warning_title": "✅ Water is safe",
      "warning": "You can drink this water safely.",
      "caution": "None",
      "solution": "Drink it.",
      "short_message": "Safe",
      "target_language": "English",
      "language_code": "en"
    }
    '''
    return mock_response


class TestMultilingualAPI:

    @patch("app.ai.gemini_service.get_settings")
    @patch("google.genai.Client")
    def test_english_safe_advisory(self, mock_client, mock_settings):
        # Setup mocks
        mock_settings.return_value.gemini_available = True
        mock_settings.return_value.gemini_api_key = "fake_key"
        mock_instance = mock_client.return_value
        mock_instance.models.generate_content.return_value = mock_gemini_success_english()

        response = client.post(
            "/api/ai/advisory",
            json={
                "state": "Punjab",
                "district": "Amritsar",
                "parameter": "pH",
                "measured_value": 7.2,
                "unit": "",
                "rule_category": "Potable",
                "severity": "SAFE",
                "action_code": ActionCode.SAFE_TO_DRINK,
                "do_not_boil": False,
                "safe_to_drink": True,
                "message_type": MessageType.SAFE,
                "target_language": "English",
                "language_code": "en"
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["target_language"] == "English"
        assert data["language_code"] == "en"
        assert data["safe_to_drink"] is True
        assert data["source"] == "gemini"

    @patch("app.ai.gemini_service.get_settings")
    @patch("google.genai.Client")
    def test_punjabi_safe_advisory(self, mock_client, mock_settings):
        # Setup mocks
        mock_settings.return_value.gemini_available = True
        mock_settings.return_value.gemini_api_key = "fake_key"
        mock_instance = mock_client.return_value
        mock_instance.models.generate_content.return_value = mock_gemini_success_punjabi()

        response = client.post(
            "/api/ai/advisory",
            json={
                "state": "Punjab",
                "district": "Amritsar",
                "parameter": "pH",
                "measured_value": 7.2,
                "unit": "",
                "rule_category": "Potable",
                "severity": "SAFE",
                "action_code": ActionCode.SAFE_TO_DRINK,
                "do_not_boil": False,
                "safe_to_drink": True,
                "message_type": MessageType.SAFE,
                "target_language": "Punjabi",
                "language_code": "pa"
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["target_language"] == "Punjabi"
        assert data["language_code"] == "pa"
        assert "ਪਾਣੀ ਸੁਰੱਖਿਅਤ ਹੈ" in data["warning_title"]

    @patch("app.ai.gemini_service.get_settings")
    @patch("google.genai.Client")
    def test_chemical_invariant_preservation(self, mock_client, mock_settings):
        # Setup mocks
        mock_settings.return_value.gemini_available = True
        mock_settings.return_value.gemini_api_key = "fake_key"
        mock_instance = mock_client.return_value
        mock_instance.models.generate_content.return_value = mock_gemini_unsafe_chemical()

        response = client.post(
            "/api/ai/advisory",
            json={
                "state": "Punjab",
                "district": "Amritsar",
                "parameter": "Fluoride",
                "measured_value": 2.5,
                "unit": "mg/L",
                "rule_category": "Chemical",
                "severity": "CRITICAL",
                "action_code": ActionCode.DO_NOT_BOIL_ALTERNATIVE_SOURCE_ONLY,
                "do_not_boil": True,
                "safe_to_drink": False,
                "message_type": MessageType.CHEMICAL_CONTAMINATION,
                "target_language": "English",
                "language_code": "en"
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["do_not_boil"] is True
        assert data["safe_to_drink"] is False
        assert "Fluoride = 2.5 mg/L" in data["warning"] # Number/unit preservation

    @patch("app.ai.gemini_service.get_settings")
    @patch("google.genai.Client")
    def test_gemini_invalid_json_fallback(self, mock_client, mock_settings):
        mock_settings.return_value.gemini_available = True
        mock_settings.return_value.gemini_api_key = "fake_key"
        mock_instance = mock_client.return_value
        mock_instance.models.generate_content.return_value = mock_gemini_invalid_json()

        response = client.post(
            "/api/ai/advisory",
            json={
                "state": "Punjab",
                "district": "Amritsar",
                "parameter": "pH",
                "measured_value": 7.2,
                "unit": "",
                "rule_category": "Potable",
                "severity": "SAFE",
                "action_code": ActionCode.SAFE_TO_DRINK,
                "do_not_boil": False,
                "safe_to_drink": True,
                "message_type": MessageType.SAFE,
                "target_language": "Marathi",
                "language_code": "mr"
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["source"].startswith("fallback:")
        # Marathi safe title from fallbacks.py
        assert "पाणी सुरक्षित आहे" in data["short_message"]

    @patch("app.ai.gemini_service.get_settings")
    @patch("google.genai.Client")
    def test_gemini_unsafe_claiming_safe_fallback(self, mock_client, mock_settings):
        # AI hallucinated it was safe when it was NOT safe
        mock_settings.return_value.gemini_available = True
        mock_settings.return_value.gemini_api_key = "fake_key"
        mock_instance = mock_client.return_value
        mock_instance.models.generate_content.return_value = mock_gemini_unsafe_claiming_safe()

        response = client.post(
            "/api/ai/advisory",
            json={
                "state": "Punjab",
                "district": "Amritsar",
                "parameter": "Arsenic",
                "measured_value": 0.05,
                "unit": "mg/L",
                "rule_category": "Chemical",
                "severity": "CRITICAL",
                "action_code": ActionCode.DO_NOT_BOIL_ALTERNATIVE_SOURCE_ONLY,
                "do_not_boil": True,
                "safe_to_drink": False,  # INVARIANT says false
                "message_type": MessageType.CHEMICAL_CONTAMINATION,
                "target_language": "English",
                "language_code": "en"
            },
        )
        assert response.status_code == 200
        data = response.json()
        # Should reject Gemini and use fallback
        assert data["source"] == "fallback:safety_validation_failed"
        assert data["safe_to_drink"] is False
        assert "Chemical Contamination" in data["warning_title"]

    @patch("app.ai.gemini_service.settings")
    def test_gemini_no_api_key_fallback(self, mock_settings):
        mock_settings.gemini_available = False
        
        response = client.post(
            "/api/ai/advisory",
            json={
                "state": "Punjab",
                "district": "Amritsar",
                "parameter": "Arsenic",
                "measured_value": 0.05,
                "unit": "mg/L",
                "rule_category": "Chemical",
                "severity": "CRITICAL",
                "action_code": ActionCode.DO_NOT_BOIL_ALTERNATIVE_SOURCE_ONLY,
                "do_not_boil": True,
                "safe_to_drink": False,
                "message_type": MessageType.CHEMICAL_CONTAMINATION,
                "target_language": "Telugu",
                "language_code": "te"
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["source"] == "fallback:no_api_key"
        assert data["language_code"] == "te"
        assert "రసాయన కాలుష్యం" in data["warning_title"] # Telugu title
