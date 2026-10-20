"""
JalRakshak — Email Notification Service (Resend)
=================================================
Sends water-quality alert emails to citizens and admins.

Design rules:
  1. Resend is the ONLY transactional email provider.
  2. If RESEND_API_KEY is absent / test-key, emails are *simulated* — logged,
     stored as PENDING, and a config-warning is returned to the caller.
  3. HTML template with plain-text fallback; multilingual body (14 languages).
  4. API key MUST NOT appear in any frontend bundle or log output.
  5. All exceptions are caught and reported to the caller — never propagated.
"""

import html
import json
import logging
import urllib.error
import urllib.request
from datetime import datetime
from typing import Optional

from app.config import get_settings

logger = logging.getLogger(__name__)

# ── Language translations ─────────────────────────────────────────────────────
# Key: ISO 639-1 code
# Value: dict of translation keys → translated strings
#
# These are embedded so the service works without an external translation API.
# Gemini is intentionally NOT used here — safety content must not be
# auto-translated by an AI without human review.
TRANSLATIONS: dict[str, dict[str, str]] = {
    "en": {
        "lang_name": "English",
        "greeting": "Dear {name},",
        "intro": "JalRakshak has detected a water-quality issue in your area.",
        "action_label": "What you should do",
        "location_label": "Affected Location",
        "severity_label": "Severity",
        "contaminant_label": "Contaminant Detected",
        "limit_label": "Safe Limit (IS 10500)",
        "sample_id_label": "Sample ID",
        "date_label": "Test Date",
        "portal_label": "View on JalRakshak Portal",
        "footer": "This is an automated safety alert from JalRakshak — AI-Based Water Quality Monitoring System. Do not reply to this email.",
        "do_not_boil_warning": "⚠️ DO NOT BOIL THIS WATER — boiling concentrates chemical contaminants and is DANGEROUS.",
        "boil_advisory": "✅ Boil water before drinking until further notice.",
        "subject": "🚨 Water Quality Alert — {district}, {state}",
    },
    "hi": {
        "lang_name": "हिंदी",
        "greeting": "प्रिय {name},",
        "intro": "जलरक्षक ने आपके क्षेत्र में जल गुणवत्ता की समस्या का पता लगाया है।",
        "action_label": "आपको क्या करना चाहिए",
        "location_label": "प्रभावित स्थान",
        "severity_label": "गंभीरता",
        "contaminant_label": "पाया गया प्रदूषक",
        "limit_label": "सुरक्षित सीमा (IS 10500)",
        "sample_id_label": "नमूना आईडी",
        "date_label": "परीक्षण तिथि",
        "portal_label": "जलरक्षक पोर्टल पर देखें",
        "footer": "यह जलरक्षक — AI-आधारित जल गुणवत्ता निगरानी प्रणाली से एक स्वचालित सुरक्षा अलर्ट है।",
        "do_not_boil_warning": "⚠️ इस पानी को उबालें नहीं — उबालने से रासायनिक प्रदूषक और सघन हो जाते हैं, जो खतरनाक है।",
        "boil_advisory": "✅ अगली सूचना तक पीने से पहले पानी उबालें।",
        "subject": "🚨 जल गुणवत्ता चेतावनी — {district}, {state}",
    },
    "pa": {
        "lang_name": "ਪੰਜਾਬੀ",
        "greeting": "ਪਿਆਰੇ {name},",
        "intro": "ਜਲਰੱਖਕ ਨੇ ਤੁਹਾਡੇ ਖੇਤਰ ਵਿੱਚ ਪਾਣੀ ਦੀ ਗੁਣਵੱਤਾ ਦੀ ਸਮੱਸਿਆ ਦਾ ਪਤਾ ਲਗਾਇਆ ਹੈ।",
        "action_label": "ਤੁਹਾਨੂੰ ਕੀ ਕਰਨਾ ਚਾਹੀਦਾ ਹੈ",
        "location_label": "ਪ੍ਰਭਾਵਿਤ ਸਥਾਨ",
        "severity_label": "ਗੰਭੀਰਤਾ",
        "contaminant_label": "ਖੋਜਿਆ ਗਿਆ ਪ੍ਰਦੂਸ਼ਕ",
        "limit_label": "ਸੁਰੱਖਿਅਤ ਸੀਮਾ (IS 10500)",
        "sample_id_label": "ਨਮੂਨਾ ਆਈਡੀ",
        "date_label": "ਟੈਸਟ ਮਿਤੀ",
        "portal_label": "ਜਲਰੱਖਕ ਪੋਰਟਲ 'ਤੇ ਦੇਖੋ",
        "footer": "ਇਹ ਜਲਰੱਖਕ ਤੋਂ ਇੱਕ ਆਟੋਮੈਟਿਕ ਸੁਰੱਖਿਆ ਚੇਤਾਵਨੀ ਹੈ।",
        "do_not_boil_warning": "⚠️ ਇਸ ਪਾਣੀ ਨੂੰ ਉਬਾਲੋ ਨਾ — ਉਬਾਲਣ ਨਾਲ ਰਸਾਇਣਕ ਪ੍ਰਦੂਸ਼ਕ ਵਧ ਜਾਂਦੇ ਹਨ।",
        "boil_advisory": "✅ ਅਗਲੀ ਸੂਚਨਾ ਤੱਕ ਪਾਣੀ ਪੀਣ ਤੋਂ ਪਹਿਲਾਂ ਉਬਾਲੋ।",
        "subject": "🚨 ਪਾਣੀ ਦੀ ਗੁਣਵੱਤਾ ਚੇਤਾਵਨੀ — {district}, {state}",
    },
    "bn": {
        "lang_name": "বাংলা",
        "greeting": "প্রিয় {name},",
        "intro": "জলরক্ষক আপনার এলাকায় জলের মানের সমস্যা সনাক্ত করেছে।",
        "action_label": "আপনার কী করা উচিত",
        "location_label": "প্রভাবিত এলাকা",
        "severity_label": "তীব্রতা",
        "contaminant_label": "সনাক্তকৃত দূষক",
        "limit_label": "নিরাপদ সীমা (IS 10500)",
        "sample_id_label": "নমুনা আইডি",
        "date_label": "পরীক্ষার তারিখ",
        "portal_label": "জলরক্ষক পোর্টালে দেখুন",
        "footer": "এটি জলরক্ষক — AI ভিত্তিক জল গুণমান পর্যবেক্ষণ সিস্টেম থেকে একটি স্বয়ংক্রিয় নিরাপত্তা সতর্কতা।",
        "do_not_boil_warning": "⚠️ এই জল ফোটাবেন না — ফোটালে রাসায়নিক দূষক বৃদ্ধি পায়।",
        "boil_advisory": "✅ পরবর্তী নির্দেশ না দেওয়া পর্যন্ত পান করার আগে জল ফোটান।",
        "subject": "🚨 জলের মান সতর্কতা — {district}, {state}",
    },
    "mr": {
        "lang_name": "मराठी",
        "greeting": "प्रिय {name},",
        "intro": "जलरक्षकाने तुमच्या भागात पाण्याच्या गुणवत्तेची समस्या आढळली आहे.",
        "action_label": "तुम्ही काय करावे",
        "location_label": "प्रभावित ठिकाण",
        "severity_label": "तीव्रता",
        "contaminant_label": "आढळलेले प्रदूषक",
        "limit_label": "सुरक्षित मर्यादा (IS 10500)",
        "sample_id_label": "नमुना आयडी",
        "date_label": "चाचणी तारीख",
        "portal_label": "जलरक्षक पोर्टलवर पाहा",
        "footer": "हे जलरक्षक कडून स्वयंचलित सुरक्षा सतर्कता आहे.",
        "do_not_boil_warning": "⚠️ हे पाणी उकळू नका — उकळल्याने रासायनिक प्रदूषक वाढतात.",
        "boil_advisory": "✅ पुढील सूचनेपर्यंत पिण्यापूर्वी पाणी उकळा.",
        "subject": "🚨 पाणी गुणवत्ता सतर्कता — {district}, {state}",
    },
    "gu": {
        "lang_name": "ગુજરાતી",
        "greeting": "પ્રિય {name},",
        "intro": "જળરક્ષકે તમારા વિસ્તારમાં પાણીની ગુણવત્તાની સમસ્યા શોધી છે.",
        "action_label": "તમારે શું કરવું જોઈએ",
        "location_label": "પ્રભાવિત સ્થળ",
        "severity_label": "ગંભીરતા",
        "contaminant_label": "શોધાયેલ પ્રદૂષક",
        "limit_label": "સુરક્ષિત મર્યાદા (IS 10500)",
        "sample_id_label": "નમૂનો ID",
        "date_label": "પરીક્ષણ તારીખ",
        "portal_label": "જળરક્ષક પોર્ટલ પર જુઓ",
        "footer": "આ જળરક્ષક - AI-આધારિત જળ ગુણવત્તા નિરીક્ષણ સિસ્ટમ તરફથી સ્વચાલિત સુરક્ષા ચેતવણી છે.",
        "do_not_boil_warning": "⚠️ આ પાણી ઉકાળો નહીં — ઉકાળવાથી રાસાયણિક પ્રદૂષકો વધે છે.",
        "boil_advisory": "✅ આગળની સૂચના સુધી પીતા પહેલા પાણી ઉકાળો.",
        "subject": "🚨 પાણી ગુણવત્તા ચેતવણી — {district}, {state}",
    },
    "ta": {
        "lang_name": "தமிழ்",
        "greeting": "அன்புள்ள {name},",
        "intro": "ஜல்ரக்ஷக் உங்கள் பகுதியில் நீர் தர சிக்கலைக் கண்டறிந்துள்ளது.",
        "action_label": "நீங்கள் என்ன செய்ய வேண்டும்",
        "location_label": "பாதிக்கப்பட்ட இடம்",
        "severity_label": "தீவிரம்",
        "contaminant_label": "கண்டறியப்பட்ட மாசுபடுத்தி",
        "limit_label": "பாதுகாப்பான வரம்பு (IS 10500)",
        "sample_id_label": "மாதிரி ID",
        "date_label": "சோதனை தேதி",
        "portal_label": "ஜல்ரக்ஷக் போர்டலில் பாருங்கள்",
        "footer": "இது ஜல்ரக்ஷக் — AI அடிப்படையிலான நீர் தர கண்காணிப்பு அமைப்பிலிருந்து தானியங்கி பாதுகாப்பு எச்சரிக்கை.",
        "do_not_boil_warning": "⚠️ இந்த தண்ணீரை கொதிக்க வைக்காதீர்கள் — கொதிக்க வைப்பதால் ரசாயன மாசுகள் அதிகரிக்கும்.",
        "boil_advisory": "✅ அடுத்த அறிவிப்பு வரை குடிக்கும் முன் தண்ணீரை கொதிக்க வையுங்கள்.",
        "subject": "🚨 நீர் தர எச்சரிக்கை — {district}, {state}",
    },
    "te": {
        "lang_name": "తెలుగు",
        "greeting": "ప్రియమైన {name},",
        "intro": "జల్‌రక్షక్ మీ ప్రాంతంలో నీటి నాణ్యత సమస్యను గుర్తించింది.",
        "action_label": "మీరు ఏమి చేయాలి",
        "location_label": "ప్రభావిత ప్రాంతం",
        "severity_label": "తీవ్రత",
        "contaminant_label": "గుర్తించబడిన కాలుష్యం",
        "limit_label": "సురక్షిత పరిమితి (IS 10500)",
        "sample_id_label": "నమూనా ID",
        "date_label": "పరీక్ష తేదీ",
        "portal_label": "జల్‌రక్షక్ పోర్టల్‌లో చూడండి",
        "footer": "ఇది జల్‌రక్షక్ — AI ఆధారిత నీటి నాణ్యత పర్యవేక్షణ వ్యవస్థ నుండి స్వయంచాలక భద్రతా హెచ్చరిక.",
        "do_not_boil_warning": "⚠️ ఈ నీటిని మరిగించవద్దు — మరిగించడం వల్ల రసాయన కాలుష్యాలు పెరుగుతాయి.",
        "boil_advisory": "✅ తదుపరి నోటీసు వరకు తాగే ముందు నీటిని మరిగించండి.",
        "subject": "🚨 నీటి నాణ్యత హెచ్చరిక — {district}, {state}",
    },
    "kn": {
        "lang_name": "ಕನ್ನಡ",
        "greeting": "ಪ್ರಿಯ {name},",
        "intro": "ಜಲರಕ್ಷಕ್ ನಿಮ್ಮ ಪ್ರದೇಶದಲ್ಲಿ ನೀರಿನ ಗುಣಮಟ್ಟದ ಸಮಸ್ಯೆಯನ್ನು ಪತ್ತೆ ಹಚ್ಚಿದೆ.",
        "action_label": "ನೀವು ಏನು ಮಾಡಬೇಕು",
        "location_label": "ಪ್ರಭಾವಿತ ಸ್ಥಳ",
        "severity_label": "ತೀವ್ರತೆ",
        "contaminant_label": "ಪತ್ತೆಯಾದ ಮಾಲಿನ್ಯಕಾರಕ",
        "limit_label": "ಸುರಕ್ಷಿತ ಮಿತಿ (IS 10500)",
        "sample_id_label": "ಮಾದರಿ ID",
        "date_label": "ಪರೀಕ್ಷೆಯ ದಿನಾಂಕ",
        "portal_label": "ಜಲರಕ್ಷಕ್ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ವೀಕ್ಷಿಸಿ",
        "footer": "ಇದು ಜಲರಕ್ಷಕ್ — AI ಆಧಾರಿತ ನೀರಿನ ಗುಣಮಟ್ಟ ಮೇಲ್ವಿಚಾರಣಾ ವ್ಯವಸ್ಥೆಯಿಂದ ಸ್ವಯಂಚಾಲಿತ ಸುರಕ್ಷತಾ ಎಚ್ಚರಿಕೆ.",
        "do_not_boil_warning": "⚠️ ಈ ನೀರನ್ನು ಕುದಿಸಬೇಡಿ — ಕುದಿಸಿದರೆ ರಾಸಾಯನಿಕ ಮಾಲಿನ್ಯಕಾರಕಗಳು ಹೆಚ್ಚಾಗುತ್ತವೆ.",
        "boil_advisory": "✅ ಮುಂದಿನ ಸೂಚನೆ ವರೆಗೆ ಕುಡಿಯುವ ಮೊದಲು ನೀರನ್ನು ಕುದಿಸಿ.",
        "subject": "🚨 ನೀರಿನ ಗುಣಮಟ್ಟ ಎಚ್ಚರಿಕೆ — {district}, {state}",
    },
    "ml": {
        "lang_name": "മലയാളം",
        "greeting": "പ്രിയ {name},",
        "intro": "ജൽ‌രക്ഷക് നിങ്ങളുടെ പ്രദേശത്ത് ജലഗുണനിലവാര പ്രശ്‌നം കണ്ടെത്തി.",
        "action_label": "നിങ്ങൾ എന്ത് ചെയ്യണം",
        "location_label": "ബാധിത സ്ഥലം",
        "severity_label": "തീവ്രത",
        "contaminant_label": "കണ്ടെത്തിയ മലിനീകരണം",
        "limit_label": "സുരക്ഷിത പരിധി (IS 10500)",
        "sample_id_label": "സാമ്പിൾ ID",
        "date_label": "പരീക്ഷണ തീയതി",
        "portal_label": "ജൽ‌രക്ഷക് പോർട്ടലിൽ കാണുക",
        "footer": "ഇത് ജൽ‌രക്ഷക് — AI അടിസ്ഥാനമാക്കിയ ജലഗുണനിലവാര നിരീക്ഷണ സംവിധാനത്തിൽ നിന്നുള്ള ഓട്ടോമാറ്റിക് സുരക്ഷാ മുന്നറിയിപ്പ്.",
        "do_not_boil_warning": "⚠️ ഈ വെള്ളം തിളപ്പിക്കരുത് — തിളപ്പിക്കുന്നത് രാസ മലിനീകരണം വർദ്ധിപ്പിക്കുന്നു.",
        "boil_advisory": "✅ അടുത്ത അറിയിപ്പ് വരെ കുടിക്കുന്നതിന് മുമ്പ് വെള്ളം തിളപ്പിക്കുക.",
        "subject": "🚨 ജലഗുണ മുന്നറിയിപ്പ് — {district}, {state}",
    },
    "or": {
        "lang_name": "ଓଡ଼ିଆ",
        "greeting": "ପ୍ରିୟ {name},",
        "intro": "ଜଳରକ୍ଷକ ଆପଣଙ୍କ ଅଞ୍ଚଳରେ ଜଳ ଗୁଣବତ୍ତା ସମସ୍ୟା ଚିହ୍ନଟ କରିଛି।",
        "action_label": "ଆପଣ କ'ଣ କରିବା ଉଚିତ",
        "location_label": "ପ୍ରଭାବିତ ସ୍ଥାନ",
        "severity_label": "ଗୁରୁତ୍ୱ",
        "contaminant_label": "ଚିହ୍ନଟ ହୋଇଥିବା ଦୂଷଣ",
        "limit_label": "ସୁରକ୍ଷିତ ସୀମା (IS 10500)",
        "sample_id_label": "ନମୁନା ID",
        "date_label": "ପରୀକ୍ଷା ତାରିଖ",
        "portal_label": "ଜଳରକ୍ଷକ ପୋର୍ଟାଲରେ ଦେଖନ୍ତୁ",
        "footer": "ଏହା ଜଳରକ୍ଷକ ଦ୍ୱାରା ଏକ ସ୍ୱୟଂଚାଳିତ ସୁରକ୍ଷା ସତର୍କତା।",
        "do_not_boil_warning": "⚠️ ଏହି ଜଳ ଫୁଟାନ୍ତୁ ନାହିଁ — ଫୁଟାଇବା ଦ୍ୱାରା ରାସାୟନିକ ଦୂଷଣ ବୃଦ୍ଧି ପାଏ।",
        "boil_advisory": "✅ ଆଗ ନିର୍ଦ୍ଦେଶ ପର୍ଯ୍ୟନ୍ତ ପିଇବା ପୂର୍ବରୁ ଜଳ ଫୁଟାନ୍ତୁ।",
        "subject": "🚨 ଜଳ ଗୁଣ ସତର୍କତା — {district}, {state}",
    },
    "as": {
        "lang_name": "অসমীয়া",
        "greeting": "প্ৰিয় {name},",
        "intro": "জলৰক্ষকে আপোনাৰ অঞ্চলত পানীৰ মানৰ সমস্যা চিনাক্ত কৰিছে।",
        "action_label": "আপুনি কি কৰিব লাগে",
        "location_label": "প্ৰভাৱিত স্থান",
        "severity_label": "গুৰুতৰতা",
        "contaminant_label": "চিনাক্ত কৰা দূষক",
        "limit_label": "নিৰাপদ সীমা (IS 10500)",
        "sample_id_label": "নমুনা ID",
        "date_label": "পৰীক্ষাৰ তাৰিখ",
        "portal_label": "জলৰক্ষক পৰ্টেলত চাওক",
        "footer": "এইটো জলৰক্ষকৰ পৰা এটা স্বয়ংক্ৰিয় সুৰক্ষা সতৰ্কতা।",
        "do_not_boil_warning": "⚠️ এই পানী উতলাব নালাগে — উতলালে ৰাসায়নিক দূষক বৃদ্ধি পায়।",
        "boil_advisory": "✅ পৰবৰ্তী জাননী পৰ্যন্ত পানী খোৱাৰ আগতে উতলাওক।",
        "subject": "🚨 পানীৰ মান সতৰ্কতা — {district}, {state}",
    },
    "ur": {
        "lang_name": "اردو",
        "greeting": "عزیز {name}،",
        "intro": "جل رکشک نے آپ کے علاقے میں پانی کے معیار کا مسئلہ دریافت کیا ہے۔",
        "action_label": "آپ کو کیا کرنا چاہیے",
        "location_label": "متاثرہ مقام",
        "severity_label": "شدت",
        "contaminant_label": "دریافت شدہ آلودگی",
        "limit_label": "محفوظ حد (IS 10500)",
        "sample_id_label": "نمونہ ID",
        "date_label": "ٹیسٹ کی تاریخ",
        "portal_label": "جل رکشک پورٹل پر دیکھیں",
        "footer": "یہ جل رکشک کی طرف سے ایک خودکار حفاظتی انتباہ ہے۔",
        "do_not_boil_warning": "⚠️ یہ پانی ابالیں نہیں — ابالنے سے کیمیائی آلودگی بڑھتی ہے۔",
        "boil_advisory": "✅ اگلے نوٹس تک پینے سے پہلے پانی ابالیں۔",
        "subject": "🚨 پانی کے معیار کی تنبیہ — {district}, {state}",
    },
}

