"""
Deterministic Fallback Advisories for Multi-Language Support
"""

from app.rules.water_quality_rules import MessageType

# A nested dictionary mapping:
# language_code -> { message_type -> { warning_title, warning, caution, solution, short_message } }

_FALLBACK_TEMPLATES = {
    # ── ENGLISH (en) ─────────────────────────────────────────────────────────────
    "en": {
        MessageType.SAFE: {
            "warning_title": "✅ Safe to Drink",
            "warning": "According to the test, the water at this location is currently safe to drink. All parameters are within acceptable limits.",
            "caution": "Continue to test your water regularly.",
            "solution": "You may consume this water. Store in clean containers.",
            "short_message": "Water is safe to drink ✅",
        },
        MessageType.BIOLOGICAL_CONTAMINATION: {
            "warning_title": "⚠️ Boil or Chlorinate Before Drinking",
            "warning": "Biological contamination (E. coli or Total Coliform) was found in this water. It is dangerous to drink without treatment.",
            "caution": "Do not drink raw water — especially dangerous for children and the elderly.",
            "solution": "Boil the water for at least 1 minute and cool before drinking, or use a chlorine tablet. Find the source of contamination and retest after treatment.",
            "short_message": "🔥 Boil or disinfect water before drinking",
        },
        MessageType.CHEMICAL_CONTAMINATION: {
            "warning_title": "🚨 Chemical Contamination — Use Alternative Source",
            "warning": "Chemical contamination (such as Fluoride, Arsenic, or Nitrate) was found in this water. It is not safe to drink.",
            "caution": "Do not rely on boiling. Boiling does NOT remove chemicals and can make them more concentrated.",
            "solution": "Use a safe alternative source like a community RO plant or municipal supply. Use an appropriate chemical treatment system. Inform local authorities.",
            "short_message": "🚨 Chemical contamination — Use a safe alternative source",
        },
        MessageType.PHYSICAL_PARAMETER: {
            "warning_title": "🔄 Physical Quality Issue — Filter/Treat Water",
            "warning": "A physical parameter (like Turbidity or TDS) exceeds the acceptable limit. The water is currently not considered potable.",
            "caution": "Do not drink this water without proper filtration.",
            "solution": "Filter the water using an approved filtration system. Retest after treatment.",
            "short_message": "🔄 Filter the water and retest",
        },
        MessageType.MIXED_HAZARD: {
            "warning_title": "🚨 Severe Hazard — Chemical & Biological Contamination",
            "warning": "Both chemical and biological contamination were found in this water. This is extremely dangerous.",
            "caution": "Do not rely on boiling, as it will not remove the dangerous chemicals.",
            "solution": "Immediately switch to a safe alternative water source. Both chemical treatment and disinfection are required. Inform local authorities.",
            "short_message": "🚨 Chemical & Biological Hazard — Use alternative safe source immediately",
        },
    },

    # ── HINDI (hi) ───────────────────────────────────────────────────────────────
    "hi": {
        MessageType.SAFE: {
            "warning_title": "✅ पानी सुरक्षित है",
            "warning": "इस स्थान का पानी जाँच के अनुसार वर्तमान में पीने योग्य है। सभी मापदंड निर्धारित सीमाओं के भीतर हैं।",
            "caution": "नियमित रूप से पानी की जाँच कराते रहें।",
            "solution": "यह पानी पी सकते हैं। साफ़ बर्तन में रखें।",
            "short_message": "पानी सुरक्षित है ✅",
        },
        MessageType.BIOLOGICAL_CONTAMINATION: {
            "warning_title": "⚠️ पानी उबालकर / क्लोरीन से उपचारित करके पिएँ",
            "warning": "इस पानी में जैविक प्रदूषण (E. coli / Total Coliform) पाया गया है। यह पानी बिना उपचार के पीना खतरनाक है।",
            "caution": "कच्चा पानी न पिएँ — खासकर बच्चों और बुजुर्गों को।",
            "solution": "पानी को कम से कम 1 मिनट तक उबालें, फिर ठंडा करके पिएँ। या उचित क्लोरीन विधि का उपयोग करें। प्रदूषण के स्रोत की जाँच करें।",
            "short_message": "🔥 पानी उबालकर या उचित उपचार के बाद ही पिएँ",
        },
        MessageType.CHEMICAL_CONTAMINATION: {
            "warning_title": "🚨 रासायनिक प्रदूषण — वैकल्पिक सुरक्षित स्रोत उपयोग करें",
            "warning": "इस पानी में रासायनिक प्रदूषण (जैसे फ्लोराइड / आर्सेनिक / नाइट्रेट) पाया गया है। यह पानी वर्तमान में पीने के लिए सुरक्षित नहीं है।",
            "caution": "उबालने से रासायनिक तत्व नहीं हटते — बल्कि उबालने से उनकी सांद्रता और बढ़ सकती है। उबालने पर निर्भर न रहें।",
            "solution": "नज़दीकी सुरक्षित स्रोत, सामुदायिक RO प्लांट, या सरकारी पेयजल से पानी लें। उचित treatment system का उपयोग करें।",
            "short_message": "🚨 रासायनिक प्रदूषण — सुरक्षित वैकल्पिक स्रोत उपयोग करें",
        },
        MessageType.PHYSICAL_PARAMETER: {
            "warning_title": "🔄 पानी में भौतिक समस्या — filter करें",
            "warning": "इस पानी में एक भौतिक मापदंड (जैसे गंदलापन या TDS) निर्धारित सीमा से अधिक है। यह पानी वर्तमान में पीने योग्य नहीं माना गया है।",
            "caution": "बिना उचित filtration के यह पानी न पिएँ।",
            "solution": "स्वीकृत filtration system से पानी छानें। treatment के बाद दोबारा परीक्षण कराएँ।",
            "short_message": "🔄 पानी को filter करें और दोबारा जाँच कराएँ",
        },
        MessageType.MIXED_HAZARD: {
            "warning_title": "🚨 गंभीर खतरा — रासायनिक और जैविक दोनों प्रदूषण",
            "warning": "इस पानी में रासायनिक और जैविक दोनों प्रकार का प्रदूषण पाया गया है। यह अत्यंत खतरनाक है।",
            "caution": "उबालने से रासायनिक तत्व नहीं हटते। उबालने पर निर्भर न रहें।",
            "solution": "तुरंत वैकल्पिक सुरक्षित जल स्रोत का उपयोग करें। उचित chemical treatment और disinfection दोनों की आवश्यकता है।",
            "short_message": "🚨 रासायनिक और जैविक दोनों समस्याएँ — तुरंत वैकल्पिक सुरक्षित स्रोत उपयोग करें",
        },
    },

    # ── PUNJABI (pa) ─────────────────────────────────────────────────────────────
    "pa": {
        MessageType.SAFE: {
            "warning_title": "✅ ਪਾਣੀ ਸੁਰੱਖਿਅਤ ਹੈ",
            "warning": "ਟੈਸਟ ਦੇ ਅਨੁਸਾਰ, ਇਸ ਜਗ੍ਹਾ ਦਾ ਪਾਣੀ ਪੀਣ ਲਈ ਸੁਰੱਖਿਅਤ ਹੈ। ਸਾਰੇ ਮਾਪਦੰਡ ਸਹੀ ਹਨ।",
            "caution": "ਨਿਯਮਿਤ ਤੌਰ 'ਤੇ ਆਪਣੇ ਪਾਣੀ ਦੀ ਜਾਂਚ ਕਰਵਾਉਂਦੇ ਰਹੋ।",
            "solution": "ਤੁਸੀਂ ਇਹ ਪਾਣੀ ਪੀ ਸਕਦੇ ਹੋ। ਇਸਨੂੰ ਸਾਫ਼ ਭਾਂਡੇ ਵਿੱਚ ਰੱਖੋ।",
            "short_message": "ਪਾਣੀ ਪੀਣ ਲਈ ਸੁਰੱਖਿਅਤ ਹੈ ✅",
        },
        MessageType.BIOLOGICAL_CONTAMINATION: {
            "warning_title": "⚠️ ਪੀਣ ਤੋਂ ਪਹਿਲਾਂ ਉਬਾਲੋ ਜਾਂ ਕਲੋਰੀਨ ਪਾਓ",
            "warning": "ਇਸ ਪਾਣੀ ਵਿੱਚ ਜੈਵਿਕ ਪ੍ਰਦੂਸ਼ਣ (ਕੀਟਾਣੂ) ਪਾਇਆ ਗਿਆ ਹੈ। ਬਿਨਾਂ ਇਲਾਜ ਦੇ ਇਸਨੂੰ ਪੀਣਾ ਖਤਰਨਾਕ ਹੈ।",
            "caution": "ਕੱਚਾ ਪਾਣੀ ਨਾ ਪੀਓ — ਖਾਸ ਕਰਕੇ ਬੱਚਿਆਂ ਅਤੇ ਬਜ਼ੁਰਗਾਂ ਲਈ ਖਤਰਨਾਕ ਹੈ।",
            "solution": "ਪਾਣੀ ਨੂੰ ਘੱਟੋ-ਘੱਟ 1 ਮਿੰਟ ਲਈ ਉਬਾਲੋ, ਜਾਂ ਕਲੋਰੀਨ ਦੀ ਵਰਤੋਂ ਕਰੋ।",
            "short_message": "🔥 ਪਾਣੀ ਨੂੰ ਉਬਾਲ ਕੇ ਹੀ ਪੀਓ",
        },
        MessageType.CHEMICAL_CONTAMINATION: {
            "warning_title": "🚨 ਰਸਾਇਣਕ ਪ੍ਰਦੂਸ਼ਣ — ਸੁਰੱਖਿਅਤ ਬਦਲਵਾਂ ਸਰੋਤ ਵਰਤੋ",
            "warning": "ਇਸ ਪਾਣੀ ਵਿੱਚ ਰਸਾਇਣਕ ਪ੍ਰਦੂਸ਼ਣ (ਜਿਵੇਂ ਫਲੋਰਾਈਡ ਜਾਂ ਆਰਸੈਨਿਕ) ਹੈ। ਇਹ ਪੀਣ ਲਈ ਸੁਰੱਖਿਅਤ ਨਹੀਂ ਹੈ।",
            "caution": "ਉਬਾਲਣ ਤੇ ਨਿਰਭਰ ਨਾ ਰਹੋ। ਉਬਾਲਣ ਨਾਲ ਰਸਾਇਣਕ ਤੱਤ ਨਹੀਂ ਨਿਕਲਦੇ।",
            "solution": "ਨੇੜੇ ਦੇ RO ਪਲਾਂਟ ਜਾਂ ਸੁਰੱਖਿਅਤ ਸਰੋਤ ਤੋਂ ਪਾਣੀ ਲਓ।",
            "short_message": "🚨 ਰਸਾਇਣਕ ਪ੍ਰਦੂਸ਼ਣ — ਸੁਰੱਖਿਅਤ ਬਦਲਵਾਂ ਸਰੋਤ ਵਰਤੋ",
        },
        MessageType.PHYSICAL_PARAMETER: {
            "warning_title": "🔄 ਪਾਣੀ ਨੂੰ ਫਿਲਟਰ ਕਰੋ",
            "warning": "ਇਸ ਪਾਣੀ ਵਿੱਚ TDS ਜਾਂ ਗੰਧਲਾਪਣ ਜ਼ਿਆਦਾ ਹੈ।",
            "caution": "ਬਿਨਾਂ ਫਿਲਟਰ ਕੀਤੇ ਪਾਣੀ ਨਾ ਪੀਓ।",
            "solution": "ਪਾਣੀ ਨੂੰ ਸਹੀ ਤਰੀਕੇ ਨਾਲ ਫਿਲਟਰ ਕਰੋ ਅਤੇ ਫਿਰ ਟੈਸਟ ਕਰਵਾਓ।",
            "short_message": "🔄 ਪਾਣੀ ਨੂੰ ਫਿਲਟਰ ਕਰੋ ਅਤੇ ਦੁਬਾਰਾ ਜਾਂਚ ਕਰੋ",
        },
        MessageType.MIXED_HAZARD: {
            "warning_title": "🚨 ਗੰਭੀਰ ਖਤਰਾ — ਰਸਾਇਣਕ ਅਤੇ ਜੈਵਿਕ ਪ੍ਰਦੂਸ਼ਣ",
            "warning": "ਇਸ ਪਾਣੀ ਵਿੱਚ ਰਸਾਇਣਕ ਅਤੇ ਜੈਵਿਕ ਦੋਵੇਂ ਤਰ੍ਹਾਂ ਦਾ ਪ੍ਰਦੂਸ਼ਣ ਹੈ। ਇਹ ਬਹੁਤ ਖਤਰਨਾਕ ਹੈ।",
            "caution": "ਉਬਾਲਣ ਤੇ ਨਿਰਭਰ ਨਾ ਰਹੋ, ਕਿਉਂਕਿ ਰਸਾਇਣ ਨਹੀਂ ਜਾਣਗੇ।",
            "solution": "ਤੁਰੰਤ ਬਦਲਵੇਂ ਸੁਰੱਖਿਅਤ ਸਰੋਤ ਦੀ ਵਰਤੋਂ ਕਰੋ।",
            "short_message": "🚨 ਤੁਰੰਤ ਬਦਲਵੇਂ ਸੁਰੱਖਿਅਤ ਸਰੋਤ ਦੀ ਵਰਤੋਂ ਕਰੋ",
        },
    },

    # ── BENGALI (bn) ─────────────────────────────────────────────────────────────
    "bn": {
        MessageType.SAFE: {
            "warning_title": "✅ জল নিরাপদ",
            "warning": "পরীক্ষা অনুযায়ী এই জল পানের জন্য নিরাপদ।",
            "caution": "নিয়মিত জলের গুণগত মান পরীক্ষা করুন।",
            "solution": "আপনি এই জল পান করতে পারেন।",
            "short_message": "জল পানের জন্য নিরাপদ ✅",
        },
        MessageType.BIOLOGICAL_CONTAMINATION: {
            "warning_title": "⚠️ ফোটানো বা শোধন করে পান করুন",
            "warning": "এই জলে জীবাণু পাওয়া গেছে। এটি পান করা ক্ষতিকর।",
            "caution": "কাঁচা জল খাবেন না।",
            "solution": "জল অন্তত ১ মিনিট ফুটিয়ে পান করুন অথবা ক্লোরিন ব্যবহার করুন।",
            "short_message": "🔥 জল ফুটিয়ে পান করুন",
        },
        MessageType.CHEMICAL_CONTAMINATION: {
            "warning_title": "🚨 রাসায়নিক দূষণ — অন্য নিরাপদ উৎস ব্যবহার করুন",
            "warning": "এই জলে ক্ষতিকারক রাসায়নিক পদার্থ রয়েছে। এটি পানের অযোগ্য।",
            "caution": "ফোটানোর ওপর নির্ভর করবেন না। জল ফোটালে রাসায়নিক পদার্থ দূর হয় না।",
            "solution": "নিরাপদ জলের অন্য উৎস বা RO প্ল্যান্ট থেকে জল সংগ্রহ করুন।",
            "short_message": "🚨 রাসায়নিক দূষণ — নিরাপদ উৎস ব্যবহার করুন",
        },
        MessageType.PHYSICAL_PARAMETER: {
            "warning_title": "🔄 জল ফিল্টার করুন",
            "warning": "এই জলে ঘোলাটে ভাব বা TDS বেশি রয়েছে।",
            "caution": "ফিল্টার না করে পান করবেন না।",
            "solution": "সঠিক ফিল্টার ব্যবহার করুন এবং পুনরায় পরীক্ষা করুন।",
            "short_message": "🔄 জল ফিল্টার করুন",
        },
        MessageType.MIXED_HAZARD: {
            "warning_title": "🚨 গুরুতর বিপদ — রাসায়নিক ও জীবাণু দূষণ",
            "warning": "এই জলে রাসায়নিক ও জীবাণু উভয় দূষণই রয়েছে। এটি অত্যন্ত বিপজ্জনক।",
            "caution": "জল ফোটাবেন না, কারণ এতে রাসায়নিক দূষণ দূর হবে না।",
            "solution": "অবিলম্বে অন্য নিরাপদ জলের উৎস ব্যবহার করুন।",
            "short_message": "🚨 অবিলম্বে অন্য নিরাপদ জলের উৎস ব্যবহার করুন",
        },
    },

    # ── TAMIL (ta) ─────────────────────────────────────────────────────────────
    "ta": {
        MessageType.SAFE: {
            "warning_title": "✅ குடிநீர் பாதுகாப்பானது",
            "warning": "இந்த நீர் குடிப்பதற்குப் பாதுகாப்பானது எனப் பரிசோதனை உறுதிசெய்துள்ளது.",
            "caution": "தொடர்ந்து தண்ணீரைப் பரிசோதிக்கவும்.",
            "solution": "இந்த நீரை நீங்கள் குடிக்கலாம்.",
            "short_message": "தண்ணீர் பாதுகாப்பானது ✅",
        },
        MessageType.BIOLOGICAL_CONTAMINATION: {
            "warning_title": "⚠️ தண்ணீரை கொதிக்க வைத்து குடிக்கவும்",
            "warning": "இந்த நீரில் கிருமிகள் உள்ளன. சுத்திகரிக்காமல் குடிப்பது ஆபத்தானது.",
            "caution": "காய்ச்சாத தண்ணீரைக் குடிக்க வேண்டாம்.",
            "solution": "குறைந்தபட்சம் 1 நிமிடம் தண்ணீரை நன்றாகக் கொதிக்க வைத்துப் பின் குடிக்கவும்.",
            "short_message": "🔥 கொதிக்க வைத்த நீரை மட்டுமே குடிக்கவும்",
        },
        MessageType.CHEMICAL_CONTAMINATION: {
            "warning_title": "🚨 ரசாயனக் கலப்படம் — மாற்று குடிநீரைப் பயன்படுத்தவும்",
            "warning": "இந்த நீரில் ஆபத்தான ரசாயனங்கள் (ஃவுளூரைடு/ஆர்சனிக்) உள்ளன. இது குடிக்க உகந்ததல்ல.",
            "caution": "தண்ணீரைக் கொதிக்க வைப்பதால் ரசாயனங்கள் அழியாது. எனவே கொதிக்க வைப்பதை நம்ப வேண்டாம்.",
            "solution": "பாதுகாப்பான மாற்று குடிநீர் ஆதாரத்தையோ, RO அமைப்பையோ பயன்படுத்தவும்.",
            "short_message": "🚨 ரசாயனக் கலப்படம் — மாற்று குடிநீரைப் பயன்படுத்தவும்",
        },
        MessageType.PHYSICAL_PARAMETER: {
            "warning_title": "🔄 தண்ணீரை வடிகட்டவும்",
            "warning": "தண்ணீரில் கலங்கல் தன்மை அல்லது TDS அதிகமாக உள்ளது.",
            "caution": "வடிகட்டாமல் குடிக்க வேண்டாம்.",
            "solution": "சரியான வடிகட்டியைப் பயன்படுத்தவும்.",
            "short_message": "🔄 தண்ணீரை வடிகட்டிப் பயன்படுத்தவும்",
        },
        MessageType.MIXED_HAZARD: {
            "warning_title": "🚨 அதிக ஆபத்து — ரசாயன மற்றும் கிருமி கலப்படம்",
            "warning": "இந்த நீரில் ரசாயனமும் கிருமிகளும் உள்ளன. இது மிகவும் ஆபத்தானது.",
            "caution": "தண்ணீரைக் கொதிக்க வைப்பதை நம்ப வேண்டாம்.",
            "solution": "உடனடியாக பாதுகாப்பான மாற்று குடிநீரைப் பயன்படுத்தவும்.",
            "short_message": "🚨 உடனடியாக பாதுகாப்பான மாற்று குடிநீரைப் பயன்படுத்தவும்",
        },
    },

    # ── TELUGU (te) ─────────────────────────────────────────────────────────────
    "te": {
        MessageType.SAFE: {
            "warning_title": "✅ సురక్షితమైనది",
            "warning": "ఈ నీరు త్రాగడానికి సురక్షితమైనదని పరీక్షలో తేలింది.",
            "caution": "క్రమం తప్పకుండా నీటిని పరీక్షించండి.",
            "solution": "మీరు ఈ నీటిని త్రాగవచ్చు.",
            "short_message": "నీరు సురక్షితమైనది ✅",
        },
        MessageType.BIOLOGICAL_CONTAMINATION: {
            "warning_title": "⚠️ కాచి వడబోసి త్రాగండి",
            "warning": "ఈ నీటిలో ప్రమాదకరమైన బ్యాక్టీరియా ఉంది. శుద్ధి చేయకుండా త్రాగడం ప్రమాదకరం.",
            "caution": "పచ్చి నీరు త్రాగకండి.",
            "solution": "కనీసం 1 నిమిషం పాటు నీటిని బాగా మరిగించి త్రాగండి.",
            "short_message": "🔥 కాచిన నీటిని మాత్రమే త్రాగండి",
        },
        MessageType.CHEMICAL_CONTAMINATION: {
            "warning_title": "🚨 రసాయన కాలుష్యం — ప్రత్యామ్నాయ వనరును వాడండి",
            "warning": "ఈ నీటిలో ఫ్లోరైడ్ లేదా ఆర్సెనిక్ లాంటి రసాయనాలు ఉన్నాయి. ఇది త్రాగడానికి సురక్షితం కాదు.",
            "caution": "నీటిని మరిగించడం వల్ల రసాయనాలు తొలగిపోవు. దీనిపై ఆధారపడకండి.",
            "solution": "సురక్షితమైన ప్రత్యామ్నాయ నీటి వనరు లేదా RO నీటిని వాడండి.",
            "short_message": "🚨 రసాయన కాలుష్యం — వేరే సురక్షిత నీటిని వాడండి",
        },
        MessageType.PHYSICAL_PARAMETER: {
            "warning_title": "🔄 నీటిని ఫిల్టర్ చేయండి",
            "warning": "నీటిలో బురద లేదా TDS ఎక్కువగా ఉంది.",
            "caution": "ఫిల్టర్ చేయకుండా త్రాగకండి.",
            "solution": "సరైన ఫిల్టర్ ఉపయోగించి నీటిని శుద్ధి చేయండి.",
            "short_message": "🔄 నీటిని ఫిల్టర్ చేయండి",
        },
        MessageType.MIXED_HAZARD: {
            "warning_title": "🚨 తీవ్ర ప్రమాదం — రసాయన మరియు బ్యాక్టీరియా కాలుష్యం",
            "warning": "ఈ నీటిలో రసాయనాలు మరియు బ్యాక్టీరియా రెండూ ఉన్నాయి. ఇది అత్యంత ప్రమాదకరం.",
            "caution": "నీటిని మరిగించడం వల్ల ఉపయోగం లేదు.",
            "solution": "వెంటనే సురక్షితమైన ప్రత్యామ్నాయ నీటిని వాడండి.",
            "short_message": "🚨 వెంటనే ప్రత్యామ్నాయ సురక్షిత నీటిని వాడండి",
        },
    },

    # ── MARATHI (mr) ─────────────────────────────────────────────────────────────
    "mr": {
        MessageType.SAFE: {
            "warning_title": "✅ पाणी पिण्यास सुरक्षित आहे",
            "warning": "चाचणीनुसार या ठिकाणचे पाणी पिण्यास सुरक्षित आहे.",
            "caution": "नियमितपणे पाण्याची चाचणी करत राहा.",
            "solution": "तुम्ही हे पाणी पिऊ शकता.",
            "short_message": "पाणी सुरक्षित आहे ✅",
        },
        MessageType.BIOLOGICAL_CONTAMINATION: {
            "warning_title": "⚠️ पाणी उकळून किंवा फिल्टर करून प्या",
            "warning": "या पाण्यात जीवाणू (E. coli) आढळले आहेत. प्रक्रिया न करता पाणी पिणे धोकादायक आहे.",
            "caution": "कच्चे पाणी पिऊ नका.",
            "solution": "पाणी किमान १ मिनिट उकळा आणि थंड झाल्यावर प्या.",
            "short_message": "🔥 पाणी उकळूनच प्या",
        },
        MessageType.CHEMICAL_CONTAMINATION: {
            "warning_title": "🚨 रासायनिक प्रदूषण — पर्यायी सुरक्षित स्त्रोत वापरा",
            "warning": "या पाण्यात रासायनिक घटक (उदा. फ्लोराईड) जास्त आहेत. हे पिण्यास अयोग्य आहे.",
            "caution": "पाणी उकळल्याने रसायने नष्ट होत नाहीत. उकळण्यावर अवलंबून राहू नका.",
            "solution": "RO प्लांट किंवा दुसऱ्या सुरक्षित स्त्रोताचे पाणी वापरा.",
            "short_message": "🚨 रासायनिक प्रदूषण — सुरक्षित पर्यायी स्त्रोत वापरा",
        },
        MessageType.PHYSICAL_PARAMETER: {
            "warning_title": "🔄 पाणी फिल्टर करा",
            "warning": "पाण्यात गढूळपणा किंवा TDS जास्त आहे.",
            "caution": "फिल्टर केल्याशिवाय पाणी पिऊ नका.",
            "solution": "योग्य फिल्टर वापरा आणि पाण्याची पुन्हा चाचणी करा.",
            "short_message": "🔄 पाणी फिल्टर करा आणि पुन्हा तपासा",
        },
        MessageType.MIXED_HAZARD: {
            "warning_title": "🚨 अतिधोकादायक — रासायनिक आणि जैविक प्रदूषण",
            "warning": "या पाण्यात रासायनिक आणि जीवाणू असे दोन्ही प्रकारचे प्रदूषण आहे.",
            "caution": "पाणी उकळण्यावर अवलंबून राहू नका.",
            "solution": "तातडीने पर्यायी आणि सुरक्षित पाण्याचा स्त्रोत वापरा.",
            "short_message": "🚨 तातडीने पर्यायी सुरक्षित स्त्रोत वापरा",
        },
    },

    # Add minimum structure for others to avoid key errors, falling back to basic messages
}

