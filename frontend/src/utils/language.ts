// JalRakshak — Language Utilities

import type { LanguageOption, AdvisoryResponse } from '../types';

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', isRtl: true },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', isRtl: true },
];

export const LANGUAGE_STORAGE_KEY = 'jalrakshak_language';
const ADVISORY_CACHE_PREFIX = 'jalrakshak_advisory_cache_';

export function getSavedLanguageCode(): string {
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (saved) return saved;

  const browserLang = navigator.language.split('-')[0];
  const exists = LANGUAGES.find((l) => l.code === browserLang);
  return exists ? exists.code : 'en';
}

export function saveLanguageCode(code: string) {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
}

export function getLanguageByCode(code: string): LanguageOption {
  return LANGUAGES.find((l) => l.code === code) || { code, name: code };
}

// Simple local storage cache for advisories to save API calls
export function getCachedAdvisory(sampleId: number | string, languageCode: string): AdvisoryResponse | null {
  try {
    const key = `${ADVISORY_CACHE_PREFIX}${sampleId}_${languageCode}`;
    const cached = localStorage.getItem(key);
    if (cached) {
      return JSON.parse(cached) as AdvisoryResponse;
    }
  } catch (e) {
    console.error('Error reading advisory cache', e);
  }
  return null;
}

export function setCachedAdvisory(sampleId: number | string, languageCode: string, advisory: AdvisoryResponse) {
  try {
    const key = `${ADVISORY_CACHE_PREFIX}${sampleId}_${languageCode}`;
    localStorage.setItem(key, JSON.stringify(advisory));
  } catch (e) {
    console.error('Error writing advisory cache', e);
  }
}

// ── Simple Summary Translations ──────────────────────────────────────────────