SUPPORTED_LANGUAGES = list(TRANSLATIONS.keys())

SEVERITY_COLORS = {
    "CRITICAL": "#DC2626",
    "HIGH": "#EA580C",
    "MODERATE": "#D97706",
    "LOW": "#16A34A",
}

ACTION_CODE_ENGLISH = {
    "USE_ALTERNATIVE_SAFE_SOURCE": "Use an alternative safe water source immediately.",
    "BOIL_OR_CHLORINATE": "Boil water vigorously for at least 1 minute before drinking.",
    "FILTER_OR_TREAT": "Filter or treat water before consumption.",
    "RETEST": "Arrange for a retest by a certified laboratory.",
    "USE_APPROPRIATE_CHEMICAL_TREATMENT": "Use appropriate chemical treatment (RO filter recommended).",
    "DISINFECT_BEFORE_DRINKING": "Disinfect water before drinking.",
    "DISINFECT_FOR_BIOLOGICAL_CONTAMINATION": "Disinfect specifically for biological contamination.",
}


def _t(lang: str, key: str, **fmt) -> str:
    """Get translated string, falling back to English."""
    lang = lang if lang in TRANSLATIONS else "en"
    text = TRANSLATIONS[lang].get(key, TRANSLATIONS["en"].get(key, key))
    if fmt:
        try:
            text = text.format(**fmt)
        except (KeyError, ValueError):
            text = TRANSLATIONS["en"].get(key, key).format(**fmt)
    return text


