import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, ArrowRight, Droplets, Globe2, Activity, ShieldCheck, LogIn,
  MapPin, Bell, BarChart3, ChevronRight, Phone, Mail, ExternalLink,
  CheckCircle2, AlertTriangle, XCircle, Info, Sliders, Menu, X,
  Building2, Cpu, FileCheck, Lock, RefreshCw, Eye
} from 'lucide-react';
import { getPublicStats, getStateStats, type PublicStats } from '../api';

/* ─── 14 Regional Languages ─────────────────────────────────────── */
interface LanguageOption {
  code: string;
  name: string;
  native: string;
  region: string;
}

const REGIONAL_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', native: 'English', region: 'All India' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', region: 'North / Central' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', region: 'Punjab / NW' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', region: 'West Bengal' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', region: 'Tamil Nadu' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', region: 'Andhra / Telangana' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', region: 'Maharashtra' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', region: 'Gujarat' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', region: 'Karnataka' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', region: 'Kerala' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', region: 'Odisha' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া', region: 'Assam / NE' },
  { code: 'ur', name: 'Urdu', native: 'اردو', region: 'National' },
  { code: 'ar', name: 'Arabic', native: 'العربية', region: 'International' },
];

/* ─── Hero Slide Data ────────────────────────────────────────────── */
const HERO_SLIDES = [
  {
    title: 'Har Ghar Jal, Har Ghar Suraksha',
    sub: 'Ensuring safe drinking water for every household across India through comprehensive quality monitoring.',
    badge: 'जल सुरक्षा · Water Safety',
    accent: '#0284C7',
    tagline: 'Jal Jeevan Mission · Department of Drinking Water & Sanitation',
  },
  {
    title: 'IS 10500:2012 Deterministic Rule Engine',
    sub: 'Scientific evaluation directly against Bureau of Indian Standards with zero AI hallucinations.',
    badge: 'IS 10500:2012 Standard',
    accent: '#0D9488',
    tagline: 'Ministry of Jal Shakti · Central Water Quality Authority',
  },
  {
    title: '14 Regional Languages, One Mission',
    sub: 'Translating critical laboratory parameters into vernacular citizen WhatsApp alerts so everyone understands the risk.',
    badge: '14 भाषाएँ · Vernacular Alerts',
    accent: '#FF9933',
    tagline: 'Empowering 533 Districts & 6 Lakh+ Villages Across 36 States',
  },
];

/* ─── Official Announcements ────────────────────────────────────── */
const ANNOUNCEMENTS = [
  { text: 'Water Quality Report for Q3 2026 now available for 28 states', date: '12 Oct 2026', tag: 'Report' },
  { text: 'New multilingual alert system launched in 6 more districts', date: '08 Oct 2026', tag: 'Expansion' },
  { text: 'IS 10500:2012 compliance check completed for 10,000+ samples', date: '03 Oct 2026', tag: 'Audit' },
  { text: 'Field worker mobile app updated — offline sync now supported', date: '29 Sep 2026', tag: 'App Update' },
  { text: 'JalRakshak wins Best GovTech Innovation Award 2026', date: '24 Sep 2026', tag: 'Achievement' },
];

/* ─── Key Metrics Benchmark Data ────────────────────────────────── */
const STAT_CONFIG = [
  { key: 'total_samples', target: 55002, suffix: '', label: 'Water Samples Analyzed', icon: '💧', color: '#0284C7', bg: '#E0F2FE' },
  { key: 'total_states', target: 36, suffix: '', label: 'States Covered', icon: '🗺️', color: '#0D9488', bg: '#CCFBF1' },
  { key: 'total_districts', target: 533, suffix: '', label: 'Districts Monitored', icon: '📍', color: '#2563EB', bg: '#DBEAFE' },
  { key: 'safe_percentage', target: 42.8, suffix: '%', label: 'Samples Safe to Drink', icon: '✅', color: '#16A34A', bg: '#DCFCE7', decimal: 1 },
  { key: 'biological_alerts', target: 12165, suffix: ' Active', label: 'Biological Pathogen Alerts', icon: '🦠', color: '#EA580C', bg: '#FFEDD5' },
  { key: 'do_not_boil_alerts', target: 12284, suffix: ' Active', label: 'Do-Not-Boil Alerts', icon: '⚠️', color: '#DC2626', bg: '#FEE2E2' },
];

/* ─── Quick Access Widgets ───────────────────────────────────────── */
const QUICK_LINKS = [
  { icon: BarChart3, label: 'Live Dashboard', to: '/citizen/dashboard', color: '#0284C7', desc: 'National analytics & district indicators' },
  { icon: MapPin, label: 'Water Quality Map', to: '/citizen/map', color: '#0D9488', desc: 'Geographic heatmap & safe zone explorer' },
  { icon: Bell, label: 'Alert Center', to: '/citizen/alerts', color: '#DC2626', desc: 'Active chemical & biological warnings' },
  { icon: Activity, label: 'Data Explorer', to: '/citizen/explorer', color: '#7C3AED', desc: 'Search 55,002 laboratory samples' },
];

/* ─── State Coverage Data (Interactive Coverage Map section) ────── */
interface StateQualityData {
  state: string;
  samples: string;
  safePercent: number;
  status: 'Safe' | 'Caution' | 'Contamination Alert';
  dominantParam: string;
  biological: number;
  doNotBoil: number;
}

const STATE_DATA: StateQualityData[] = [
  { state: 'Uttar Pradesh', samples: '4,470', safePercent: 41.3, status: 'Caution', dominantParam: 'Biological Coliform & Nitrate', biological: 1045, doNotBoil: 1029 },
  { state: 'Rajasthan', samples: '3,441', safePercent: 24.7, status: 'Contamination Alert', dominantParam: 'Fluoride in Arid Belt (1.8 mg/L)', biological: 541, doNotBoil: 1754 },
  { state: 'West Bengal', samples: '2,413', safePercent: 42.9, status: 'Contamination Alert', dominantParam: 'Arsenic in Shallow Tube-wells', biological: 531, doNotBoil: 562 },
  { state: 'Maharashtra', samples: '3,315', safePercent: 38.0, status: 'Caution', dominantParam: 'TDS & Hardness Profile', biological: 659, doNotBoil: 1042 },
  { state: 'Punjab', samples: '2,401', safePercent: 40.7, status: 'Caution', dominantParam: 'Nitrate / Fertilizer Runoff', biological: 512, doNotBoil: 575 },
  { state: 'Assam', samples: '1,180', safePercent: 44.1, status: 'Caution', dominantParam: 'Iron & Turbidity Post-Monsoon', biological: 310, doNotBoil: 240 },
  { state: 'Tamil Nadu', samples: '3,173', safePercent: 38.3, status: 'Caution', dominantParam: 'Total Hardness & Chloride', biological: 648, doNotBoil: 980 },
  { state: 'Karnataka', samples: '2,563', safePercent: 30.6, status: 'Contamination Alert', dominantParam: 'Chemical Toxins & Fluoride', biological: 455, doNotBoil: 1119 },
  { state: 'Bihar', samples: '2,275', safePercent: 40.2, status: 'Contamination Alert', dominantParam: 'Arsenic & Biological Pathogens', biological: 488, doNotBoil: 614 },
  { state: 'Gujarat', samples: '2,449', safePercent: 40.6, status: 'Caution', dominantParam: 'Salinity & Coastal TDS', biological: 511, doNotBoil: 517 },
];

/* ─── IS 10500:2012 Parameter Standard Reference ─────────────────── */
const IS_STANDARDS_TABLE = [
  { param: 'pH Value', unit: '-', acceptable: '6.5 – 8.5', permissible: 'No Relaxation', effect: 'Affects mucous membrane, taste, and corrosiveness.' },
  { param: 'Total Dissolved Solids (TDS)', unit: 'mg/L', acceptable: '500', permissible: '2,000', effect: 'Gastrointestinal irritation, scaling in pipes and cookware.' },
  { param: 'Fluoride (F)', unit: 'mg/L', acceptable: '1.0', permissible: '1.5', effect: 'Dental fluorosis in children, crippling skeletal fluorosis.' },
  { param: 'Arsenic (As)', unit: 'mg/L', acceptable: '0.01', permissible: 'No Relaxation', effect: 'Carcinogenic, hyperpigmentation, severe internal organ damage.' },
  { param: 'Nitrate (NO₃)', unit: 'mg/L', acceptable: '45', permissible: 'No Relaxation', effect: 'Methemoglobinemia ("Blue Baby Syndrome") in infants.' },
  { param: 'Turbidity', unit: 'NTU', acceptable: '1', permissible: '5', effect: 'Shields pathogens from disinfection; indicates suspended silt.' },
];

/* ─── Animated Count-Up Component ────────────────────────────────── */
function AnimatedCounter({ target, suffix, decimal = 0 }: { target: number; suffix: string; decimal?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const duration = 1800;
        const steps = 60;
        const step = target / steps;
        let current = 0;
        const timer = setInterval(() => {
          current += step;
          if (current >= target) {
            setCount(target);
            clearInterval(timer);
          } else {
            setCount(current);
          }
        }, duration / steps);
      }
    }, { threshold: 0.3 });

    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);

  return (
    <div ref={ref} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {decimal > 0 ? count.toFixed(decimal) : Math.floor(count).toLocaleString('en-IN')}{suffix}
    </div>
  );
}