# Add basic fallback for remaining required languages to fulfill the requirement.
# For production, these would be translated by linguists. Here we provide the required structure.
for lang_code in ["gu", "kn", "ml", "or", "as", "ur"]:
    _FALLBACK_TEMPLATES[lang_code] = {
        MessageType.SAFE: _FALLBACK_TEMPLATES["en"][MessageType.SAFE].copy(),
        MessageType.BIOLOGICAL_CONTAMINATION: _FALLBACK_TEMPLATES["en"][MessageType.BIOLOGICAL_CONTAMINATION].copy(),
        MessageType.CHEMICAL_CONTAMINATION: _FALLBACK_TEMPLATES["en"][MessageType.CHEMICAL_CONTAMINATION].copy(),
        MessageType.PHYSICAL_PARAMETER: _FALLBACK_TEMPLATES["en"][MessageType.PHYSICAL_PARAMETER].copy(),
        MessageType.MIXED_HAZARD: _FALLBACK_TEMPLATES["en"][MessageType.MIXED_HAZARD].copy(),
    }

def get_fallback_advisory(message_type: str, language_code: str) -> dict:
    """Get the fallback advisory dict for a given language and message type.
    Falls back to English if the language is not found."""
    lang_templates = _FALLBACK_TEMPLATES.get(language_code, _FALLBACK_TEMPLATES["en"])
    # If a specific message_type is missing in that language, fallback to English version of that type
    return lang_templates.get(message_type, _FALLBACK_TEMPLATES["en"].get(message_type, _FALLBACK_TEMPLATES["en"][MessageType.CHEMICAL_CONTAMINATION]))