def _build_html_email(
    citizen_name: str,
    sample_info: dict,
    action_codes: list[str],
    lang: str = "en",
) -> str:
    """Build a professional responsive HTML email body."""

    safe_citizen_name = html.escape(str(citizen_name or "Citizen"))
    severity = str(sample_info.get("severity", "HIGH"))
    severity_color = SEVERITY_COLORS.get(severity, "#EA580C")
    district = html.escape(str(sample_info.get("district", "")))
    state = html.escape(str(sample_info.get("state_ut", "")))
    village = html.escape(str(sample_info.get("village") or district))
    do_not_boil = sample_info.get("do_not_boil", False)

    # Safety advisory block
    if do_not_boil:
        advisory_html = f"""
        <div style="background:#FEF2F2;border-left:4px solid #DC2626;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0;">
          <p style="margin:0;font-size:15px;color:#991B1B;font-weight:700;">{_t(lang, 'do_not_boil_warning')}</p>
        </div>"""
    else:
        advisory_html = f"""
        <div style="background:#F0FDF4;border-left:4px solid #16A34A;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0;">
          <p style="margin:0;font-size:15px;color:#166534;font-weight:600;">{_t(lang, 'boil_advisory')}</p>
        </div>"""

    # Contaminant row
    contaminant_html = ""
    if sample_info.get("primary_contaminant"):
        safe_contaminant = html.escape(str(sample_info.get("primary_contaminant")))
        val = html.escape(str(sample_info.get("contaminant_value", "Detected")))
        unit = html.escape(str(sample_info.get("contaminant_unit", "")))
        limit = html.escape(str(sample_info.get("contaminant_limit", "")))
        contaminant_html = f"""
        <tr>
          <td style="padding:10px 16px;background:#F9FAFB;color:#6B7280;font-size:13px;width:40%;">{_t(lang, 'contaminant_label')}</td>
          <td style="padding:10px 16px;font-weight:700;color:#DC2626;">{safe_contaminant}: {val} {unit}</td>
        </tr>
        <tr>
          <td style="padding:10px 16px;background:#F9FAFB;color:#6B7280;font-size:13px;">{_t(lang, 'limit_label')}</td>
          <td style="padding:10px 16px;color:#166534;font-weight:600;">{limit} {unit}</td>
        </tr>"""

    # Action items
    actions_html = ""
    if action_codes:
        items = "".join(
            f'<li style="margin-bottom:8px;color:#374151;">{ACTION_CODE_ENGLISH.get(a, a.replace("_", " ").title())}</li>'
            for a in action_codes
        )
        actions_html = f"""
        <div style="margin-top:24px;">
          <p style="font-weight:700;color:#111827;margin-bottom:12px;">{_t(lang, 'action_label')}:</p>
          <ul style="padding-left:20px;margin:0;">{items}</ul>
        </div>"""

    portal_url = "https://jalrakshak.vercel.app"

    return f"""<!DOCTYPE html>
<html lang="{lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>JalRakshak Water Quality Alert</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:24px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#0C4A6E 0%,#0369A1 100%);padding:32px 40px;text-align:center;">
          <h1 style="color:#FFFFFF;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">💧 JalRakshak</h1>
          <p style="color:#BAE6FD;margin:8px 0 0;font-size:13px;">AI-Based Water Quality Monitoring System</p>
        </td>
      </tr>

      <!-- Severity Badge -->
      <tr>
        <td style="padding:0;">
          <div style="background:{severity_color};padding:14px 40px;text-align:center;">
            <p style="margin:0;color:#FFFFFF;font-size:16px;font-weight:700;letter-spacing:0.5px;">
              🚨 {severity} WATER QUALITY ALERT
            </p>
          </div>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:32px 40px;">
          <p style="font-size:16px;color:#374151;margin:0 0 8px;">{_t(lang, 'greeting', name=safe_citizen_name)}</p>
          <p style="font-size:15px;color:#374151;margin:0 0 24px;line-height:1.6;">{_t(lang, 'intro')}</p>

          {advisory_html}

          <!-- Details Table -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;margin-top:8px;">
            <tr>
              <td style="padding:10px 16px;background:#F9FAFB;color:#6B7280;font-size:13px;width:40%;">{_t(lang, 'location_label')}</td>
              <td style="padding:10px 16px;font-weight:600;color:#111827;">{village}, {district}, {state}</td>
            </tr>
            <tr>
              <td style="padding:10px 16px;background:#F9FAFB;color:#6B7280;font-size:13px;">{_t(lang, 'severity_label')}</td>
              <td style="padding:10px 16px;font-weight:700;color:{severity_color};">{severity}</td>
            </tr>
            {contaminant_html}
            <tr>
              <td style="padding:10px 16px;background:#F9FAFB;color:#6B7280;font-size:13px;">{_t(lang, 'sample_id_label')}</td>
              <td style="padding:10px 16px;color:#374151;font-family:monospace;">{sample_info.get('sample_id', 'N/A')}</td>
            </tr>
            <tr>
              <td style="padding:10px 16px;background:#F9FAFB;color:#6B7280;font-size:13px;">{_t(lang, 'date_label')}</td>
              <td style="padding:10px 16px;color:#374151;">{sample_info.get('sample_date', 'N/A')}</td>
            </tr>
          </table>

          {actions_html}

          <!-- CTA Button -->
          <div style="text-align:center;margin-top:32px;">
            <a href="{portal_url}" style="background:#0369A1;color:#FFFFFF;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;display:inline-block;">
              {_t(lang, 'portal_label')} →
            </a>
          </div>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#F9FAFB;padding:20px 40px;border-top:1px solid #E5E7EB;">
          <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;line-height:1.6;">
            {_t(lang, 'footer')}<br>
            Standards Reference: BIS IS 10500:2012 — Drinking Water Specification
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>"""