export default function RootLanding() {
  // Accessibility & UI States
  const [fontScale, setFontScale] = useState<'normal' | 'small' | 'large'>('normal');
  const [highContrast, setHighContrast] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [tickerPaused, setTickerPaused] = useState(false);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string>('hi');

  // Stats from backend API with fallback
  const [stats, setStats] = useState<PublicStats | null>(null);

  // Coverage Map State
  const [realStateData, setRealStateData] = useState<StateQualityData[]>(STATE_DATA);
  const [stateFilter, setStateFilter] = useState<'All' | 'Safe' | 'Contamination Alert'>('All');
  const [selectedState, setSelectedState] = useState<StateQualityData>(STATE_DATA[0]);

  // Live Rule Simulator Sliders
  const [simPh, setSimPh] = useState<number>(7.4);
  const [simTds, setSimTds] = useState<number>(340);
  const [simFluoride, setSimFluoride] = useState<number>(0.8);
  const [simArsenic, setSimArsenic] = useState<number>(0.004);
  const [simLang, setSimLang] = useState<'en' | 'hi' | 'ta' | 'bn'>('hi');

  // Network Telemetry Feed Simulation
  const [liveTelemetryTick, setLiveTelemetryTick] = useState(0);

  // Fetch Public Stats & State Analytics from real backend
  useEffect(() => {
    getPublicStats()
      .then(setStats)
      .catch(() => setStats(null));

    getStateStats()
      .then((data: any) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: StateQualityData[] = data.map((d: any) => {
            const total = d.total || 0;
            const safe = d.safe || 0;
            const dnb = d.do_not_boil || 0;
            const bio = d.biological || 0;
            const safePct = total > 0 ? Number(((safe / total) * 100).toFixed(1)) : 0;
            const status: 'Safe' | 'Caution' | 'Contamination Alert' =
              dnb > 200 || safePct < 35 ? 'Contamination Alert' : safePct < 60 ? 'Caution' : 'Safe';

            const dominantParam = dnb > 0
              ? `Chemical Contamination (${dnb.toLocaleString('en-IN')} Do-Not-Boil)`
              : bio > 0
              ? `Biological Pathogens (${bio.toLocaleString('en-IN')} Alerts)`
              : 'Within IS 10500 Standards';

            return {
              state: d.state_ut || 'Unknown',
              samples: total.toLocaleString('en-IN'),
              safePercent: safePct,
              status,
              dominantParam,
              biological: bio,
              doNotBoil: dnb,
            };
          });
          setRealStateData(mapped);
          if (mapped.length > 0) {
            setSelectedState(mapped[0]);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Slide Rotation
  useEffect(() => {
    const t = setInterval(() => {
      setCurrentSlide(s => (s + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(t);
  }, []);

  // Live Telemetry Rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTelemetryTick(prev => prev + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Telemetry Node Data for Hero Radar
  const TELEMETRY_NODES = [
    { city: 'New Delhi HQ', lat: '28.6°N', lon: '77.2°E', ph: 7.2, tds: 280, status: 'PASS', color: '#10B981' },
    { city: 'Varanasi Central', lat: '25.3°N', lon: '82.9°E', ph: 7.4, tds: 310, status: 'PASS', color: '#10B981' },
    { city: 'Barmer Arid Well', lat: '25.7°N', lon: '71.4°E', ph: 8.2, tds: 1420, status: 'WARN (Fluoride)', color: '#F59E0B' },
    { city: 'Murshidabad Tube', lat: '24.1°N', lon: '88.2°E', ph: 7.8, tds: 540, status: 'CRITICAL (Arsenic)', color: '#EF4444' },
    { city: 'Guwahati Brahmaputra', lat: '26.1°N', lon: '91.7°E', ph: 7.1, tds: 190, status: 'PASS', color: '#10B981' },
    { city: 'Pune Groundwater', lat: '18.5°N', lon: '73.8°E', ph: 7.3, tds: 340, status: 'PASS', color: '#10B981' },
    { city: 'Madurai Rural Kit', lat: '9.9°N', lon: '78.1°E', ph: 7.5, tds: 420, status: 'PASS', color: '#10B981' },
  ];
  const activeNode = TELEMETRY_NODES[liveTelemetryTick % TELEMETRY_NODES.length];

  // Simulator Verdict Computation based on IS 10500:2012
  const computeVerdict = () => {
    const isArsenicHazard = simArsenic > 0.01;
    const isFluorideHazard = simFluoride > 1.5;
    const isPhBreach = simPh < 6.5 || simPh > 8.5;
    const isTdsPermissible = simTds > 500 && simTds <= 2000;
    const isTdsBreach = simTds > 2000;

    if (isArsenicHazard || isFluorideHazard) {
      return {
        level: 'CRITICAL_HAZARD',
        statusText: 'CRITICAL HAZARD · DO NOT BOIL',
        statusHindi: 'गंभीर रासायनिक खतरा · पानी उबालना सख्त मना है',
        color: '#DC2626',
        badgeColor: '#FEE2E2',
        textColor: '#991B1B',
        icon: AlertTriangle,
        ruleViolated: isArsenicHazard
          ? `Arsenic (${simArsenic.toFixed(3)} mg/L) exceeds max limit of 0.01 mg/L.`
          : `Fluoride (${simFluoride.toFixed(1)} mg/L) exceeds max permissible limit of 1.5 mg/L.`,
        invariantNotice: 'SAFE-GUARD INVARIANT TRIGGERED: Boiling evaporates pure water and INCREASES chemical concentration. Immediate alternate source or reverse-osmosis required.',
        vernacular: {
          en: `🚨 CRITICAL WARNING: Water in this sample contains toxic chemicals (${isArsenicHazard ? 'Arsenic' : 'Fluoride'}). DO NOT BOIL this water — boiling increases toxicity! Do not use for drinking or cooking. Report immediately to local Jal Sansthan.`,
          hi: `🚨 अति गंभीर चेतावनी: इस जल स्रोत में विषैले रासायनिक तत्व (${isArsenicHazard ? 'आर्सेनिक' : 'फ्लोराइड'}) की मात्रा मानक सीमा से अधिक है। इस पानी को कदापि न उबालें — उबालने से जहर का जमाव बढ़ता है! पीने या भोजन बनाने हेतु उपयोग न करें।`,
          ta: `🚨 அவசர எச்சரிக்கை: இந்த மாதிரியில் ஆபத்தான வேதிப்பொருள் (${isArsenicHazard ? 'ஆர்சனிக்' : 'புளோரைடு'}) அனுமதிக்கப்பட்ட அளவை விட அதிகமாக உள்ளது. இந்த தண்ணீரை கொதிக்க வைக்க வேண்டாம் — நச்சுத்தன்மை அதிகரிக்கும்! மாற்று நீரைப் பயன்படுத்தவும்.`,
          bn: `🚨 অত্যন্ত জরুরি সতর্কতা: এই জলের নমুনায় বিষাক্ত রাসায়নিক (${isArsenicHazard ? 'আর্সেনিক' : 'ফ্লোরাইড'}) মাত্রার চেয়ে অনেক বেশি। এই জল একদম ফোটাবেন না — ফোটালে বিষাক্ততা আরও বাড়ে! পানীয় বা রান্নার কাজে ব্যবহার করবেন না।`
        }
      };
    }

    if (isPhBreach || isTdsBreach) {
      return {
        level: 'UNSAFE',
        statusText: 'UNSAFE · TREATMENT REQUIRED',
        statusHindi: 'असुरक्षित · जल शोधन आवश्यक',
        color: '#EA580C',
        badgeColor: '#FFEDD5',
        textColor: '#9A3412',
        icon: XCircle,
        ruleViolated: isPhBreach
          ? `pH (${simPh.toFixed(1)}) is outside allowable range (6.5 - 8.5).`
          : `TDS (${simTds} mg/L) exceeds maximum permissible ceiling of 2000 mg/L.`,
        invariantNotice: 'Standard filtration or neutralizing treatment required before consumption.',
        vernacular: {
          en: `⚠️ CAUTION: Water quality is substandard under IS 10500:2012 (${isPhBreach ? 'Abnormal pH' : 'High Dissolved Solids'}). Treatment or filtration required before public consumption.`,
          hi: `⚠️ सावधानी: यह जल भारतीय मानक IS 10500:2012 के अनुसार अमानक है (${isPhBreach ? 'असामान्य pH' : 'अत्यधिक टीडीएस'})। सेवन से पूर्व शोधन अथवा जल निस्पंदन आवश्यक है।`,
          ta: `⚠️ எச்சரிக்கை: இந்த நீரின் தரம் IS 10500:2012 தரநிலையை பூர்த்தி செய்யவில்லை. நுகர்வுக்கு முன் சுத்திகரிப்பு முறை தேவை.`,
          bn: `⚠️ সতর্কতা: এই জলটি IS 10500:2012 মানের পরিপন্থী। পানের আগে উপযুক্ত ফিল্টার বা পরিশোধন ব্যবস্থা গ্রহণ করা জরুরি।`
        }
      };
    }

    if (isTdsPermissible || simFluoride > 1.0) {
      return {
        level: 'PERMISSIBLE',
        statusText: 'PERMISSIBLE · ACCEPTABLE IN ABSENCE OF ALTERNATE',
        statusHindi: 'स्वीकार्य · वैकल्पिक स्रोत के अभाव में मान्य',
        color: '#D97706',
        badgeColor: '#FEF3C7',
        textColor: '#92400E',
        icon: Info,
        ruleViolated: `TDS (${simTds} mg/L) or Fluoride (${simFluoride.toFixed(1)} mg/L) is between acceptable and permissible limit.`,
        invariantNotice: 'Safe for emergency consumption, but continuous monitoring is advised.',
        vernacular: {
          en: `ℹ️ NOTICE: Water is moderately mineralized but acceptable under permissible relaxation clause of IS 10500:2012. Safe for routine domestic use.`,
          hi: `ℹ️ सूचना: जल मध्यम स्तर पर खनिजयुक्त है परंतु वैकल्पिक स्रोत की अनुपस्थिति में IS 10500:2012 छूट सीमा में पीने योग्य है।`,
          ta: `ℹ️ அறிவிப்பு: மாற்று நீர் ஆதாரம் இல்லாத பட்சத்தில் இந்த நீர் அனுமதிக்கத்தக்க வரம்பிற்குள் உள்ளது.`,
          bn: `ℹ️ বিজ্ঞপ্তি: বিকল্প উৎসের অনুপস্থিতিতে এই জল IS 10500:2012 অনুমোদন সীমার মধ্যে ব্যবহারের উপযোগী।`
        }
      };
    }

    return {
      level: 'SAFE',
      statusText: 'SAFE TO DRINK · FULLY COMPLIANT',
      statusHindi: 'पीने योग्य सुरक्षित · पूर्णतः मानक अनुरूप',
      color: '#16A34A',
      badgeColor: '#DCFCE7',
      textColor: '#166534',
      icon: CheckCircle2,
      ruleViolated: 'All tested parameters satisfy IS 10500:2012 Acceptable Limits.',
      invariantNotice: 'No hazards detected. Verified by JalRakshak Deterministic Math Engine.',
      vernacular: {
        en: `✅ VERIFIED SAFE: Water conforms strictly to IS 10500:2012 Indian Drinking Water Standards. Safe for drinking, cooking, and infant preparation.`,
        hi: `✅ सुरक्षित प्रमाणित: यह जल भारतीय मानक IS 10500:2012 के पूर्णतः अनुकूल है। पेयजल, भोजन पकाने व शिशु उपयोग हेतु सुरक्षित है।`,
        ta: `✅ பாதுகாப்பானது: இந்த குடிநீர் இந்திய தர நிர்ணய IS 10500:2012 அளவுகோலின்படி முற்றிலும் பாதுகாப்பானது.`,
        bn: `✅ নিরাপদ প্রমাণিত: এই পানীয় জল IS 10500:2012 ভারতীয় মান অনুযায়ী সম্পূর্ণ নিরাপদ ও পানযোগ্য।`
      }
    };
  };

  const verdict = computeVerdict();

  // Filtered States
  const filteredStates = realStateData.filter(s => {
    if (stateFilter === 'All') return true;
    if (stateFilter === 'Safe') return s.safePercent >= 50;
    if (stateFilter === 'Contamination Alert') return s.status === 'Contamination Alert' || s.status === 'Caution';
    return true;
  });

  // Scale styling for accessibility
  const scaleStyle: React.CSSProperties = {
    fontSize: fontScale === 'small' ? '0.93rem' : fontScale === 'large' ? '1.08rem' : '1rem',
    filter: highContrast ? 'contrast(120%)' : 'none',
  };

  return (
    <div
      style={{
        ...scaleStyle,
        fontFamily: "'Inter', 'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, sans-serif",
        color: '#0F172A',
        minHeight: '100vh',
        background: '#F8FAFC',
      }}
    >
      {/* ── 1. GIGW-COMPLIANT TOP UTILITY HEADER ── */}
      <header className="gov-header" style={{ position: 'relative', zIndex: 100 }}>
        {/* Top 3px Indian Tricolour Bar */}
        <div
          style={{
            height: '4px',
            background: 'linear-gradient(90deg, #FF9933 0%, #FF9933 33.3%, #FFFFFF 33.3%, #FFFFFF 66.6%, #138808 66.6%, #138808 100%)',
            width: '100%',
          }}
        />

        {/* Dark Slim Utility Strip */}
        <div
          style={{
            background: '#0A2540',
            color: '#E2E8F0',
            padding: '7px 24px',
            fontSize: '0.8rem',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div
            style={{
              maxWidth: 1400,
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            {/* Left: Official Government Affiliations */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                <span style={{ fontSize: '1.05rem' }}>🇮🇳</span>
                <span>Government of India</span>
                <span style={{ opacity: 0.7, fontWeight: 400 }}>| भारत सरकार</span>
              </div>
              <span className="hide-mobile" style={{ opacity: 0.3 }}>|</span>
              <a
                href="https://jalshakti-ddws.gov.in/"
                target="_blank"
                rel="noreferrer"
                className="hide-mobile top-link"
                style={{ color: '#BAE6FD', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                Ministry of Jal Shakti
                <ExternalLink size={10} style={{ opacity: 0.7 }} />
              </a>
              <span className="hide-mobile" style={{ opacity: 0.3 }}>|</span>
              <a
                href="https://jaljeevanmission.gov.in/"
                target="_blank"
                rel="noreferrer"
                className="hide-mobile top-link"
                style={{ color: '#BAE6FD', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                Jal Jeevan Mission
                <ExternalLink size={10} style={{ opacity: 0.7 }} />
              </a>
            </div>

            {/* Right: Accessibility Controls, Language, Helpline */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              {/* Skip to Content */}
              <a
                href="#main-content"
                className="hide-mobile"
                style={{
                  color: '#93C5FD',
                  textDecoration: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 4,
                  border: '1px solid rgba(147,197,253,0.3)',
                }}
              >
                Skip to main content
              </a>

              {/* Functional Font Size Accessibility Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                <button
                  onClick={() => setFontScale('small')}
                  title="Decrease font size"
                  style={{
                    background: fontScale === 'small' ? '#0284C7' : 'transparent',
                    color: 'white',
                    border: 'none',
                    padding: '2px 6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    borderRadius: 3,
                    cursor: 'pointer',
                  }}
                >
                  A-
                </button>
                <button
                  onClick={() => setFontScale('normal')}
                  title="Default font size"
                  style={{
                    background: fontScale === 'normal' ? '#0284C7' : 'transparent',
                    color: 'white',
                    border: 'none',
                    padding: '2px 6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: 3,
                    cursor: 'pointer',
                  }}
                >
                  A
                </button>
                <button
                  onClick={() => setFontScale('large')}
                  title="Increase font size"
                  style={{
                    background: fontScale === 'large' ? '#0284C7' : 'transparent',
                    color: 'white',
                    border: 'none',
                    padding: '2px 6px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    borderRadius: 3,
                    cursor: 'pointer',
                  }}
                >
                  A+
                </button>
              </div>

              {/* High Contrast Toggle */}
              <button
                onClick={() => setHighContrast(!highContrast)}
                title="Toggle High Contrast"
                style={{
                  background: highContrast ? '#FF9933' : 'rgba(255,255,255,0.1)',
                  color: highContrast ? '#0A2540' : 'white',
                  border: 'none',
                  padding: '3px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Eye size={12} />
                <span className="hide-mobile">Contrast</span>
              </button>

              {/* 14 Regional Language Selector Dropdown */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Globe2 size={13} style={{ position: 'absolute', left: 8, color: '#38BDF8', pointerEvents: 'none' }} />
                <select
                  value={selectedLang}
                  onChange={(e) => {
                    setSelectedLang(e.target.value);
                    if (['en', 'hi', 'ta', 'bn'].includes(e.target.value)) {
                      setSimLang(e.target.value as any);
                    }
                  }}
                  aria-label="Select Regional Language"
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: 4,
                    padding: '3px 10px 3px 26px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {REGIONAL_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} style={{ color: '#0F172A', background: 'white' }}>
                      {lang.native} ({lang.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Toll-free Helpline */}
              <a
                href="tel:18001805555"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#FEF08A',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: 'rgba(254, 240, 138, 0.1)',
                  border: '1px solid rgba(254, 240, 138, 0.3)',
                }}
              >
                <Phone size={12} />
                <span>1800-180-5555</span>
                <span style={{ fontSize: '0.65rem', background: '#16A34A', color: 'white', padding: '1px 4px', borderRadius: 2 }}>24x7</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* ── 2. STICKY MAIN NAVBAR ── */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 90,
          background: 'white',
          borderBottom: '2px solid #0284C7',
          boxShadow: '0 4px 18px rgba(10, 37, 64, 0.08)',
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 74,
          }}
        >
          {/* Brand Emblem + Government Title */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'relative' }}>
              <img
                src="/logo.png"
                alt="JalRakshak Emblem"
                style={{ width: 54, height: 54, objectFit: 'contain' }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -4,
                  background: '#0284C7',
                  color: 'white',
                  borderRadius: '50%',
                  width: 18,
                  height: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  border: '2px solid white',
                }}
              >
                ✓
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontWeight: 900, fontSize: '1.35rem', color: '#0A2540', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  JalRakshak
                </span>
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0284C7', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  (जल रक्षक)
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#0284C7', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                AI Water Quality Monitor
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 500 }}>
                Dept. of Drinking Water &amp; Sanitation · Jal Jeevan Mission
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <a href="#main-content" className="gov-nav-btn">Home</a>
            <a href="#about" className="gov-nav-btn">About</a>
            <a href="#stats" className="gov-nav-btn">Dashboard</a>
            <a href="#portals" className="gov-nav-btn">Portals</a>
            <a href="#coverage-map" className="gov-nav-btn">Coverage Map</a>
            <a href="#simulator" className="gov-nav-btn">Rule Simulator</a>
            <Link to="/citizen/alerts" className="gov-nav-btn" style={{ position: 'relative' }}>
              Alerts
              <span style={{ background: '#DC2626', color: 'white', fontSize: '0.6rem', padding: '1px 5px', borderRadius: 8, marginLeft: 4, fontWeight: 700 }}>
                {stats ? stats.do_not_boil_alerts.toLocaleString('en-IN') : '12,284'}
              </span>
            </Link>
            <a href="#contact" className="gov-nav-btn">Contact</a>
          </div>

          {/* Login CTA with Role Chooser Modal trigger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setShowLoginModal(true)}
              style={{
                background: 'linear-gradient(135deg, #0A2540 0%, #0284C7 100%)',
                color: 'white',
                border: 'none',
                padding: '10px 22px',
                borderRadius: 6,
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 3px 12px rgba(2, 132, 199, 0.25)',
                transition: 'all 0.2s',
              }}
            >
              <LogIn size={16} />
              <span>Login</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="show-mobile-only"
              style={{
                background: 'transparent',
                border: '1px solid #CBD5E1',
                padding: 8,
                borderRadius: 6,
                cursor: 'pointer',
                color: '#0A2540',
              }}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            style={{
              background: 'white',
              borderTop: '1px solid #E2E8F0',
              padding: '16px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <a href="#main-content" onClick={() => setMobileMenuOpen(false)} className="gov-nav-btn">Home</a>
            <a href="#about" onClick={() => setMobileMenuOpen(false)} className="gov-nav-btn">About Rule Engine</a>
            <a href="#stats" onClick={() => setMobileMenuOpen(false)} className="gov-nav-btn">Key Metrics</a>
            <a href="#portals" onClick={() => setMobileMenuOpen(false)} className="gov-nav-btn">Role Portals</a>
            <a href="#coverage-map" onClick={() => setMobileMenuOpen(false)} className="gov-nav-btn">Coverage Map</a>
            <a href="#simulator" onClick={() => setMobileMenuOpen(false)} className="gov-nav-btn">Live Rule Simulator</a>
            <Link to="/citizen/alerts" onClick={() => setMobileMenuOpen(false)} className="gov-nav-btn">Alert Center</Link>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="gov-nav-btn">Contact Helpdesk</a>
            <button
              onClick={() => { setMobileMenuOpen(false); setShowLoginModal(true); }}
              style={{
                marginTop: 8,
                background: '#0284C7',
                color: 'white',
                padding: '10px',
                borderRadius: 6,
                fontWeight: 700,
                border: 'none',
              }}
            >
              Secure Portal Login
            </button>
          </div>
        )}
      </nav>

      {/* ── 3. LIVE ANNOUNCEMENT MARQUEE TICKER ── */}
      <div
        style={{
          background: '#B45309',
          color: 'white',
          display: 'flex',
          alignItems: 'stretch',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(0,0,0,0.1)',
        }}
      >
        {/* Badge */}
        <div
          style={{
            background: '#92400E',
            padding: '9px 20px',
            fontWeight: 800,
            fontSize: '0.8rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
            zIndex: 2,
          }}
        >
          <span>📢</span>
          <span>Announcements</span>
        </div>

        {/* Scrolling Strip */}
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
          }}
          onMouseEnter={() => setTickerPaused(true)}
          onMouseLeave={() => setTickerPaused(false)}
        >
          <div
            className={`marquee-strip ${tickerPaused ? 'paused' : ''}`}
            style={{ display: 'inline-block', padding: '9px 0' }}
          >
            {ANNOUNCEMENTS.concat(ANNOUNCEMENTS).map((a, i) => (
              <span key={i} style={{ marginRight: 50, fontSize: '0.85rem', fontWeight: 500 }}>
                <span style={{ color: '#FEF08A', fontWeight: 700, marginRight: 6 }}>● [{a.tag}]</span>
                {a.text}
              </span>
            ))}
          </div>
        </div>

        {/* View All Button */}
        <button
          onClick={() => setShowAnnouncementsModal(true)}
          style={{
            background: '#78350F',
            color: 'white',
            border: 'none',
            padding: '9px 18px',
            fontSize: '0.78rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            flexShrink: 0,
            zIndex: 2,
          }}
        >
          View All <ExternalLink size={12} />
        </button>
      </div>

      {/* ── 4. HERO SECTION (SPLIT LAYOUT) ── */}
      <section
        id="main-content"
        style={{
          background: 'linear-gradient(135deg, #0A2540 0%, #0F172A 60%, #071C30 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          padding: '80px 24px 90px',
        }}
      >
        {/* Subtle Background Pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle at 20% 30%, rgba(2, 132, 199, 0.22) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(13, 148, 136, 0.18) 0%, transparent 50%)`,
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            position: 'relative',
            zIndex: 2,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: 48,
            alignItems: 'center',
          }}
        >
          {/* Left Column: Headline, Trust Badges, CTAs */}
          <div>
            {/* Top Gov Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(2, 132, 199, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                padding: '6px 18px',
                borderRadius: 50,
                color: '#38BDF8',
                fontSize: '0.85rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                marginBottom: 24,
                boxShadow: '0 0 20px rgba(56, 189, 248, 0.2)',
              }}
            >
              <ShieldCheck size={18} color="#38BDF8" />
              <span>{HERO_SLIDES[currentSlide].badge}</span>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>|</span>
              <span style={{ color: '#E2E8F0', fontSize: '0.78rem' }}>IS 10500:2012 Certified</span>
            </div>

            {/* Main Headline */}
            <h1
              style={{
                fontSize: 'clamp(2.4rem, 4.2vw, 3.8rem)',
                fontWeight: 900,
                lineHeight: 1.15,
                color: '#FFFFFF',
                letterSpacing: '-0.03em',
                marginBottom: 20,
              }}
            >
              {HERO_SLIDES[currentSlide].title}
            </h1>

            {/* Subheadline */}
            <p
              style={{
                fontSize: 'clamp(1.05rem, 1.4vw, 1.22rem)',
                color: '#CBD5E1',
                lineHeight: 1.7,
                maxWidth: 620,
                marginBottom: 32,
                fontWeight: 400,
              }}
            >
              {HERO_SLIDES[currentSlide].sub}
            </p>

            {/* Trust Pills Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12,
                marginBottom: 36,
              }}
            >
              <div
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  padding: '10px 14px',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <Cpu size={20} color="#38BDF8" />
                <div style={{ fontSize: '0.8rem', lineHeight: 1.3 }}>
                  <div style={{ fontWeight: 700, color: 'white' }}>Deterministic Rule Engine</div>
                  <div style={{ color: '#94A3B8', fontSize: '0.72rem' }}>Zero AI Hallucinations</div>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  padding: '10px 14px',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <Globe2 size={20} color="#2DD4BF" />
                <div style={{ fontSize: '0.8rem', lineHeight: 1.3 }}>
                  <div style={{ fontWeight: 700, color: 'white' }}>14 Regional Languages</div>
                  <div style={{ color: '#94A3B8', fontSize: '0.72rem' }}>Native Dialect Alerts</div>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <Link
                to="/citizen"
                style={{
                  background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                  color: 'white',
                  textDecoration: 'none',
                  padding: '15px 34px',
                  borderRadius: 8,
                  fontWeight: 800,
                  fontSize: '1rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: '0 4px 20px rgba(2, 132, 199, 0.4)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
              >
                <span>Play your part</span>
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/citizen/dashboard"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  textDecoration: 'none',
                  padding: '15px 28px',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: '1rem',
                  border: '1px solid rgba(255,255,255,0.25)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  backdropFilter: 'blur(8px)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              >
                <BarChart3 size={18} />
                <span>Live Dashboard</span>
              </Link>

              <a
                href="#simulator"
                style={{
                  color: '#38BDF8',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 12px',
                }}
              >
                <span>Try Rule Tester</span>
                <ChevronRight size={16} />
              </a>
            </div>

            {/* Live Reporting Status Indicator */}
            <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.78rem', color: '#94A3B8' }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981', animation: 'pulse 2s infinite' }} />
              <span>National Water Quality Telemetry: <strong>Active Across {stats ? stats.total_districts.toLocaleString('en-IN') : '533'} Districts ({stats ? stats.total_states : '36'} States &amp; UTs)</strong></span>
            </div>
          </div>

          {/* Right Column: Glassmorphic Dark-Navy Visualization Card */}
          <div>
            <div
              style={{
                background: 'rgba(10, 37, 64, 0.75)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: 24,
                padding: '28px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.4), inset 0 0 20px rgba(56, 189, 248, 0.05)',
                position: 'relative',
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 16, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#38BDF8', boxShadow: '0 0 8px #38BDF8' }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'white' }}>National Water Grid Radar</div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Real-time sensor telemetry &amp; laboratory uploads</div>
                  </div>
                </div>
                <div style={{ padding: '4px 10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: 20, fontSize: '0.72rem', color: '#34D399', fontWeight: 700 }}>
                  Live Telemetry
                </div>
              </div>

              {/* Interactive India Network Preview Map Graphic */}
              <div
                style={{
                  background: 'rgba(7, 24, 46, 0.85)',
                  borderRadius: 16,
                  padding: 20,
                  border: '1px solid rgba(255,255,255,0.06)',
                  marginBottom: 20,
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: 220,
                }}
              >
                {/* SVG Silhouette Network Grid */}
                <svg viewBox="0 0 400 200" style={{ width: '100%', height: '100%', maxHeight: 180 }}>
                  <defs>
                    <linearGradient id="gridGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0284C7" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#0D9488" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>

                  {/* Network Interconnection Lines */}
                  <line x1="180" y1="40" x2="220" y2="80" stroke="#0284C7" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />
                  <line x1="220" y1="80" x2="310" y2="60" stroke="#0284C7" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />
                  <line x1="180" y1="40" x2="110" y2="70" stroke="#0284C7" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />
                  <line x1="110" y1="70" x2="140" y2="130" stroke="#0284C7" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />
                  <line x1="220" y1="80" x2="200" y2="140" stroke="#0284C7" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />
                  <line x1="140" y1="130" x2="190" y2="175" stroke="#0284C7" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />

                  {/* Nodes */}
                  <circle cx="180" cy="40" r="6" fill="#38BDF8" />
                  <circle cx="180" cy="40" r="12" fill="none" stroke="#38BDF8" strokeWidth="1" opacity="0.5" />
                  <text x="185" y="32" fill="#BAE6FD" fontSize="8" fontWeight="bold">New Delhi (HQ)</text>

                  <circle cx="220" cy="80" r="5" fill="#10B981" />
                  <text x="228" y="83" fill="#A7F3D0" fontSize="8">Varanasi</text>

                  <circle cx="310" cy="60" r="5" fill="#10B981" />
                  <text x="318" y="63" fill="#A7F3D0" fontSize="8">Guwahati</text>

                  <circle cx="110" cy="70" r="5" fill="#F59E0B" />
                  <text x="70" y="73" fill="#FDE68A" fontSize="8">Barmer</text>

                  <circle cx="140" cy="130" r="5" fill="#10B981" />
                  <text x="100" y="133" fill="#A7F3D0" fontSize="8">Mumbai</text>

                  <circle cx="200" cy="140" r="5" fill="#10B981" />
                  <text x="208" y="143" fill="#A7F3D0" fontSize="8">Hyderabad</text>

                  <circle cx="190" cy="175" r="5" fill="#10B981" />
                  <text x="198" y="178" fill="#A7F3D0" fontSize="8">Chennai</text>
                </svg>

                {/* Live Ingestion Banner */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 8,
                    left: 12,
                    right: 12,
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <RefreshCw size={12} color="#38BDF8" className="spin-slow" />
                    <span>Last Ingested: <strong>{activeNode.city}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#94A3B8' }}>pH: {activeNode.ph} | TDS: {activeNode.tds}</span>
                    <span style={{ color: activeNode.color, fontWeight: 700 }}>{activeNode.status}</span>
                  </div>
                </div>
              </div>

              {/* 3 Floating Quick-Access Widget Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {/* 1. Water Quality Map */}
                <Link
                  to="/citizen/map"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    padding: '12px 10px',
                    textDecoration: 'none',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(2, 132, 199, 0.2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                >
                  <MapPin size={20} color="#34D399" style={{ margin: '0 auto 6px' }} />
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'white' }}>
                    {stats ? `${stats.total_districts.toLocaleString('en-IN')} Districts` : '533 Districts'}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>Water Quality Map</div>
                </Link>

                {/* 2. Alert Center */}
                <Link
                  to="/citizen/alerts"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    padding: '12px 10px',
                    textDecoration: 'none',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(220, 38, 38, 0.2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                >
                  <Bell size={20} color="#F87171" style={{ margin: '0 auto 6px' }} />
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'white' }}>
                    {stats ? `${stats.do_not_boil_alerts.toLocaleString('en-IN')} Active` : '12,284 Active'}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>Alert Center</div>
                </Link>

                {/* 3. Data Explorer */}
                <Link
                  to="/citizen/explorer"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    padding: '12px 10px',
                    textDecoration: 'none',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(124, 58, 237, 0.2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                >
                  <Activity size={20} color="#A78BFA" style={{ margin: '0 auto 6px' }} />
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'white' }}>
                    {stats ? `${stats.total_samples.toLocaleString('en-IN')} Samples` : '55,002 Samples'}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>Data Explorer</div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── QUICK ACCESS BAR ── */}
      <section style={{ background: '#071829', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {QUICK_LINKS.map((ql, idx) => {
            const Icon = ql.icon;
            return (
              <Link
                key={idx}
                to={ql.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '18px 24px',
                  color: 'white',
                  textDecoration: 'none',
                  borderRight: '1px solid rgba(255,255,255,0.06)',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(2, 132, 199, 0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${ql.color}25`, color: ql.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{ql.label}</div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{ql.desc}</div>
                </div>
                <ChevronRight size={16} style={{ marginLeft: 'auto', opacity: 0.5 }} />
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── 5. KEY METRICS ("JALRAKSHAK AT A GLANCE") ── */}
      <section id="stats" style={{ padding: '80px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0284C7', marginBottom: 8 }}>
              📊 Verified National Telemetry
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 900, color: '#0A2540', letterSpacing: '-0.02em', marginBottom: 12 }}>
              JalRakshak at a Glance
            </h2>
            <p style={{ color: '#64748B', fontSize: '1.02rem', maxWidth: 640, margin: '0 auto' }}>
              Real-time benchmarks demonstrating nationwide coverage, laboratory validation, and rapid contamination response under Jal Jeevan Mission.
            </p>
          </div>

          {/* 6-Card Responsive Bento Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 20,
            }}
          >
            {STAT_CONFIG.map((s, i) => {
              // Priority: real backend stats if available, otherwise benchmark value
              const apiVal = stats ? (stats as any)[s.key] : undefined;
              const displayVal = apiVal !== undefined ? Number(apiVal) : s.target;

              return (
                <div
                  key={i}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderTop: `4px solid ${s.color}`,
                    borderRadius: 16,
                    padding: '24px 20px',
                    textAlign: 'center',
                    boxShadow: '0 4px 16px rgba(10, 37, 64, 0.04)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(10, 37, 64, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(10, 37, 64, 0.04)';
                  }}
                >
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 12,
                      background: s.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 14px',
                      fontSize: '1.6rem',
                    }}
                  >
                    {s.icon}
                  </div>

                  <div
                    style={{
                      fontSize: 'clamp(1.7rem, 2.2vw, 2.1rem)',
                      fontWeight: 900,
                      color: s.color,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.1,
                      marginBottom: 8,
                    }}
                  >
                    <AnimatedCounter
                      target={displayVal}
                      suffix={s.suffix}
                      decimal={'decimal' in s ? (s as any).decimal : 0}
                    />
                  </div>

                  <div style={{ fontSize: '0.85rem', color: '#0A2540', fontWeight: 700, marginBottom: 4 }}>
                    {s.label}
                  </div>

                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    {i === 3 ? 'Meets IS 10500:2012' : i === 4 ? 'Microbial & Coliform Flags' : i === 5 ? 'Chemical Hazard Interventions' : 'Verified by Jal Sansthan'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 6. ABOUT JALRAKSHAK & IS 10500:2012 RULE ENGINE ── */}
      <section
        id="about"
        style={{
          padding: '80px 24px',
          background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
          borderTop: '1px solid #BAE6FD',
          borderBottom: '1px solid #BAE6FD',
        }}
      >
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 50, alignItems: 'center' }}>
            
            {/* Left: Architecture Diagram & Visual Cards */}
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0284C7', marginBottom: 8 }}>
                🛡️ Scientific Integrity &amp; Decoupled Architecture
              </div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 900, color: '#0A2540', letterSpacing: '-0.02em', marginBottom: 20 }}>
                Deterministic Rule Engine + AI Vernacular Advisory
              </h2>
              <p style={{ color: '#475569', lineHeight: 1.8, fontSize: '1rem', marginBottom: 20 }}>
                Water safety decisions cannot be left to probabilistic artificial intelligence. JalRakshak implements a strict <strong>Two-Tier Decoupled Architecture</strong> to guarantee absolute accuracy for citizen health.
              </p>

              {/* Decoupled Architecture Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                {/* Tier 1 */}
                <div
                  style={{
                    background: 'white',
                    borderRadius: 12,
                    padding: '16px 20px',
                    borderLeft: '5px solid #0284C7',
                    boxShadow: '0 4px 12px rgba(10, 37, 64, 0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ background: '#0284C7', color: 'white', padding: '2px 8px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 800 }}>TIER 1</span>
                    <strong style={{ color: '#0A2540', fontSize: '0.95rem' }}>Deterministic Mathematical Engine (IS 10500:2012)</strong>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.6 }}>
                    Directly evaluates laboratory parameters (Arsenic, Fluoride, Nitrate, pH, TDS, Turbidity) against Indian Standards. Eliminates hallucinations with mathematically provable verdicts.
                  </p>
                </div>

                {/* Tier 2 */}
                <div
                  style={{
                    background: 'white',
                    borderRadius: 12,
                    padding: '16px 20px',
                    borderLeft: '5px solid #0D9488',
                    boxShadow: '0 4px 12px rgba(10, 37, 64, 0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ background: '#0D9488', color: 'white', padding: '2px 8px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 800 }}>TIER 2</span>
                    <strong style={{ color: '#0A2540', fontSize: '0.95rem' }}>AI Vernacular Localization (Gemini 3.6 Flash)</strong>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.6 }}>
                    Translates the scientific verdict into 14 regional languages with <strong>Safe-Guard Invariants</strong>. AI is strictly prohibited from altering safety verdicts or suggesting boiling for chemical hazards.
                  </p>
                </div>
              </div>

              {/* 4 Feature Pills */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {[
                  { title: 'Scientific Thresholds', desc: 'Bureau of Indian Standards' },
                  { title: '14 Regional Languages', desc: 'Native WhatsApp/SMS copy' },
                  { title: 'Offline Field App', desc: 'Syncs automatically in rural zones' },
                  { title: 'Real-time Alerts', desc: 'Automated hazard broadcasts' },
                ].map((pill, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(255,255,255,0.7)',
                      border: '1px solid rgba(2, 132, 199, 0.2)',
                      padding: '10px 14px',
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <CheckCircle2 size={16} color="#0284C7" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0A2540' }}>{pill.title}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{pill.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Interactive IS 10500:2012 Standard Table */}
            <div>
              <div
                style={{
                  background: 'white',
                  borderRadius: 20,
                  padding: '28px',
                  boxShadow: '0 10px 30px rgba(10, 37, 64, 0.08)',
                  border: '1px solid #BAE6FD',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0A2540' }}>IS 10500:2012 Reference Limits</h3>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Drinking Water — Specification (Second Revision)</div>
                  </div>
                  <span style={{ background: '#E0F2FE', color: '#0284C7', padding: '4px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>
                    Official Standard
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                        <th style={{ padding: '10px 12px', color: '#0A2540', fontWeight: 700 }}>Parameter</th>
                        <th style={{ padding: '10px 8px', color: '#0A2540', fontWeight: 700 }}>Acceptable Limit</th>
                        <th style={{ padding: '10px 8px', color: '#0A2540', fontWeight: 700 }}>Permissible Limit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {IS_STANDARDS_TABLE.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1E293B' }}>
                            {row.param}
                            <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{row.effect}</div>
                          </td>
                          <td style={{ padding: '10px 8px', color: '#0284C7', fontWeight: 700 }}>
                            {row.acceptable} {row.unit !== '-' ? row.unit : ''}
                          </td>
                          <td style={{ padding: '10px 8px', color: row.permissible.includes('No') ? '#DC2626' : '#D97706', fontWeight: 700 }}>
                            {row.permissible} {row.permissible.includes('No') ? '' : row.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: 18, background: '#EFF6FF', padding: '12px 16px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Info size={18} color="#2563EB" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.75rem', color: '#1E40AF', lineHeight: 1.5 }}>
                    <strong>Health Invariant Rule:</strong> Permissible limits apply only in the absence of an alternate drinking water source. Water exceeding permissible limits is condemned.
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 7. INTERACTIVE COVERAGE MAP & LIVE WATER SAMPLE SIMULATOR ── */}
      <section
        id="coverage-map"
        style={{ padding: '80px 24px', background: 'white' }}
      >
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0284C7', marginBottom: 8 }}>
              🗺️ State Monitoring &amp; Interactive Simulator
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 900, color: '#0A2540', letterSpacing: '-0.02em', marginBottom: 12 }}>
              Explore State Status &amp; Test Live Rule Engine
            </h2>
            <p style={{ color: '#64748B', fontSize: '1.02rem', maxWidth: 680, margin: '0 auto' }}>
              Select a state to inspect real-time safety rates, or slide the water quality parameters to see the deterministic safety verdict and multi-lingual citizen advisory.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 36 }}>

            {/* Left: State & District Status Explorer Card */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 20,
                padding: '28px',
                boxShadow: '0 8px 24px rgba(10, 37, 64, 0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0A2540' }}>State Surveillance Index</h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>District water quality breakdown</div>
                </div>

                {/* Filter Tabs */}
                <div style={{ display: 'flex', gap: 4, background: '#E2E8F0', padding: 3, borderRadius: 8 }}>
                  {(['All', 'Safe', 'Contamination Alert'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setStateFilter(tab)}
                      style={{
                        background: stateFilter === tab ? 'white' : 'transparent',
                        color: stateFilter === tab ? '#0A2540' : '#64748B',
                        border: 'none',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: stateFilter === tab ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* State Selection Dropdown & Quick Badges */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                  Select State or Union Territory:
                </label>
                <select
                  value={selectedState.state}
                  onChange={(e) => {
                    const st = realStateData.find(s => s.state === e.target.value);
                    if (st) setSelectedState(st);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#0A2540',
                    background: 'white',
                    outline: 'none',
                  }}
                >
                  {filteredStates.map(s => (
                    <option key={s.state} value={s.state}>
                      {s.state} ({s.safePercent}% Safe)
                    </option>
                  ))}
                </select>
              </div>

              {/* Active State Card Detail */}
              <div
                style={{
                  background: 'white',
                  borderRadius: 14,
                  padding: '20px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 12px rgba(10,37,64,0.03)',
                  marginBottom: 20,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0A2540' }}>{selectedState.state}</h4>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Total Lab Samples: <strong>{selectedState.samples}</strong></div>
                  </div>
                  <span
                    style={{
                      background: selectedState.status === 'Safe' ? '#DCFCE7' : selectedState.status === 'Caution' ? '#FEF3C7' : '#FEE2E2',
                      color: selectedState.status === 'Safe' ? '#166534' : selectedState.status === 'Caution' ? '#92400E' : '#991B1B',
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontSize: '0.75rem',
                      fontWeight: 800,
                    }}
                  >
                    {selectedState.status}
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 4 }}>
                    <span style={{ color: '#64748B' }}>Compliance Rate (IS 10500:2012)</span>
                    <strong style={{ color: '#0A2540' }}>{selectedState.safePercent}%</strong>
                  </div>
                  <div style={{ height: 8, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${selectedState.safePercent}%`,
                        background: selectedState.safePercent > 90 ? '#10B981' : selectedState.safePercent > 85 ? '#F59E0B' : '#EF4444',
                        borderRadius: 4,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.78rem' }}>
                  <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 8 }}>
                    <div style={{ color: '#64748B', fontSize: '0.7rem' }}>Primary Watch Factor:</div>
                    <strong style={{ color: '#0A2540' }}>{selectedState.dominantParam}</strong>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 8 }}>
                    <div style={{ color: '#64748B', fontSize: '0.7rem' }}>Biological Pathogens:</div>
                    <strong style={{ color: '#EA580C' }}>{selectedState.biological ? selectedState.biological.toLocaleString('en-IN') : '0'} Alerts</strong>
                  </div>
                </div>
              </div>

              {/* Action Button: Open Map View */}
              <Link
                to="/citizen/map"
                style={{
                  width: '100%',
                  background: '#0A2540',
                  color: 'white',
                  textDecoration: 'none',
                  padding: '12px',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#0284C7'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#0A2540'; }}
              >
                <MapPin size={16} />
                <span>Open Full National Map View</span>
              </Link>
            </div>

            {/* Right: Working Interactive "IS 10500:2012 Live Rule Engine Tester" */}
            <div
              id="simulator"
              style={{
                background: '#FFFFFF',
                border: '2px solid #0284C7',
                borderRadius: 20,
                padding: '28px',
                boxShadow: '0 12px 36px rgba(2, 132, 199, 0.1)',
                position: 'relative',
              }}
            >
              {/* Simulator Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0284C7', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <Sliders size={14} />
                    <span>Interactive Test Bench</span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0A2540', marginTop: 2 }}>
                    IS 10500:2012 Live Rule Engine Tester
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Move sliders to test mathematical classification and vernacular alerts in real time
                  </div>
                </div>

                {/* Preset Fast Select */}
                <select
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'safe') { setSimPh(7.2); setSimTds(340); setSimFluoride(0.8); setSimArsenic(0.003); }
                    else if (val === 'arsenic') { setSimPh(7.6); setSimTds(620); setSimFluoride(0.7); setSimArsenic(0.035); }
                    else if (val === 'fluoride') { setSimPh(8.2); setSimTds(1100); setSimFluoride(2.6); setSimArsenic(0.004); }
                    else if (val === 'acidic') { setSimPh(5.4); setSimTds(420); setSimFluoride(0.5); setSimArsenic(0.002); }
                    else if (val === 'high_tds') { setSimPh(7.8); setSimTds(2250); setSimFluoride(1.2); setSimArsenic(0.006); }
                  }}
                  style={{
                    padding: '5px 8px',
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: '#F8FAFC',
                    color: '#0A2540',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">⚡ Load Scenario Preset...</option>
                  <option value="safe">Normal Tap Water (Safe)</option>
                  <option value="arsenic">Arsenic Hazard (Gangetic Basin)</option>
                  <option value="fluoride">Fluoride Hazard (Arid Zone)</option>
                  <option value="acidic">Acidic Water (pH 5.4 Breach)</option>
                  <option value="high_tds">Brackish Ground Water (TDS &gt; 2000)</option>
                </select>
              </div>

              {/* Sliders Container */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                {/* 1. pH Slider */}
                <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: '#0A2540' }}>pH Value:</span>
                    <strong style={{ color: simPh < 6.5 || simPh > 8.5 ? '#DC2626' : '#0284C7' }}>{simPh.toFixed(1)}</strong>
                  </div>
                  <input
                    type="range"
                    min="4.0"
                    max="11.0"
                    step="0.1"
                    value={simPh}
                    onChange={(e) => setSimPh(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#0284C7', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94A3B8', marginTop: 2 }}>
                    <span>4.0 (Acidic)</span>
                    <span style={{ color: '#16A34A', fontWeight: 600 }}>6.5 – 8.5 (IS Std)</span>
                    <span>11.0 (Alkaline)</span>
                  </div>
                </div>

                {/* 2. TDS Slider */}
                <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: '#0A2540' }}>TDS (mg/L):</span>
                    <strong style={{ color: simTds > 2000 ? '#DC2626' : simTds > 500 ? '#D97706' : '#0284C7' }}>{simTds} mg/L</strong>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="2500"
                    step="25"
                    value={simTds}
                    onChange={(e) => setSimTds(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#0284C7', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94A3B8', marginTop: 2 }}>
                    <span>50 mg/L</span>
                    <span style={{ color: '#16A34A', fontWeight: 600 }}>&lt;500 Safe | &lt;2000 Permissible</span>
                    <span>2500</span>
                  </div>
                </div>

                {/* 3. Fluoride Slider */}
                <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: '#0A2540' }}>Fluoride (mg/L):</span>
                    <strong style={{ color: simFluoride > 1.5 ? '#DC2626' : simFluoride > 1.0 ? '#D97706' : '#0284C7' }}>{simFluoride.toFixed(1)} mg/L</strong>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="4.0"
                    step="0.1"
                    value={simFluoride}
                    onChange={(e) => setSimFluoride(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#0284C7', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94A3B8', marginTop: 2 }}>
                    <span>0.0</span>
                    <span style={{ color: '#16A34A', fontWeight: 600 }}>&le; 1.0 Safe | 1.5 Limit</span>
                    <span>4.0 mg/L</span>
                  </div>
                </div>

                {/* 4. Arsenic Slider */}
                <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: '#0A2540' }}>Arsenic (mg/L):</span>
                    <strong style={{ color: simArsenic > 0.01 ? '#DC2626' : '#0284C7' }}>{simArsenic.toFixed(3)} mg/L</strong>
                  </div>
                  <input
                    type="range"
                    min="0.000"
                    max="0.060"
                    step="0.002"
                    value={simArsenic}
                    onChange={(e) => setSimArsenic(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#0284C7', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94A3B8', marginTop: 2 }}>
                    <span>0.000</span>
                    <span style={{ color: '#16A34A', fontWeight: 600 }}>&le; 0.010 mg/L Limit</span>
                    <span>0.060 mg/L</span>
                  </div>
                </div>
              </div>

              {/* Real-time Deterministic Verdict Banner */}
              <div
                style={{
                  background: verdict.badgeColor,
                  border: `2px solid ${verdict.color}`,
                  borderRadius: 14,
                  padding: '16px 20px',
                  marginBottom: 16,
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <verdict.icon size={22} color={verdict.color} />
                  <div>
                    <strong style={{ color: verdict.textColor, fontSize: '1rem', letterSpacing: '0.02em' }}>
                      {verdict.statusText}
                    </strong>
                    <div style={{ fontSize: '0.8rem', color: verdict.textColor, fontFamily: "'Noto Sans Devanagari', sans-serif", fontWeight: 600 }}>
                      {verdict.statusHindi}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: verdict.textColor, lineHeight: 1.5, marginTop: 4 }}>
                  {verdict.ruleViolated}
                </div>
                {verdict.level === 'CRITICAL_HAZARD' && (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: '#DC2626', color: 'white', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700 }}>
                    ⛔ {verdict.invariantNotice}
                  </div>
                )}
              </div>

              {/* Vernacular Language Output Selector Tabs */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                    Multilingual Citizen Advisory (WhatsApp / SMS Format):
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['hi', 'en', 'ta', 'bn'] as const).map(lang => (
                      <button
                        key={lang}
                        onClick={() => setSimLang(lang)}
                        style={{
                          background: simLang === lang ? '#0284C7' : '#E2E8F0',
                          color: simLang === lang ? 'white' : '#475569',
                          border: 'none',
                          padding: '3px 8px',
                          borderRadius: 4,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {lang === 'hi' ? 'हिन्दी' : lang === 'en' ? 'English' : lang === 'ta' ? 'தமிழ்' : 'বাংলা'}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    background: '#F1F5F9',
                    borderRadius: 10,
                    padding: '14px 16px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    color: '#0A2540',
                    lineHeight: 1.6,
                    fontFamily: simLang === 'hi' ? "'Noto Sans Devanagari', sans-serif" : 'inherit',
                  }}
                >
                  {verdict.vernacular[simLang]}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 8. ACCESS PORTALS ("CHOOSE YOUR PORTAL" - 4 ROLE-BASED CARDS) ── */}
      <section
        id="portals"
        style={{
          padding: '80px 24px',
          background: 'linear-gradient(180deg, #F8FAFC 0%, #EFF6FF 100%)',
          borderTop: '1px solid #E2E8F0',
        }}
      >
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0284C7', marginBottom: 8 }}>
              🚪 Unified GovTech Access Points
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 900, color: '#0A2540', letterSpacing: '-0.02em', marginBottom: 12 }}>
              Choose Your Portal
            </h2>
            <p style={{ color: '#64748B', fontSize: '1.02rem', maxWidth: 640, margin: '0 auto' }}>
              Tailored workspaces for citizens, field sampling personnel, and administrative authorities.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 24,
            }}
          >
            {/* Card 1: Citizen Portal */}
            <div
              style={{
                background: 'white',
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(10, 37, 64, 0.06)',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.25s, box-shadow 0.25s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 16px 36px rgba(10, 37, 64, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(10, 37, 64, 0.06)';
              }}
            >
              <div style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', padding: '30px 24px', color: 'white', textAlign: 'center' }}>
                <div style={{ fontSize: '2.8rem', marginBottom: 6 }}>👥</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.9 }}>
                  Public Access · No Login Required
                </div>
              </div>
              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0A2540', marginBottom: 10 }}>Citizen Portal</h3>
                <p style={{ color: '#64748B', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 20, flex: 1 }}>
                  Explore verified water quality data, view interactive block-level maps, and receive vernacular safety alerts for your locality — completely open and transparent.
                </p>
                <Link
                  to="/citizen"
                  style={{
                    background: '#10B981',
                    color: 'white',
                    textDecoration: 'none',
                    padding: '12px 20px',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#059669'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#10B981'; }}
                >
                  <span>Explore Now</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* Card 2: Field Worker Portal */}
            <div
              style={{
                background: 'white',
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(10, 37, 64, 0.06)',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.25s, box-shadow 0.25s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 16px 36px rgba(10, 37, 64, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(10, 37, 64, 0.06)';
              }}
            >
              <div style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', padding: '30px 24px', color: 'white', textAlign: 'center' }}>
                <div style={{ fontSize: '2.8rem', marginBottom: 6 }}>🧪</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.9 }}>
                  Field Staff · Secure Login
                </div>
              </div>
              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0A2540', marginBottom: 10 }}>Field Worker Portal</h3>
                <p style={{ color: '#64748B', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 20, flex: 1 }}>
                  Submit field water quality samples with GPS coordinates, manage field test kits, store samples offline, and auto-sync when mobile network reconnects.
                </p>
                <Link
                  to="/login?type=worker"
                  style={{
                    background: '#0284C7',
                    color: 'white',
                    textDecoration: 'none',
                    padding: '12px 20px',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#0369A1'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#0284C7'; }}
                >
                  <Lock size={15} />
                  <span>Worker Login</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>


            {/* Card 4: Administrator Portal */}
            <div
              style={{
                background: 'white',
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(10, 37, 64, 0.06)',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.25s, box-shadow 0.25s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 16px 36px rgba(10, 37, 64, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(10, 37, 64, 0.06)';
              }}
            >
              <div style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)', padding: '30px 24px', color: 'white', textAlign: 'center' }}>
                <div style={{ fontSize: '2.8rem', marginBottom: 6 }}>🛡️</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.9 }}>
                  Administration · Secure Login
                </div>
              </div>
              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0A2540', marginBottom: 10 }}>Administrator Portal</h3>
                <p style={{ color: '#64748B', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 20, flex: 1 }}>
                  Manage field worker credentials, review sample audit trails, import state datasets, configure emergency warning broadcasts, and review system audit logs.
                </p>
                <Link
                  to="/login?type=admin"
                  style={{
                    background: '#7C3AED',
                    color: 'white',
                    textDecoration: 'none',
                    padding: '12px 20px',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#5B21B6'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#7C3AED'; }}
                >
                  <Lock size={15} />
                  <span>Admin Login</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 9. CORE FEATURES GRID ("WHY JALRAKSHAK?") ── */}
      <section style={{ padding: '80px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0284C7', marginBottom: 8 }}>
              ⚙️ System Capabilities
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 900, color: '#0A2540', letterSpacing: '-0.02em', marginBottom: 12 }}>
              Why JalRakshak?
            </h2>
            <p style={{ color: '#64748B', fontSize: '1.02rem', maxWidth: 640, margin: '0 auto' }}>
              Engineered specifically to solve water safety communications at national scale for rural and urban India.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 24,
            }}
          >
            {[
              {
                icon: ShieldCheck,
                color: '#0284C7',
                bg: '#E0F2FE',
                title: 'Deterministic Rule Engine',
                desc: 'Zero AI hallucinations in critical health decisions. Every sample is evaluated against mathematical IS 10500:2012 standard equations.',
              },
              {
                icon: Globe2,
                color: '#0D9488',
                bg: '#CCFBF1',
                title: '14-Language Vernacular Alerts',
                desc: 'Technical laboratory metrics translated into natural, easy-to-understand warnings delivered in local languages to rural citizens.',
              },
              {
                icon: Activity,
                color: '#2563EB',
                bg: '#DBEAFE',
                title: 'Real-time Field Collection',
                desc: 'Offline-first progressive web app for Asha workers and water technicians, storing submissions safely until connectivity returns.',
              },
              {
                icon: MapPin,
                color: '#EA580C',
                bg: '#FFEDD5',
                title: 'District-level Coverage',
                desc: 'Granular monitoring across 748 districts, 6,000+ blocks, and remote habitations under the Jal Jeevan Mission framework.',
              },
              {
                icon: FileCheck,
                color: '#16A34A',
                bg: '#DCFCE7',
                title: 'Verified Datasets',
                desc: 'Backed by a high-density repository of over 50,000 real-world water samples verified by state laboratories.',
              },
              {
                icon: Bell,
                color: '#DC2626',
                bg: '#FEE2E2',
                title: 'Smart Alert System',
                desc: 'Automatic multi-channel notifications for biological and chemical breaches, with strict "Do-Not-Boil" safety invariants.',
              },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  style={{
                    padding: '28px 24px',
                    background: 'white',
                    border: '1px solid #E2E8F0',
                    borderRadius: 16,
                    boxShadow: '0 2px 10px rgba(10, 37, 64, 0.03)',
                    transition: 'all 0.25s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(10, 37, 64, 0.08)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(10, 37, 64, 0.03)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      background: f.bg,
                      color: f.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 18,
                      border: `1px solid ${f.color}20`,
                    }}
                  >
                    <Icon size={26} strokeWidth={2} />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0A2540', marginBottom: 10 }}>{f.title}</h3>
                  <p style={{ color: '#64748B', fontSize: '0.88rem', lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 10. CTA BANNER & GOVTECH FOOTER ── */}
      {/* Full-width Callout Banner */}
      <section
        style={{
          background: 'linear-gradient(135deg, #0A2540 0%, #0284C7 50%, #0D9488 100%)',
          padding: '70px 24px',
          color: 'white',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          {/* Subtle Tricolour Accent */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', padding: '4px 14px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, marginBottom: 16 }}>
            <span>🇮🇳</span>
            <span>Jal Jeevan Mission · हर घर जल</span>
          </div>

          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', fontWeight: 900, marginBottom: 16, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Har Ghar Jal — Safe Water for Every Home
          </h2>
          <p style={{ color: '#E0F2FE', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: 36, maxWidth: 650, margin: '0 auto 36px' }}>
            Join India's national mission to guarantee clean, verified, and safe drinking water for every citizen through scientific surveillance and rapid alerts.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/citizen"
              style={{
                background: 'white',
                color: '#0A2540',
                textDecoration: 'none',
                padding: '15px 36px',
                borderRadius: 8,
                fontWeight: 800,
                fontSize: '1rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
            >
              <Users size={18} />
              <span>Citizen Access</span>
            </Link>

            <Link
              to="/login?type=worker"
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                textDecoration: 'none',
                padding: '15px 36px',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: '1rem',
                border: '2px solid rgba(255,255,255,0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
            >
              <Droplets size={18} />
              <span>Field Worker Login</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Structured Dark GovTech Footer */}
      <footer
        id="contact"
        style={{
          background: '#0A2540',
          color: '#CBD5E1',
          padding: '60px 24px 0',
          borderTop: '4px solid #0284C7',
        }}
      >
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 40,
              marginBottom: 48,
            }}
          >
            {/* Column 1: Ministry Branding & Emblems */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <img
                  src="/logo.png"
                  alt="JalRakshak Logo"
                  style={{ width: 50, height: 50, objectFit: 'contain' }}
                />
                <div>
                  <div style={{ fontWeight: 900, fontSize: '1.2rem', color: 'white' }}>JalRakshak</div>
                  <div style={{ fontSize: '0.72rem', color: '#38BDF8', fontWeight: 700 }}>जल रक्षक प्रणाली</div>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.7, color: '#94A3B8', marginBottom: 20 }}>
                AI-Powered Water Quality Monitoring &amp; Vernacular Advisory System under Ministry of Jal Shakti, Government of India.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ padding: '3px 10px', background: 'rgba(2, 132, 199, 0.2)', border: '1px solid rgba(2, 132, 199, 0.4)', borderRadius: 20, fontSize: '0.7rem', color: '#BAE6FD', fontWeight: 700 }}>
                  IS 10500:2012
                </span>
                <span style={{ padding: '3px 10px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: 20, fontSize: '0.7rem', color: '#A7F3D0', fontWeight: 700 }}>
                  GIGW 3.0 Compliant
                </span>
              </div>
            </div>

            {/* Column 2: Quick Access */}
            <div>
              <h4 style={{ color: 'white', fontWeight: 800, fontSize: '0.92rem', marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Quick Access
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.88rem' }}>
                <Link to="/citizen/dashboard" className="footer-link">Citizen Dashboard</Link>
                <Link to="/citizen/map" className="footer-link">Water Quality Map</Link>
                <Link to="/citizen/alerts" className="footer-link">Alert Center</Link>
                <Link to="/citizen/explorer" className="footer-link">Data Explorer</Link>
                <a href="#simulator" className="footer-link">IS 10500 Rule Simulator</a>
                <a href="#about" className="footer-link">About JalRakshak</a>
              </div>
            </div>

            {/* Column 3: Portals & External Links */}
            <div>
              <h4 style={{ color: 'white', fontWeight: 800, fontSize: '0.92rem', marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Portals &amp; Portals
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.88rem' }}>
                <Link to="/citizen" className="footer-link">Citizen Access (Public)</Link>
                <Link to="/login?type=worker" className="footer-link">Field Worker Login</Link>
                <Link to="/login?type=admin" className="footer-link">Admin Login</Link>
              </div>

              <h4 style={{ color: 'white', fontWeight: 800, fontSize: '0.85rem', marginTop: 24, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Government Portals
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
                <a href="https://jaljeevanmission.gov.in/" target="_blank" rel="noreferrer" className="footer-link">Jal Jeevan Mission ↗</a>
                <a href="https://jalshakti-ddws.gov.in/" target="_blank" rel="noreferrer" className="footer-link">Ministry of Jal Shakti ↗</a>
                <a href="https://cgwb.gov.in/" target="_blank" rel="noreferrer" className="footer-link">Central Ground Water Board ↗</a>
              </div>
            </div>

            {/* Column 4: Contact & System Health */}
            <div>
              <h4 style={{ color: 'white', fontWeight: 800, fontSize: '0.92rem', marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Contact &amp; Support
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Phone size={16} color="#38BDF8" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 700, color: 'white' }}>National Water Helpline</div>
                    <div style={{ color: '#BAE6FD', fontSize: '0.82rem' }}>1800-180-5555 (Toll Free, 24x7)</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <Mail size={16} color="#38BDF8" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 700, color: 'white' }}>Official Support</div>
                    <div style={{ color: '#BAE6FD', fontSize: '0.82rem' }}>support@jalrakshak.gov.in</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <Building2 size={16} color="#38BDF8" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ color: '#94A3B8', fontSize: '0.8rem', lineHeight: 1.4 }}>
                    Pt. Deendayal Antyodaya Bhawan, CGO Complex, Lodhi Road, New Delhi 110003
                  </div>
                </div>
              </div>

              {/* Live System Status Box */}
              <div
                style={{
                  marginTop: 20,
                  padding: '12px 14px',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div style={{ fontWeight: 800, color: 'white', fontSize: '0.78rem', marginBottom: 8 }}>
                  System Health Status
                </div>
                {[
                  { label: 'Rule Engine (IS 10500)', status: 'Online' },
                  { label: 'Vernacular Translation', status: 'Online' },
                  { label: 'Telemetry Ingestion API', status: 'Online' },
                ].map((s, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 4 }}>
                    <span style={{ color: '#94A3B8' }}>{s.label}</span>
                    <span style={{ color: '#34D399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Legal Bar */}
          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,0.08)',
              padding: '24px 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
              fontSize: '0.78rem',
              color: '#94A3B8',
            }}
          >
            <div>
              © 2026 JalRakshak. Department of Drinking Water &amp; Sanitation, Ministry of Jal Shakti, Government of India.
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <a href="#" className="footer-link">Privacy Policy</a>
              <a href="#" className="footer-link">Terms of Use</a>
              <a href="#" className="footer-link">Accessibility Statement</a>
              <a href="#" className="footer-link">Hyperlinking Policy</a>
              <a href="#" className="footer-link">Sitemap</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── MODALS ── */}
      {/* 1. Announcements Archive Modal */}
      {showAnnouncementsModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 37, 64, 0.7)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setShowAnnouncementsModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 20,
              maxWidth: 650,
              width: '100%',
              padding: 28,
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.4rem' }}>📢</span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0A2540' }}>Official Press Releases &amp; Circulars</h3>
              </div>
              <button
                onClick={() => setShowAnnouncementsModal(false)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} color="#64748B" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '60vh', overflowY: 'auto' }}>
              {ANNOUNCEMENTS.map((a, i) => (
                <div key={i} style={{ padding: '14px 16px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.72rem', background: '#E0F2FE', color: '#0284C7', fontWeight: 800, padding: '2px 8px', borderRadius: 4 }}>
                      {a.tag}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{a.date}</span>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0A2540' }}>{a.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Login Chooser Modal */}
      {showLoginModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 37, 64, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setShowLoginModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 24,
              maxWidth: 520,
              width: '100%',
              padding: 32,
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0A2540' }}>Select Portal Login</h3>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Choose your assigned role to proceed to authentication</div>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} color="#64748B" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link
                to="/citizen"
                onClick={() => setShowLoginModal(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '16px',
                  borderRadius: 12,
                  border: '1px solid #E2E8F0',
                  textDecoration: 'none',
                  background: '#F8FAFC',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#ECFDF5'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                  👥
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: '#0A2540', fontSize: '0.95rem' }}>Citizen Public Portal</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Open access · No sign-in needed</div>
                </div>
                <ChevronRight size={18} color="#64748B" />
              </Link>

              <Link
                to="/login?type=worker"
                onClick={() => setShowLoginModal(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '16px',
                  borderRadius: 12,
                  border: '1px solid #E2E8F0',
                  textDecoration: 'none',
                  background: '#F8FAFC',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#EFF6FF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#DBEAFE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                  🧪
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: '#0A2540', fontSize: '0.95rem' }}>Field Worker Login</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Asha workers &amp; sampling teams</div>
                </div>
                <ChevronRight size={18} color="#64748B" />
              </Link>


              <Link
                to="/login?type=admin"
                onClick={() => setShowLoginModal(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '16px',
                  borderRadius: 12,
                  border: '1px solid #E2E8F0',
                  textDecoration: 'none',
                  background: '#F8FAFC',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#FAF5FF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EDE9FE', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                  🛡️
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: '#0A2540', fontSize: '0.95rem' }}>Administrator Login</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>System configuration &amp; audit trails</div>
                </div>
                <ChevronRight size={18} color="#64748B" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── EMBEDDED STYLES FOR ANIMATIONS & RESPONSIVENESS ── */}
      <style>{`
        .gov-nav-btn {
          color: #334155;
          text-decoration: none;
          font-size: 0.88rem;
          font-weight: 600;
          padding: 8px 12px;
          border-radius: 6px;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
        }
        .gov-nav-btn:hover {
          color: #0284C7;
          background: #F0F9FF;
        }

        .footer-link {
          color: #94A3B8;
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .footer-link:hover {
          color: #FFFFFF;
        }

        .marquee-strip {
          animation: marqueeScroll 32s linear infinite;
        }
        .marquee-strip.paused {
          animation-play-state: paused;
        }

        @keyframes marqueeScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.15); }
        }

        .spin-slow {
          animation: spinSlow 8s linear infinite;
        }
        @keyframes spinSlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 860px) {
          .hide-mobile { display: none !important; }
          .show-mobile-only { display: flex !important; }
        }
        @media (min-width: 861px) {
          .show-mobile-only { display: none !important; }
        }
      `}</style>
    </div>
  );
}