export const SUMMARY_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    trend_title: "SIMPLE SUMMARY",
    trend_increasing: "{parameter} levels have been going up over time.",
    trend_decreasing: "{parameter} levels have been going down over time.",
    trend_stable: "{parameter} levels have stayed mostly at the same level during this period.",
    trend_insufficient: "There is not enough historical information to clearly understand the trend.",
    trend_latest: "The latest measured level is {value}.",
    trend_attention: "This means the water condition for this parameter needs attention.",
    technical_details: "Technical Details",
    forecast_title: "FUTURE OUTLOOK",
    forecast_increasing: "Based on previous measurements, the {parameter} level is expected to increase over the next {days} days.",
    forecast_decreasing: "Based on previous measurements, the {parameter} level may decrease over the next {days} days.",
    forecast_stable: "The {parameter} level is expected to remain around the current level over the forecast period.",
    forecast_insufficient: "There is not enough previous data to make a reliable future estimate.",
    forecast_estimated: "The estimated future level is around {value}.",
    forecast_disclaimer: "This is an estimate based on historical data, not a guaranteed future result."
  },
  hi: {
    trend_title: "सरल सारांश",
    trend_increasing: "समय के साथ {parameter} का स्तर बढ़ रहा है।",
    trend_decreasing: "समय के साथ {parameter} का स्तर घट रहा है।",
    trend_stable: "इस अवधि के दौरान {parameter} का स्तर लगभग समान रहा है।",
    trend_insufficient: "प्रवृत्ति को स्पष्ट रूप से समझने के लिए पर्याप्त ऐतिहासिक जानकारी नहीं है।",
    trend_latest: "नवीनतम मापा गया स्तर {value} है।",
    trend_attention: "इसका अर्थ है कि इस मापदंड के लिए पानी की स्थिति पर ध्यान देने की आवश्यकता है।",
    technical_details: "तकनीकी विवरण",
    forecast_title: "भविष्य का अनुमान",
    forecast_increasing: "पिछले मापों के आधार पर, अगले {days} दिनों में {parameter} का स्तर बढ़ने की उम्मीद है।",
    forecast_decreasing: "पिछले मापों के आधार पर, अगले {days} दिनों में {parameter} का स्तर घटने की उम्मीद है।",
    forecast_stable: "पूर्वानुमान अवधि में {parameter} का स्तर वर्तमान स्तर के आसपास रहने की उम्मीद है।",
    forecast_insufficient: "विश्वसनीय भविष्य का अनुमान लगाने के लिए पर्याप्त पिछला डेटा नहीं है।",
    forecast_estimated: "अनुमानित भविष्य का स्तर लगभग {value} है।",
    forecast_disclaimer: "यह ऐतिहासिक डेटा के आधार पर एक अनुमान है, न कि कोई निश्चित भविष्य का परिणाम।"
  },
  pa: {
    trend_title: "ਸਰਲ ਸਾਰਾਂਸ਼",
    trend_increasing: "ਸਮੇਂ ਦੇ ਨਾਲ {parameter} ਦਾ ਪੱਧਰ ਵੱਧ ਰਿਹਾ ਹੈ।",
    trend_decreasing: "ਸਮੇਂ ਦੇ ਨਾਲ {parameter} ਦਾ ਪੱਧਰ ਘੱਟ ਰਿਹਾ ਹੈ।",
    trend_stable: "ਇਸ ਮਿਆਦ ਦੌਰਾਨ {parameter} ਦਾ ਪੱਧਰ ਲਗਭਗ ਸਮਾਨ ਰਿਹਾ ਹੈ।",
    trend_insufficient: "ਰੁਝਾਨ ਨੂੰ ਸਪਸ਼ਟ ਤੌਰ 'ਤੇ ਸਮਝਣ ਲਈ ਕਾਫ਼ੀ ਇਤਿਹਾਸਕ ਜਾਣਕਾਰੀ ਨਹੀਂ ਹੈ।",
    trend_latest: "ਨਵੀਨਤਮ ਮਾਪਿਆ ਗਿਆ ਪੱਧਰ {value} ਹੈ।",
    trend_attention: "ਇਸਦਾ ਅਰਥ ਹੈ ਕਿ ਇਸ ਮਾਪਦੰਡ ਲਈ ਪਾਣੀ ਦੀ ਸਥਿਤੀ ਵੱਲ ਧਿਆਨ ਦੇਣ ਦੀ ਲੋੜ ਹੈ।",
    technical_details: "ਤਕਨੀਕੀ ਵੇਰਵੇ",
    forecast_title: "ਭਵਿੱਖ ਦਾ ਅਨੁਮਾਨ",
    forecast_increasing: "ਪਿਛਲੇ ਮਾਪਾਂ ਦੇ ਅਧਾਰ ਤੇ, ਅਗਲੇ {days} ਦਿਨਾਂ ਵਿੱਚ {parameter} ਦਾ ਪੱਧਰ ਵਧਣ ਦੀ ਉਮੀਦ ਹੈ।",
    forecast_decreasing: "ਪਿਛਲੇ ਮਾਪਾਂ ਦੇ ਅਧਾਰ ਤੇ, ਅਗਲੇ {days} ਦਿਨਾਂ ਵਿੱਚ {parameter} ਦਾ ਪੱਧਰ ਘਟਣ ਦੀ ਉਮੀਦ ਹੈ।",
    forecast_stable: "ਭਵਿੱਖਬਾਣੀ ਦੀ ਮਿਆਦ ਵਿੱਚ {parameter} ਦਾ ਪੱਧਰ ਮੌਜੂਦਾ ਪੱਧਰ ਦੇ ਆਸਪਾਸ ਰਹਿਣ ਦੀ ਉਮੀਦ ਹੈ।",
    forecast_insufficient: "ਭਰੋਸੇਮੰਦ ਭਵਿੱਖ ਦਾ ਅਨੁਮਾਨ ਲਗਾਉਣ ਲਈ ਕਾਫ਼ੀ ਪਿਛਲਾ ਡੇਟਾ ਨਹੀਂ ਹੈ।",
    forecast_estimated: "ਅਨੁਮਾਨਿਤ ਭਵਿੱਖ ਦਾ ਪੱਧਰ ਲਗਭਗ {value} ਹੈ।",
    forecast_disclaimer: "ਇਹ ਇਤਿਹਾਸਕ ਡੇਟਾ ਦੇ ਅਧਾਰ ਤੇ ਇੱਕ ਅਨੁਮਾਨ ਹੈ, ਨਾ ਕਿ ਕੋਈ ਪੱਕਾ ਭਵਿੱਖ ਦਾ ਨਤੀਜਾ।"
  },
  bn: {
    trend_title: "সহজ সারসংক্ষেপ",
    trend_increasing: "সময়ের সাথে সাথে {parameter}-এর মাত্রা বৃদ্ধি পাচ্ছে।",
    trend_decreasing: "সময়ের সাথে সাথে {parameter}-এর মাত্রা হ্রাস পাচ্ছে।",
    trend_stable: "এই সময়ের মধ্যে {parameter}-এর মাত্রা প্রায় একই রয়েছে।",
    trend_insufficient: "প্রবণতাটি স্পষ্টভাবে বোঝার জন্য পর্যাপ্ত ঐতিহাসিক তথ্য নেই।",
    trend_latest: "সর্বশেষ পরিমাপ করা মাত্রা হল {value}।",
    trend_attention: "এর মানে হল এই প্যারামিটারের জন্য জলের অবস্থার প্রতি মনোযোগ দেওয়া প্রয়োজন।",
    technical_details: "প্রযুক্তিগত বিবরণ",
    forecast_title: "ভবিষ্যতের পূর্বাভাস",
    forecast_increasing: "পূর্ববর্তী পরিমাপের উপর ভিত্তি করে, আগামী {days} দিনে {parameter}-এর মাত্রা বৃদ্ধি পাবে বলে আশা করা হচ্ছে।",
    forecast_decreasing: "পূর্ববর্তী পরিমাপের উপর ভিত্তি করে, আগামী {days} দিনে {parameter}-এর মাত্রা হ্রাস পাবে বলে আশা করা হচ্ছে।",
    forecast_stable: "পূর্বাভাসের মেয়াদে {parameter}-এর মাত্রা বর্তমান স্তরের কাছাকাছি থাকবে বলে আশা করা হচ্ছে।",
    forecast_insufficient: "নির্ভরযোগ্য ভবিষ্যতের অনুমান করার জন্য পর্যাপ্ত পূর্ববর্তী তথ্য নেই।",
    forecast_estimated: "আনুমানিক ভবিষ্যতের মাত্রা প্রায় {value}।",
    forecast_disclaimer: "এটি ঐতিহাসিক তথ্যের উপর ভিত্তি করে একটি অনুমান, নিশ্চিত ভবিষ্যতের ফলাফল নয়।"
  },
  ta: {
    trend_title: "எளிய சுருக்கம்",
    trend_increasing: "காலப்போக்கில் {parameter} அளவு அதிகரித்து வருகிறது.",
    trend_decreasing: "காலப்போக்கில் {parameter} அளவு குறைந்து வருகிறது.",
    trend_stable: "இந்த காலகட்டத்தில் {parameter} அளவு பெரும்பாலும் ஒரே நிலையில் உள்ளது.",
    trend_insufficient: "போக்கை தெளிவாக புரிந்து கொள்ள போதுமான வரலாற்று தகவல்கள் இல்லை.",
    trend_latest: "சமீபத்திய அளவிடப்பட்ட அளவு {value}.",
    trend_attention: "இதன் பொருள் இந்த அளவுருக்கான நீரின் நிலையில் கவனம் தேவை.",
    technical_details: "தொழில்நுட்ப விவரங்கள்",
    forecast_title: "எதிர்காலக் கணிப்பு",
    forecast_increasing: "முந்தைய அளவீடுகளின் அடிப்படையில், அடுத்த {days} நாட்களில் {parameter} அளவு அதிகரிக்கும் என எதிர்பார்க்கப்படுகிறது.",
    forecast_decreasing: "முந்தைய அளவீடுகளின் அடிப்படையில், அடுத்த {days} நாட்களில் {parameter} அளவு குறையும் என எதிர்பார்க்கப்படுகிறது.",
    forecast_stable: "கணிப்பு காலத்தில் {parameter} அளவு தற்போதைய அளவை ஒட்டியே இருக்கும் என எதிர்பார்க்கப்படுகிறது.",
    forecast_insufficient: "நம்பகமான எதிர்கால கணிப்பை உருவாக்க போதுமான முந்தைய தரவு இல்லை.",
    forecast_estimated: "எதிர்பார்க்கப்படும் எதிர்கால அளவு சுமார் {value} ஆக இருக்கலாம்.",
    forecast_disclaimer: "இது வரலாற்று தரவுகளின் அடிப்படையிலான ஒரு மதிப்பீடு, உறுதியான எதிர்கால முடிவு அல்ல."
  },
  te: {
    trend_title: "సాధారణ సారాంశం",
    trend_increasing: "కాలక్రమేణా {parameter} స్థాయిలు పెరుగుతున్నాయి.",
    trend_decreasing: "కాలక్రమేణా {parameter} స్థాయిలు తగ్గుతున్నాయి.",
    trend_stable: "ఈ వ్యవధిలో {parameter} స్థాయిలు చాలావరకు ఒకే స్థాయిలో ఉన్నాయి.",
    trend_insufficient: "ధోరణిని స్పష్టంగా అర్థం చేసుకోవడానికి తగినంత చారిత్రక సమాచారం లేదు.",
    trend_latest: "తాజాగా కొలిచిన స్థాయి {value}.",
    trend_attention: "దీనర్థం ఈ పరామితి కోసం నీటి పరిస్థితిపై శ్రద్ధ అవసరం.",
    technical_details: "సాంకేతిక వివరాలు",
    forecast_title: "భవిష్యత్ అంచనా",
    forecast_increasing: "మునుపటి కొలతల ఆధారంగా, రాబోయే {days} రోజుల్లో {parameter} స్థాయి పెరుగుతుందని భావిస్తున్నారు.",
    forecast_decreasing: "మునుపటి కొలతల ఆధారంగా, రాబోయే {days} రోజుల్లో {parameter} స్థాయి తగ్గుతుందని భావిస్తున్నారు.",
    forecast_stable: "అంచనా వ్యవధిలో {parameter} స్థాయి ప్రస్తుత స్థాయికి సమీపంలో ఉంటుందని భావిస్తున్నారు.",
    forecast_insufficient: "విశ్వసనీయ భవిష్యత్ అంచనా వేయడానికి తగినంత మునుపటి డేటా లేదు.",
    forecast_estimated: "అంచనా వేసిన భవిష్యత్ స్థాయి సుమారు {value}.",
    forecast_disclaimer: "ఇది చారిత్రక డేటా ఆధారంగా అంచనా మాత్రమే, ఖచ్చితమైన భవిష్యత్ ఫలితం కాదు."
  },
  mr: {
    trend_title: "सोपा सारांश",
    trend_increasing: "काळानुसार {parameter} ची पातळी वाढत आहे.",
    trend_decreasing: "काळानुसार {parameter} ची पातळी कमी होत classआहे.",
    trend_stable: "या कालावधीत {parameter} ची पातळी बहुतांशी समान राहिली आहे.",
    trend_insufficient: "कल स्पष्टपणे समजून घेण्यासाठी पुरेशी ऐतिहासिक माहिती नाही.",
    trend_latest: "नुकतीच मोजलेली पातळी {value} आहे.",
    trend_attention: "याचा अर्थ असा की या पॅरामीटरसाठी पाण्याच्या स्थितीकडे लक्ष देणे आवश्यक आहे.",
    technical_details: "तांत्रिक तपशील",
    forecast_title: "भविष्याचा अंदाज",
    forecast_increasing: "मागील मोजमापांवर आधारित, पुढील {days} दिवसांत {parameter} ची पातळी वाढण्याची अपेक्षा आहे.",
    forecast_decreasing: "मागील मोजमापांवर आधारित, पुढील {days} दिवसांत {parameter} ची पातळी कमी होण्याची अपेक्षा आहे.",
    forecast_stable: "अंदाज कालावधीत {parameter} ची पातळी सध्याच्या पातळीच्या आसपास राहण्याची अपेक्षा आहे.",
    forecast_insufficient: "खात्रीशीर भविष्यातील अंदाज लावण्यासाठी पुरेसा मागील डेटा नाही.",
    forecast_estimated: "अंदाजित भविष्यातील पातळी अंदाजे {value} आहे.",
    forecast_disclaimer: "हा ऐतिहासिक डेटावर आधारित अंदाज आहे, खात्रीशीर भविष्यातील निकाल नाही."
  },
  gu: {
    trend_title: "સરળ સારાંશ",
    trend_increasing: "સમય જતાં {parameter} નું સ્તર વધી રહ્યું છે.",
    trend_decreasing: "સમય જતાં {parameter} નું સ્તર ઘટી રહ્યું છે.",
    trend_stable: "આ સમયગાળા દરમિયાન {parameter} નું સ્તર મોટે ભાગે સમાન રહ્યું છે.",
    trend_insufficient: "વલણને સ્પષ્ટપણે સમજવા માટે પૂરતી ઐતિહાસિક માહિતી નથી.",
    trend_latest: "નવીનતમ માપેલ સ્તર {value} છે.",
    trend_attention: "આનો અર્થ એ છે કે આ પરિમાણ માટે પાણીની સ્થિતિ પર ધ્યાન આપવાની જરૂર છે.",
    technical_details: "તકનીકી વિગતો",
    forecast_title: "ભવિષ્યનો અંદાજ",
    forecast_increasing: "અગાઉના માપનના આધારે, આગામી {days} દિવસોમાં {parameter} નું સ્તર વધવાની અપેક્ષા છે.",
    forecast_decreasing: "અગાઉના માપનના આધારે, આગામી {days} દિવસોમાં {parameter} નું સ્તર ઘટવાની અપેક્ષા છે.",
    forecast_stable: "અંદાજિત સમયગાળા દરમિયાન {parameter} નું સ્તર વર્તમાન સ્તરની આસપાસ રહેવાની અપેક્ષા છે.",
    forecast_insufficient: "વિશ્વસનીય ભાવિ અંદાજ કાઢવા માટે પૂરતો અગાઉનો ડેટા નથી.",
    forecast_estimated: "અંદાજિત ભાવિ સ્તર લગભગ {value} છે.",
    forecast_disclaimer: "આ ઐતિહાસિક ડેટા પર આધારિત અંદાજ છે, ખાતરીપૂર્વકનું ભાવિ પરિણામ નથી."
  },
  kn: {
    trend_title: "ಸರಳ ಸಾರಾಂಶ",
    trend_increasing: "ಕಾಲಾನಂತರದಲ್ಲಿ {parameter} ಮಟ್ಟವು ಹೆಚ್ಚಾಗುತ್ತಿದೆ.",
    trend_decreasing: "ಕಾಲಾನಂತರದಲ್ಲಿ {parameter} ಮಟ್ಟವು ಕಡಿಮೆಯಾಗುತ್ತಿದೆ.",
    trend_stable: "ಈ ಅವಧಿಯಲ್ಲಿ {parameter} ಮಟ್ಟವು ಬಹುಪಾಲು ಒಂದೇ ಮಟ್ಟದಲ್ಲಿದೆ.",
    trend_insufficient: "ಪ್ರವೃತ್ತಿಯನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಸಾಕಷ್ಟು ಐತಿಹಾಸಿಕ ಮಾಹಿತಿಯಿಲ್ಲ.",
    trend_latest: "ಇತ್ತೀಚಿನ ಅಳತೆಯ ಮಟ್ಟವು {value} ಆಗಿದೆ.",
    trend_attention: "ಇದರರ್ಥ ಈ ನಿಯತಾಂಕಕ್ಕಾಗಿ ನೀರಿನ ಸ್ಥಿತಿಗೆ ಗಮನ ಬೇಕು.",
    technical_details: "ತಾಂತ್ರಿಕ ವಿವರಗಳು",
    forecast_title: "ಭವಿಷ್ಯದ ಮುನ್ನೋಟ",
    forecast_increasing: "ಹಿಂದಿನ ಅಳತೆಗಳ ಆಧಾರದ ಮೇಲೆ, ಮುಂದಿನ {days} ದಿನಗಳಲ್ಲಿ {parameter} ಮಟ್ಟವು ಹೆಚ್ಚಾಗುವ ನಿರೀಕ್ಷೆಯಿದೆ.",
    forecast_decreasing: "ಹಿಂದಿನ ಅಳತೆಗಳ ಆಧಾರದ ಮೇಲೆ, ಮುಂದಿನ {days} ದಿನಗಳಲ್ಲಿ {parameter} ಮಟ್ಟವು ಕಡಿಮೆಯಾಗುವ ನಿರೀಕ್ಷೆಯಿದೆ.",
    forecast_stable: "ಮುನ್ಸೂಚನೆಯ ಅವಧಿಯಲ್ಲಿ {parameter} ಮಟ್ಟವು ಪ್ರಸ್ತುತ ಮಟ್ಟದ ಸುತ್ತಲೂ ಇರುವ ನಿರೀಕ್ಷೆಯಿದೆ.",
    forecast_insufficient: "ವಿಶ್ವಾಸಾರ್ಹ ಭವಿಷ್ಯದ ಅಂದಾಜು ಮಾಡಲು ಸಾಕಷ್ಟು ಹಿಂದಿನ ಡೇಟಾ ಇಲ್ಲ.",
    forecast_estimated: "ಅಂದಾಜು ಭವಿಷ್ಯದ ಮಟ್ಟವು ಸುಮಾರು {value} ಆಗಿದೆ.",
    forecast_disclaimer: "ಇದು ಐತಿಹಾಸಿಕ ಡೇಟಾವನ್ನು ಆಧರಿಸಿದ ಅಂದಾಜು, ಖಚಿತ ಭವಿಷ್ಯದ ಫಲಿತಾಂಶವಲ್ಲ."
  },
  ml: {
    trend_title: "ലളിതമായ സംഗ്രഹം",
    trend_increasing: "കാലക്രമേണ {parameter} അളവ് വർദ്ധിച്ചുകൊണ്ടിരിക്കുകയാണ്.",
    trend_decreasing: "കാലക്രമേണ {parameter} അളവ് കുറഞ്ഞുകൊണ്ടിരിക്കുകയാണ്.",
    trend_stable: "ഈ കാലയളവിൽ {parameter} അളവ് മിക്കവാറും ഒരേ നിലയിലായിരുന്നു.",
    trend_insufficient: "പ്രവണത വ്യക്തമായി മനസ്സിലാക്കാൻ ആവശ്യമായ ചരിത്രപരമായ വിവരങ്ങൾ ഇല്ല.",
    trend_latest: "ഏറ്റവും പുതിയ അളന്ന നില {value} ആണ്.",
    trend_attention: "ഇതിനർത്ഥം ഈ പാരാമീറ്ററിനായുള്ള ജലത്തിന്റെ അവസ്ഥ ശ്രദ്ധിക്കേണ്ടതുണ്ട് എന്നാണ്.",
    technical_details: "സാങ്കേതിക വിശദാംശങ്ങൾ",
    forecast_title: "ഭാവി പ്രവചനം",
    forecast_increasing: "മുൻ അളവുകളുടെ അടിസ്ഥാനത്തിൽ, അടുത്ത {days} ദിവസങ്ങളിൽ {parameter} അളവ് വർദ്ധിക്കുമെന്ന് പ്രതീക്ഷിക്കുന്നു.",
    forecast_decreasing: "മുൻ അളവുകളുടെ അടിസ്ഥാനത്തിൽ, അടുത്ത {days} ദിവസങ്ങളിൽ {parameter} അളവ് കുറയുമെന്ന് പ്രതീക്ഷിക്കുന്നു.",
    forecast_stable: "പ്രവചന കാലയളവിൽ {parameter} അളവ് നിലവിലെ നിലവാരത്തിൽ തുടരുമെന്ന് പ്രതീക്ഷിക്കുന്നു.",
    forecast_insufficient: "വിശ്വസനീയമായ ഭാവി കണക്കുകൂട്ടൽ നടത്തുന്നതിന് ആവശ്യമായ മുൻ ഡാറ്റ ഇല്ല.",
    forecast_estimated: "കണക്കാക്കിയ ഭാവിയിലെ നിലവാരം ഏകദേശം {value} ആണ്.",
    forecast_disclaimer: "ഇത് ചരിത്രപരമായ ഡാറ്റ അടിസ്ഥാനമാക്കിയുള്ള ഒരു കണക്കുകൂട്ടലാണ്, ഉറപ്പായ ഭാവി ഫലമല്ല."
  },
  or: {
    trend_title: "ସରଳ ସାରାଂଶ",
    trend_increasing: "ସମୟ ସହିତ {parameter} ସ୍ତର ବୃଦ୍ଧି ପାଉଛି |",
    trend_decreasing: "ସମୟ ସହିତ {parameter} ସ୍ତର ହ୍ରାସ ପାଉଛି |",
    trend_stable: "ଏହି ସମୟ ମଧ୍ୟରେ {parameter} ସ୍ତର ପ୍ରାୟ ସମାନ ରହିଛି |",
    trend_insufficient: "ଧାରାକୁ ସ୍ପଷ୍ଟ ଭାବରେ ବୁଝିବା ପାଇଁ ପର୍ଯ୍ୟାପ୍ତ ଐତିହାସିକ ତଥ୍ୟ ନାହିଁ |",
    trend_latest: "ସର୍ବଶେଷ ମପାଯାଇଥିବା ସ୍ତର ହେଉଛି {value} |",
    trend_attention: "ଏହାର ଅର୍ଥ ହେଉଛି ଏହି ପାରାମିଟର ପାଇଁ ଜଳ ସ୍ଥିତି ପ୍ରତି ଧ୍ୟାନ ଦେବା ଆବଶ୍ୟକ |",
    technical_details: "ଯାନ୍ତ୍ରିକ ବିବରଣୀ",
    forecast_title: "ଭବିଷ୍ୟତ ଆକଳନ",
    forecast_increasing: "ପୂର୍ବ ମାପ ଉପରେ ଆଧାର କରି ଆସନ୍ତା {days} ଦିନ ମଧ୍ୟରେ {parameter} ସ୍ତର ବୃଦ୍ଧି ପାଇବ ବୋଲି ଆଶା କରାଯାଉଛି |",
    forecast_decreasing: "ପୂର୍ବ ମାପ ଉପରେ ଆଧାର କରି ଆସନ୍ତା {days} ଦିନ ମଧ୍ୟରେ {parameter} ସ୍ତର ହ୍ରାସ ପାଇବ ବୋଲି ଆଶା କରାଯାଉଛି |",
    forecast_stable: "ପୂର୍ବାନୁମାନ ସମୟ ମଧ୍ୟରେ {parameter} ସ୍ତର ବର୍ତ୍ତମାନର ସ୍ତର ପାଖାପାଖି ରହିବ ବୋଲି ଆଶା କରାଯାଉଛି |",
    forecast_insufficient: "ଏକ ନିର୍ଭରଯୋଗ୍ୟ ଭବିଷ୍ୟତ ଆକଳନ କରିବା ପାଇଁ ପର୍ଯ୍ୟାପ୍ତ ପୂର୍ବ ତଥ୍ୟ ନାହିଁ |",
    forecast_estimated: "ଆନୁମାନିକ ଭବିଷ୍ୟତର ସ୍ତର ପ୍ରାୟ {value} ଅଟେ |",
    forecast_disclaimer: "ଏହା ଐତିହାସିକ ତଥ୍ୟ ଉପରେ ଆଧାରିତ ଏକ ଆକଳନ, କୌଣସି ନିଶ୍ଚିତ ଭବିଷ୍ୟତ ଫଳାଫଳ ନୁହେଁ |"
  },
  as: {
    trend_title: "সৰল সাৰাংশ",
    trend_increasing: "সময়ৰ লগে লগে {parameter}ৰ মাত্ৰা বৃদ্ধি পাইছে।",
    trend_decreasing: "সময়ৰ লগে লগে {parameter}ৰ মাত্ৰা হ্ৰাস পাইছে।",
    trend_stable: "এই সময়ছোৱাত {parameter}ৰ মাত্ৰা প্ৰায় একেই আছে।",
    trend_insufficient: "প্ৰৱণতা স্পষ্টকৈ বুজিবলৈ পৰ্যাপ্ত ঐতিহাসিক তথ্য নাই।",
    trend_latest: "শেহতীয়াকৈ জোখা মাত্ৰা হৈছে {value}।",
    trend_attention: "ইয়াৰ অৰ্থ হ'ল এই পেৰামিটাৰৰ বাবে পানীৰ অৱস্থাৰ প্ৰতি মনোযোগ দিয়াৰ প্ৰয়োজন।",
    technical_details: "কাৰিকৰী বিৱৰণ",
    forecast_title: "ভৱিষ্যতৰ দৃষ্টিভংগী",
    forecast_increasing: "পূৰ্বৰ জোখৰ ওপৰত ভিত্তি কৰি অহা {days} দিনত {parameter}ৰ মাত্ৰা বৃদ্ধি পোৱাৰ আশা কৰা হৈছে।",
    forecast_decreasing: "পূৰ্বৰ জোখৰ ওপৰত ভিত্তি কৰি অহা {days} দিনত {parameter}ৰ মাত্ৰা হ্ৰাস পোৱাৰ আশা কৰা হৈছে।",
    forecast_stable: "পূৰ্বানুমানৰ সময়ছোৱাত {parameter}ৰ মাত্ৰা বৰ্তমানৰ মাত্ৰাৰ ওচৰত থকাৰ আশা কৰা হৈছে।",
    forecast_insufficient: "নিৰ্ভৰযোগ্য ভৱিষ্যতৰ অনুমান কৰিবলৈ পৰ্যাপ্ত পূৰ্বৰ তথ্য নাই।",
    forecast_estimated: "আনুমানিক ভৱিষ্যতৰ মাত্ৰা প্ৰায় {value}।",
    forecast_disclaimer: "এইটো ঐতিহাসিক তথ্যৰ ওপৰত ভিত্তি কৰি এটা অনুমান, নিশ্চিত ভৱিষ্যতৰ ফলাফল নহয়।"
  },
  ur: {
    trend_title: "آسان خلاصہ",
    trend_increasing: "وقت کے ساتھ ساتھ {parameter} کی سطح میں اضافہ ہو رہا ہے۔",
    trend_decreasing: "وقت کے ساتھ ساتھ {parameter} کی سطح میں کمی آ رہی ہے۔",
    trend_stable: "اس مدت کے دوران {parameter} کی سطح بڑی حد تک یکساں رہی ہے۔",
    trend_insufficient: "رجحان کو واضح طور پر سمجھنے کے لیے کافی تاریخی معلومات نہیں ہیں۔",
    trend_latest: "تازہ ترین ناپی گئی سطح {value} ہے۔",
    trend_attention: "اس کا مطلب یہ ہے کہ اس پیرامیٹر کے لئے پانی کی حالت پر توجہ دینے کی ضرورت ہے۔",
    technical_details: "تکنیکی تفصیلات",
    forecast_title: "مستقبل کا منظر نامہ",
    forecast_increasing: "پچھلی پیمائشوں کی بنیاد پر، اگلے {days} دنوں میں {parameter} کی سطح بڑھنے کی توقع ہے۔",
    forecast_decreasing: "پچھلی پیمائشوں کی بنیاد پر، اگلے {days} دنوں میں {parameter} کی سطح کم ہونے کی توقع ہے۔",
    forecast_stable: "پیشن گوئی کی مدت کے دوران {parameter} کی سطح موجودہ سطح کے آس پاس رہنے کی توقع ہے۔",
    forecast_insufficient: "مستقبل کا قابل اعتماد تخمینہ لگانے کے لیے کافی پچھلا ڈیٹا نہیں ہے۔",
    forecast_estimated: "مستقبل کی تخمینی سطح لگ بھگ {value} ہے۔",
    forecast_disclaimer: "یہ تاریخی اعداد و شمار پر مبنی تخمینہ ہے، کوئی یقینی مستقبل کا نتیجہ نہیں۔"
  },
  ar: {
    trend_title: "ملخص بسيط",
    trend_increasing: "مستويات {parameter} ترتفع بمرور الوقت.",
    trend_decreasing: "مستويات {parameter} تنخفض بمرور الوقت.",
    trend_stable: "بقيت مستويات {parameter} على نفس المستوى إلى حد كبير خلال هذه الفترة.",
    trend_insufficient: "لا توجد معلومات تاريخية كافية لفهم الاتجاه بوضوح.",
    trend_latest: "أحدث مستوى تم قياسه هو {value}.",
    trend_attention: "هذا يعني أن حالة المياه لهذه المعلمة تحتاج إلى اهتمام.",
    technical_details: "التفاصيل الفنية",
    forecast_title: "النظرة المستقبلية",
    forecast_increasing: "بناءً على القياسات السابقة، من المتوقع أن يرتفع مستوى {parameter} خلال الـ {days} يومًا القادمة.",
    forecast_decreasing: "بناءً على القياسات السابقة، من المتوقع أن ينخفض مستوى {parameter} خلال الـ {days} يومًا القادمة.",
    forecast_stable: "من المتوقع أن يظل مستوى {parameter} حول مستواه الحالي خلال فترة التوقع.",
    forecast_insufficient: "لا توجد بيانات سابقة كافية لإجراء تقدير مستقبلي موثوق.",
    forecast_estimated: "المستوى المستقبلي المقدر حوالي {value}.",
    forecast_disclaimer: "هذا تقدير بناءً على البيانات التاريخية، وليس نتيجة مستقبلية مضمونة."
  }
};

export function getSummaryTranslation(lang: string, key: string, params: Record<string, string | number> = {}): string {
  const languageTranslations = SUMMARY_TRANSLATIONS[lang] || SUMMARY_TRANSLATIONS['en'];
  let text = languageTranslations[key] || SUMMARY_TRANSLATIONS['en'][key] || key;
  
  for (const [paramKey, paramValue] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
  }
  
  return text;
}