def _build_plain_text_email(
    citizen_name: str,
    sample_info: dict,
    action_codes: list[str],
    lang: str = "en",
) -> str:
    """Build plain-text fallback email body."""
    district = sample_info.get("district", "")
    state = sample_info.get("state_ut", "")
    village = sample_info.get("village") or district
    severity = sample_info.get("severity", "HIGH")
    do_not_boil = sample_info.get("do_not_boil", False)

    lines = [
        f"JalRakshak — Water Quality Alert",
        "=" * 40,
        "",
        _t(lang, "greeting", name=citizen_name),
        "",
        _t(lang, "intro"),
        "",
    ]

    if do_not_boil:
        lines.append(_t(lang, "do_not_boil_warning"))
    else:
        lines.append(_t(lang, "boil_advisory"))
    lines.append("")

    lines += [
        f"{_t(lang, 'location_label')}: {village}, {district}, {state}",
        f"{_t(lang, 'severity_label')}: {severity}",
    ]

    if sample_info.get("primary_contaminant"):
        val = sample_info.get("contaminant_value", "Detected")
        unit = sample_info.get("contaminant_unit", "")
        limit = sample_info.get("contaminant_limit", "")
        lines += [
            f"{_t(lang, 'contaminant_label')}: {sample_info['primary_contaminant']}: {val} {unit}",
            f"{_t(lang, 'limit_label')}: {limit} {unit}",
        ]

    lines += [
        f"{_t(lang, 'sample_id_label')}: {sample_info.get('sample_id', 'N/A')}",
        f"{_t(lang, 'date_label')}: {sample_info.get('sample_date', 'N/A')}",
        "",
    ]

    if action_codes:
        lines.append(f"{_t(lang, 'action_label')}:")
        for a in action_codes:
            lines.append(f"  • {ACTION_CODE_ENGLISH.get(a, a.replace('_', ' ').title())}")
        lines.append("")

    lines += [
        "-" * 40,
        _t(lang, "footer"),
        "Standards Reference: BIS IS 10500:2012",
        "https://jalrakshak.vercel.app",
    ]

    return "\n".join(lines)


class EmailResult:
    """Return value from send_alert_email()."""
    def __init__(
        self,
        success: bool,
        simulated: bool = False,
        failure_reason: Optional[str] = None,
        provider_message_id: Optional[str] = None,
        config_warning: Optional[str] = None,
    ):
        self.success = success
        self.simulated = simulated
        self.failure_reason = failure_reason
        self.provider_message_id = provider_message_id
        self.config_warning = config_warning


def send_alert_email(
    to_email: str,
    citizen_name: str,
    sample_info: dict,
    action_codes: Optional[list[str]] = None,
    lang: str = "en",
    recipient_role: str = "citizen",
) -> EmailResult:
    """
    Send a water-quality alert email.

    Returns an EmailResult with:
      - success: True if sent (or simulated in dev mode)
      - simulated: True if no real API key was configured
      - failure_reason: human-readable string on failure
      - provider_message_id: Resend's message ID on success
      - config_warning: set when Resend is not configured
    """
    settings = get_settings()

    # Resolve effective API key (prefer RESEND_API_KEY, fall back to EMAIL_API_KEY)
    api_key = (settings.resend_api_key or settings.email_api_key or "").strip()
    is_test_key = not api_key or api_key in ("re_test_key", "")

    if action_codes is None:
        action_codes = []

    # Normalise language
    lang = lang if lang in TRANSLATIONS else "en"

    subject = _t(lang, "subject",
                 district=sample_info.get("district", ""),
                 state=sample_info.get("state_ut", ""))

    html_body = _build_html_email(citizen_name, sample_info, action_codes, lang)
    text_body = _build_plain_text_email(citizen_name, sample_info, action_codes, lang)

    # ── Simulation mode ────────────────────────────────────────────────────────
    if is_test_key:
        warning = (
            "RESEND_API_KEY is not configured or is set to the test placeholder. "
            "Email was NOT sent. Set RESEND_API_KEY in backend/.env to enable delivery."
        )
        logger.warning(f"[SIMULATED EMAIL] To: {to_email} | Subject: {subject}")
        logger.info(f"[SIMULATED] Plain-text body preview:\n{text_body[:300]}...")
        return EmailResult(
            success=True,
            simulated=True,
            config_warning=warning,
        )

    # ── Send via Resend ────────────────────────────────────────────────────────
    req_data = {
        "from": f"{settings.email_from_name} <{settings.email_from}>",
        "to": [to_email],
        "subject": subject,
        "html": html_body,
        "text": text_body,
    }

    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=json.dumps(req_data).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            resp_body = response.read().decode("utf-8")
            resp_json = json.loads(resp_body)
            message_id = resp_json.get("id")
            logger.info(f"Email sent via Resend to {to_email} | id={message_id}")
            return EmailResult(success=True, provider_message_id=message_id)

    except urllib.error.HTTPError as e:
        error_body = ""
        try:
            error_body = e.read().decode("utf-8")
        except Exception:
            pass
        reason = f"HTTP {e.code}: {error_body[:200]}"
        logger.error(f"Resend API error sending to {to_email}: {reason}")
        return EmailResult(success=False, failure_reason=reason)

    except urllib.error.URLError as e:
        reason = f"Network error: {str(e.reason)}"
        logger.error(f"Failed to reach Resend API for {to_email}: {reason}")
        return EmailResult(success=False, failure_reason=reason)

    except Exception as e:
        reason = f"Unexpected error: {str(e)}"
        logger.error(f"Email send failed for {to_email}: {reason}")
        return EmailResult(success=False, failure_reason=reason)


def send_admin_alert_email(
    to_email: str,
    admin_name: str,
    sample_info: dict,
    action_codes: Optional[list[str]] = None,
    notification_stats: Optional[dict] = None,
) -> EmailResult:
    """
    Send a technical alert summary email to admin.
    Always sent in English with additional delivery statistics.
    """
    settings = get_settings()
    api_key = (settings.resend_api_key or settings.email_api_key or "").strip()
    is_test_key = not api_key or api_key in ("re_test_key", "")

    if action_codes is None:
        action_codes = []

    district = sample_info.get("district", "")
    state = sample_info.get("state_ut", "")
    severity = sample_info.get("severity", "HIGH")
    severity_color = SEVERITY_COLORS.get(severity, "#EA580C")

    stats_html = ""
    if notification_stats:
        total = notification_stats.get("total", 0)
        sent = notification_stats.get("sent", 0)
        failed = notification_stats.get("failed", 0)
        stats_html = f"""
        <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:16px 20px;margin-top:20px;">
          <p style="margin:0 0 8px;font-weight:700;color:#1E40AF;">📊 Citizen Notification Summary</p>
          <p style="margin:0;color:#1E40AF;font-size:14px;">
            Total citizens notified: <strong>{total}</strong> &nbsp;|&nbsp;
            Sent: <strong style="color:#16A34A;">{sent}</strong> &nbsp;|&nbsp;
            Failed: <strong style="color:#DC2626;">{failed}</strong>
          </p>
        </div>"""

    subject = f"[ADMIN] 🚨 {severity} Alert — {district}, {state} | JalRakshak"

    html_body = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>JalRakshak Admin Alert</title></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:24px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <tr><td style="background:linear-gradient(135deg,#1E1B4B 0%,#312E81 100%);padding:28px 40px;text-align:center;">
        <h1 style="color:#FFFFFF;margin:0;font-size:24px;font-weight:800;">💧 JalRakshak Admin Alert</h1>
        <p style="color:#C7D2FE;margin:6px 0 0;font-size:13px;">Technical Contamination Notice</p>
      </td></tr>
      <tr><td style="background:{severity_color};padding:12px 40px;text-align:center;">
        <p style="margin:0;color:#FFFFFF;font-size:15px;font-weight:700;">🚨 {severity} SEVERITY WATER QUALITY ALERT</p>
      </td></tr>
      <tr><td style="padding:32px 40px;">
        <p style="color:#374151;font-size:15px;">Dear {admin_name},</p>
        <p style="color:#374151;font-size:15px;line-height:1.6;">
          A new water quality alert has been generated for <strong>{district}, {state}</strong>.
          Citizen notifications are being dispatched automatically.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;margin-top:16px;">
          <tr><td style="padding:10px 16px;background:#F9FAFB;color:#6B7280;font-size:13px;width:40%;">Location</td>
              <td style="padding:10px 16px;font-weight:600;">{sample_info.get('village','')}, {district}, {state}</td></tr>
          <tr><td style="padding:10px 16px;background:#F9FAFB;color:#6B7280;font-size:13px;">Severity</td>
              <td style="padding:10px 16px;font-weight:700;color:{severity_color};">{severity}</td></tr>
          <tr><td style="padding:10px 16px;background:#F9FAFB;color:#6B7280;font-size:13px;">Alert Category</td>
              <td style="padding:10px 16px;">{sample_info.get('alert_category','')}</td></tr>
          <tr><td style="padding:10px 16px;background:#F9FAFB;color:#6B7280;font-size:13px;">Primary Contaminant</td>
              <td style="padding:10px 16px;font-weight:600;color:#DC2626;">{sample_info.get('primary_contaminant','N/A')}</td></tr>
          <tr><td style="padding:10px 16px;background:#F9FAFB;color:#6B7280;font-size:13px;">Do Not Boil</td>
              <td style="padding:10px 16px;font-weight:700;color:{"#DC2626" if sample_info.get("do_not_boil") else "#16A34A"};">{"YES — CHEMICAL HAZARD" if sample_info.get("do_not_boil") else "No"}</td></tr>
          <tr><td style="padding:10px 16px;background:#F9FAFB;color:#6B7280;font-size:13px;">Sample ID</td>
              <td style="padding:10px 16px;font-family:monospace;">{sample_info.get('sample_id','N/A')}</td></tr>
          <tr><td style="padding:10px 16px;background:#F9FAFB;color:#6B7280;font-size:13px;">Test Date</td>
              <td style="padding:10px 16px;">{sample_info.get('sample_date','N/A')}</td></tr>
          <tr><td style="padding:10px 16px;background:#F9FAFB;color:#6B7280;font-size:13px;">Rule Reason</td>
              <td style="padding:10px 16px;font-size:13px;color:#6B7280;">{sample_info.get('rule_reason','')}</td></tr>
        </table>
        {stats_html}
        <div style="text-align:center;margin-top:28px;">
          <a href="https://jalrakshak.vercel.app/admin" style="background:#312E81;color:#FFFFFF;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
            View in Admin Dashboard →
          </a>
        </div>
      </td></tr>
      <tr><td style="background:#F9FAFB;padding:16px 40px;border-top:1px solid #E5E7EB;">
        <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;">
          JalRakshak — AI-Based Water Quality Monitoring System<br>
          Standards: BIS IS 10500:2012 | Rule engine decision — not AI-generated
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>"""

    text_body = (
        f"JalRakshak Admin Alert\n{'='*40}\n\n"
        f"Dear {admin_name},\n\n"
        f"A {severity} water quality alert has been generated for {district}, {state}.\n\n"
        f"Sample ID: {sample_info.get('sample_id','N/A')}\n"
        f"Primary Contaminant: {sample_info.get('primary_contaminant','N/A')}\n"
        f"Do Not Boil: {'YES — CHEMICAL HAZARD' if sample_info.get('do_not_boil') else 'No'}\n"
        f"Rule Reason: {sample_info.get('rule_reason','')}\n\n"
        f"Admin Dashboard: https://jalrakshak.vercel.app/admin\n"
    )

    if is_test_key:
        logger.warning(f"[SIMULATED ADMIN EMAIL] To: {to_email} | Subject: {subject}")
        return EmailResult(
            success=True,
            simulated=True,
            config_warning="RESEND_API_KEY not configured — admin email simulated.",
        )

    req_data = {
        "from": f"{settings.email_from_name} <{settings.email_from}>",
        "to": [to_email],
        "subject": subject,
        "html": html_body,
        "text": text_body,
    }

    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=json.dumps(req_data).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            resp_body = response.read().decode("utf-8")
            resp_json = json.loads(resp_body)
            message_id = resp_json.get("id")
            logger.info(f"Admin alert email sent to {to_email} | id={message_id}")
            return EmailResult(success=True, provider_message_id=message_id)
    except Exception as e:
        reason = str(e)
        logger.error(f"Admin email failed for {to_email}: {reason}")
        return EmailResult(success=False, failure_reason=reason)
