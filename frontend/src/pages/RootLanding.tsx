import { Link, useNavigate } from 'react-router-dom';
import { Shield, Users, ArrowRight, Droplets, Globe2, Activity, ShieldCheck, LogIn, MapPin, Bell, BarChart3, ChevronRight, Phone, Mail, ExternalLink } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { getPublicStats, type PublicStats } from '../api';

/* ─── Slide data ─────────────────────────────────────────── */
const HERO_SLIDES = [
  {
    bg: 'linear-gradient(135deg, #0a3d62 0%, #1a6fa8 50%, #0e5a8a 100%)',
    title: 'Har Ghar Jal, Har Ghar Suraksha',
    sub: 'Ensuring safe drinking water for every household across India through comprehensive quality monitoring.',
    badge: 'जल सुरक्षा · Water Safety',
    accent: '#4dd9f0',
  },
  {
    bg: 'linear-gradient(135deg, #1a472a 0%, #2d6a4f 50%, #1b4332 100%)',
    title: 'National Water Quality Monitoring',
    sub: 'Real-time analysis against IS 10500:2012 standards ensuring public health safety.',
    badge: 'IS 10500:2012 Compliant',
    accent: '#52b788',
  },
  {
    bg: 'linear-gradient(135deg, #4a1942 0%, #8338ec 50%, #3a0ca3 100%)',
    title: '14 Languages, One Mission',
    sub: 'Translating critical water safety data into local languages so every citizen understands the risk.',
    badge: '14 भाषाएँ · Languages',
    accent: '#c77dff',
  },
];

/* ─── Announcement ticker items ──────────────────────────── */
const ANNOUNCEMENTS = [
  'Water Quality Report for Q3 2026 now available for 28 states',
  'New multilingual alert system launched in 6 more districts',
  'IS 10500:2012 compliance check completed for 10,000+ samples',
  'Field worker mobile app updated — offline sync now supported',
  'JalRakshak wins Best GovTech Innovation Award 2026',
];

/* ─── Static stats config (values filled from API) ─────── */
const STAT_CONFIG = [
  { key: 'total_samples',     suffix: '',  label: 'Water Samples Analyzed', icon: '💧', color: '#1677B8' },
  { key: 'total_states',      suffix: '',  label: 'States Covered',          icon: '🗺️', color: '#10b981' },
  { key: 'total_districts',   suffix: '',  label: 'Districts Monitored',     icon: '📍', color: '#06b6d4' },
  { key: 'safe_percentage',   suffix: '%', label: 'Samples Safe to Drink',   icon: '✅', color: '#168a5b', decimal: 1 },
  { key: 'active_workers',    suffix: '',  label: 'Field Workers Active',     icon: '👷', color: '#ef4444' },
  { key: 'do_not_boil_alerts',suffix: '',  label: 'Do-Not-Boil Alerts',      icon: '⚠️', color: '#f59e0b' },
] as const;

/* ─── Quick links ────────────────────────────────────────── */
const QUICK_LINKS = [
  { icon: BarChart3, label: 'Live Dashboard', to: '/citizen/dashboard', color: '#1677B8' },
  { icon: MapPin, label: 'Water Quality Map', to: '/citizen/map', color: '#10b981' },
  { icon: Bell, label: 'Alert Center', to: '/citizen/alerts', color: '#ef4444' },
  { icon: Activity, label: 'Data Explorer', to: '/citizen/explorer', color: '#8b5cf6' },
];

/* ─── Utility: animated counter ─────────────────────────── */
function AnimatedCounter({ target, suffix, decimal = 0 }: { target: number; suffix: string; decimal?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const duration = 1800;
        const steps = 60;
        const step = target / steps;
        let current = 0;
        const timer = setInterval(() => {
          current += step;
          if (current >= target) { setCount(target); clearInterval(timer); }
          else setCount(current);
        }, duration / steps);
      }
    }, { threshold: 0.4 });
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
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [tickerPaused, setTickerPaused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  /* fetch real stats */
  useEffect(() => {
    getPublicStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, []);

  /* auto-rotate hero */
  useEffect(() => {
    setVisible(true);
    const t = setInterval(() => setSlide(s => (s + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const current = HERO_SLIDES[slide];

  return (
    <div style={{ fontFamily: "'Open Sans', Inter, system-ui, sans-serif", color: '#1a1a2e', minHeight: '100vh', background: '#f5f7fa' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        /* Removed animations for a standard look */

        .nav-link-jal { 
          color: #2c3e50; text-decoration: none; font-size:0.88rem; font-weight:600;
          padding:8px 14px; border-radius:6px; transition:all 0.2s;
          display:flex; align-items:center; gap:6px; white-space:nowrap;
        }
        .nav-link-jal:hover { background:#e8f4fd; color:#1677B8; }

        .portal-card-jal { 
          transition:transform 0.3s ease, box-shadow 0.3s ease; cursor:pointer;
          text-decoration: none;
        }
        .portal-card-jal:hover { transform:translateY(-6px); }

        .stat-card-jal { transition:transform 0.2s ease, box-shadow 0.2s ease; }
        .stat-card-jal:hover { transform:translateY(-3px); box-shadow:0 12px 32px rgba(0,0,0,0.1) !important; }

        .quick-link-btn { transition:all 0.25s ease; text-decoration:none; }
        .quick-link-btn:hover { transform:translateY(-2px); }

        .ticker-wrap { overflow:hidden; white-space:nowrap; }
        .ticker-inner { display:inline-block; animation:ticker 35s linear infinite; }
        .ticker-inner:hover,.ticker-inner.paused { animation-play-state:paused; }

        .slide-dot { 
          width:10px; height:10px; border-radius:50%; border:2px solid rgba(255,255,255,0.7);
          cursor:pointer; transition:all 0.2s; background:transparent;
        }
        .slide-dot.active { background:white; width:24px; border-radius:5px; }

        .hero-slide-btn { 
          background:rgba(255,255,255,0.15); color:white; border:1.5px solid rgba(255,255,255,0.4);
          padding:14px 28px; border-radius:8px; font-weight:700; font-size:0.95rem;
          cursor:pointer; transition:all 0.25s; display:flex; align-items:center; gap:8px;
          text-decoration:none; backdrop-filter:blur(4px);
        }
        .hero-slide-btn:hover { background:rgba(255,255,255,0.28); border-color:white; transform:translateY(-2px); }
        .hero-slide-btn.primary { background:white; color:#1677B8; border-color:white; }
        .hero-slide-btn.primary:hover { background:#f0f7ff; transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.2); }

        .section-header { text-align:center; margin-bottom:48px; }
        .section-tag { font-size:0.75rem; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#1677B8; margin-bottom:10px; }
        .section-title { font-size:clamp(1.6rem,3vw,2.2rem); font-weight:800; color:#16324f; letter-spacing:-0.02em; }
        .section-sub { color:#5b7083; font-size:1rem; margin-top:12px; max-width:560px; margin-left:auto; margin-right:auto; line-height:1.6; }

        .map-placeholder { 
          background: linear-gradient(135deg, #e8f4fd 0%, #dbeafe 100%);
          border:2px dashed #93c5fd; border-radius:16px;
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          min-height:400px; color:#1677B8;
        }

        /* Gov top bar */
        .top-bar { background:#1a3a5c; color:rgba(255,255,255,0.9); font-size:0.78rem; padding:6px 40px; display:flex; justify-content:space-between; align-items:center; }
        .top-bar a { color:rgba(255,255,255,0.8); text-decoration:none; font-size:0.78rem; }
        .top-bar a:hover { color:white; }

        /* Sticky nav */
        .main-nav {
          position:sticky; top:0; z-index:1000;
          background:white;
          border-bottom:3px solid #1677B8;
          box-shadow: ${scrolled ? '0 4px 20px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.06)'};
          transition:box-shadow 0.3s;
        }

        .footer-link { color:rgba(255,255,255,0.75); text-decoration:none; font-size:0.875rem; transition:color 0.2s; }
        .footer-link:hover { color:white; }
        
        @media(max-width:768px) {
          .top-bar { padding:6px 16px; }
          .mobile-hide { display:none !important; }
          .nav-desktop { display:none !important; }
        }
        @media(min-width:769px) {
          .mobile-show { display:none !important; }
        }
      `}</style>

      {/* ── TOP UTILITY BAR (Government style) ── */}
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            🇮🇳 <strong>Government of India</strong>
          </span>
          <span className="mobile-hide" style={{ color: 'rgba(255,255,255,0.4)' }}>|</span>
          <a href="https://jalshakti-ddws.gov.in/" target="_blank" rel="noreferrer" className="mobile-hide">
            Ministry of Jal Shakti
          </a>
          <span className="mobile-hide" style={{ color: 'rgba(255,255,255,0.4)' }}>|</span>
          <a href="https://jaljeevanmission.gov.in/" target="_blank" rel="noreferrer" className="mobile-hide">
            Jal Jeevan Mission
          </a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="mobile-hide" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <a href="#main-content" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.78rem' }}>
              Skip to main content
            </a>
          </span>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>|</span>
          <a href="tel:1800-180-5555" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>
            <Phone size={11} /> Helpline: 1800-180-5555
          </a>
        </div>
      </div>

      {/* ── STICKY NAVBAR ── */}
      <nav className="main-nav">
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>

          {/* Logo + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img
              src="/logo.png"
              alt="JalRakshak"
              style={{ width: 56, height: 56, objectFit: 'contain' }}
            />
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#16324f', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
                JalRakshak
              </div>
              <div style={{ fontSize: '0.7rem', color: '#1677B8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                AI Water Quality Monitor
              </div>
              <div style={{ fontSize: '0.65rem', color: '#5b7083', fontWeight: 500 }}>
                Dept. of Drinking Water &amp; Sanitation
              </div>
            </div>
          </div>

          {/* Desktop nav links */}
          <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <a href="#main-content" className="nav-link-jal">🏠 Home</a>
            <a href="#about" className="nav-link-jal">About</a>
            <a href="#stats" className="nav-link-jal">Dashboard</a>
            <a href="#portals" className="nav-link-jal">Portals</a>
            <Link to="/citizen/alerts" className="nav-link-jal">Alerts</Link>
            <Link to="/citizen/about" className="nav-link-jal">Contact</Link>
          </div>

          {/* Login buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => navigate('/login?type=worker')}
              style={{
                background: '#f0f7ff', color: '#1677B8',
                border: '1.5px solid #1677B8', padding: '8px 16px',
                borderRadius: 6, fontWeight: 600, fontSize: '0.85rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1677B8'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f0f7ff'; e.currentTarget.style.color = '#1677B8'; }}
            >
              <Droplets size={14} /> Worker
            </button>
            <button
              onClick={() => navigate('/login?type=admin')}
              style={{
                background: '#1677B8', color: 'white',
                border: '1.5px solid #1677B8', padding: '8px 18px',
                borderRadius: 6, fontWeight: 700, fontSize: '0.85rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: '0 2px 8px rgba(22,119,184,0.3)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#0B5D8F'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#1677B8'; }}
            >
              <LogIn size={14} /> Admin Login
            </button>
          </div>
        </div>
      </nav>

      {/* ── ANNOUNCEMENT TICKER ── */}
      <div style={{ background: '#b75704', color: 'white', display: 'flex', alignItems: 'stretch', overflow: 'hidden' }}>
        <div style={{
          background: '#8B4003', padding: '8px 20px',
          fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.08em',
          textTransform: 'uppercase', whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
        }}>
          📢 Announcement
        </div>
        <div className="ticker-wrap" style={{ flex: 1, padding: '8px 0' }}>
          <div
            className={`ticker-inner${tickerPaused ? ' paused' : ''}`}
            onMouseEnter={() => setTickerPaused(true)}
            onMouseLeave={() => setTickerPaused(false)}
          >
            {ANNOUNCEMENTS.concat(ANNOUNCEMENTS).map((a, i) => (
              <span key={i} style={{ marginRight: 60, fontSize: '0.85rem', fontWeight: 500 }}>
                ● {a}
              </span>
            ))}
          </div>
        </div>
        <a href="#" style={{
          background: '#6d3200', color: 'white', textDecoration: 'none',
          padding: '8px 16px', fontSize: '0.78rem', fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          View All <ExternalLink size={12} />
        </a>
      </div>

      {/* ── HERO SLIDER ── */}
      <section id="main-content" className="hero-slide" key={slide} style={{
        background: current.bg,
        minHeight: 520,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
      }}>
        {/* decorative wave */}
        <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', opacity: 0.15 }} viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="white" />
        </svg>

        {/* Floating orbs */}
        <div style={{ position: 'absolute', top: '20%', right: '5%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', animation: 'float 6s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '20%', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', animation: 'float 8s ease-in-out infinite reverse' }} />

        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '60px 40px', width: '100%', display: 'flex', alignItems: 'center', gap: 60, position: 'relative', zIndex: 2 }}>

          {/* Left: text */}
          <div className="slide-text" style={{ flex: 1, maxWidth: 660 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
              border: `1px solid ${current.accent}60`,
              padding: '5px 16px', borderRadius: 50,
              color: current.accent, fontSize: '0.78rem', fontWeight: 700,
              letterSpacing: '0.06em', marginBottom: 24,
            }}>
              <ShieldCheck size={14} /> {current.badge}
            </div>

            <h1 style={{
              fontSize: 'clamp(2rem, 4vw, 3.5rem)',
              fontWeight: 900, lineHeight: 1.15,
              color: 'white', marginBottom: 20,
              letterSpacing: '-0.02em',
              textShadow: '0 2px 20px rgba(0,0,0,0.3)',
            }}>
              {current.title}
            </h1>
            <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, marginBottom: 36, maxWidth: 560 }}>
              {current.sub}
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link to="/citizen" className="hero-slide-btn primary">
                Explore as Citizen <ArrowRight size={17} />
              </Link>
              <a href="#portals" className="hero-slide-btn">
                View Portals <ChevronRight size={17} />
              </a>
            </div>
          </div>

          {/* Right: logo + pulse */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }} className="mobile-hide">
            <div style={{ position: 'relative', width: 220, height: 220 }}>
              {/* Pulse rings */}
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  border: `2px solid ${current.accent}40`,
                  animation: `pulse-ring ${2 + i}s ease-out ${i * 0.5}s infinite`,
                }} />
              ))}
              <div style={{
                position: 'absolute', inset: 20,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255,255,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <img src="/logo.png" alt="JalRakshak" style={{ width: 130, height: 130, objectFit: 'contain', filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.3))', animation: 'float 4s ease-in-out infinite' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Slide dots + indicators */}
        <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 5 }}>
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`slide-dot${i === slide ? ' active' : ''}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ── QUICK ACCESS ROW ── */}
      <section style={{ background: '#16324f', padding: '0' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 1 }}>
          {QUICK_LINKS.map((ql, i) => {
            const Icon = ql.icon;
            return (
              <Link key={i} to={ql.to} className="quick-link-btn" style={{
                padding: '20px 24px',
                background: '#1e3f5c',
                display: 'flex', alignItems: 'center', gap: 12,
                color: 'white', textDecoration: 'none',
                borderRight: i < QUICK_LINKS.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = ql.color; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#1e3f5c'; }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${ql.color}30`, color: ql.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} />
                </div>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{ql.label}</span>
                <ChevronRight size={16} style={{ marginLeft: 'auto', opacity: 0.6 }} />
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── STATISTICS COUNTER ── */}
      <section id="stats" style={{ padding: '80px 40px', background: 'white' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div className="section-header">
            <div className="section-tag">📊 Key Metrics</div>
            <h2 className="section-title">JalRakshak at a Glance</h2>
            <p className="section-sub">Real-time numbers reflecting our commitment to safe water access across India.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            {STAT_CONFIG.map((s, i) => (
              <div key={i} className="stat-card-jal" style={{
                background: 'white',
                border: `2px solid ${s.color}20`,
                borderTop: `4px solid ${s.color}`,
                borderRadius: 16, padding: '28px 24px',
                textAlign: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
              }}>
                <div style={{ fontSize: '2.2rem', marginBottom: 8 }}>{s.icon}</div>
                
                {statsLoading ? (
                  <div style={{ height: 38, width: '60%', background: '#e2e8f0', borderRadius: 4, margin: '0 auto 8px', animation: 'pulse-ring 2s infinite ease-in-out alternate' }} />
                ) : (
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, color: s.color, letterSpacing: '-0.02em', lineHeight: 1 }}>
                    <AnimatedCounter 
                      target={stats ? Number(stats[s.key as keyof PublicStats]) || 0 : 0} 
                      suffix={s.suffix} 
                      decimal={'decimal' in s ? s.decimal : 0} 
                    />
                  </div>
                )}
                
                <div style={{ fontSize: '0.82rem', color: '#5b7083', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 8 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT SECTION ── */}
      <section id="about" style={{ padding: '80px 40px', background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 100%)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>

          {/* Left: image/logo block */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{
              position: 'relative',
              background: 'white',
              borderRadius: 24,
              padding: 48,
              boxShadow: '0 20px 60px rgba(22,119,184,0.15)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
            }}>
              <img src="/logo.png" alt="JalRakshak" style={{ width: 180, height: 180, objectFit: 'contain', animation: 'float 5s ease-in-out infinite' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '1.4rem', color: '#16324f' }}>जल रक्षक</div>
                <div style={{ color: '#1677B8', fontWeight: 600, fontSize: '0.9rem' }}>Water Guardian System</div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ padding: '8px 16px', background: '#e8f4fd', borderRadius: 50, fontSize: '0.8rem', fontWeight: 700, color: '#1677B8' }}>IS 10500:2012</div>
                <div style={{ padding: '8px 16px', background: '#e6f6ef', borderRadius: 50, fontSize: '0.8rem', fontWeight: 700, color: '#168a5b' }}>AI-Powered</div>
              </div>
            </div>
          </div>

          {/* Right: text */}
          <div>
            <div className="section-tag" style={{ textAlign: 'left' }}>🌊 About JalRakshak</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, color: '#16324f', letterSpacing: '-0.02em', marginBottom: 20, lineHeight: 1.2 }}>
              AI-Based Water Quality Monitoring &amp; Vernacular Alert System
            </h2>
            <p style={{ color: '#5b7083', lineHeight: 1.8, fontSize: '1rem', marginBottom: 24 }}>
              JalRakshak is a comprehensive AI-powered platform that analyzes real-time water quality data against strict Indian Standards (IS 10500:2012), ensuring every citizen has access to accurate, actionable water safety information in their own language.
            </p>
            <p style={{ color: '#5b7083', lineHeight: 1.8, fontSize: '1rem', marginBottom: 32 }}>
              Our deterministic rule engine eliminates AI hallucinations — safety classifications are made scientifically and transparently. Field workers collect samples, administrators manage the system, and citizens get multilingual alerts automatically.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 36 }}>
              {[
                { icon: '🔬', text: 'Scientific Thresholds' },
                { icon: '🌐', text: '14 Regional Languages' },
                { icon: '📱', text: 'Offline Field App' },
                { icon: '⚡', text: 'Real-time Alerts' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'white', borderRadius: 10, border: '1px solid #dceaf2', fontWeight: 600, color: '#16324f', fontSize: '0.875rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>{f.icon}</span> {f.text}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 14 }}>
              <Link to="/citizen" style={{
                background: '#1677B8', color: 'white', textDecoration: 'none',
                padding: '13px 28px', borderRadius: 8, fontWeight: 700, fontSize: '0.95rem',
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 4px 16px rgba(22,119,184,0.3)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#0B5D8F'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#1677B8'; e.currentTarget.style.transform = 'none'; }}
              >
                Explore Platform <ArrowRight size={16} />
              </Link>
              <Link to="/citizen/about" style={{
                background: 'transparent', color: '#1677B8', textDecoration: 'none',
                padding: '13px 24px', borderRadius: 8, fontWeight: 700, fontSize: '0.95rem',
                border: '2px solid #1677B8', display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f0f7ff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                Learn More <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAP SECTION (placeholder) ── */}
      <section style={{ padding: '80px 40px', background: 'linear-gradient(270deg, #fff 0%, #a8e3ff 50%, #bdd7e7 50%, rgba(255,255,255,0) 100%)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div className="section-header">
            <div className="section-tag">🗺️ Coverage Map</div>
            <h2 className="section-title">Water Quality Across India</h2>
            <p className="section-sub">Interactive map showing water quality status across districts and states.</p>
          </div>

          <div className="map-placeholder" style={{ minHeight: 420 }}>
            <div style={{ fontSize: '4rem', marginBottom: 16, animation: 'float 4s ease-in-out infinite' }}>🗺️</div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1677B8', marginBottom: 12 }}>Interactive India Map</h3>
            <p style={{ color: '#5b7083', fontSize: '0.95rem', textAlign: 'center', maxWidth: 400 }}>
              View district-wise water quality data, safe/unsafe zones, and field worker coverage.
            </p>
            <Link to="/citizen/map" style={{
              marginTop: 24, background: '#1677B8', color: 'white',
              textDecoration: 'none', padding: '12px 28px', borderRadius: 8,
              fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <MapPin size={16} /> Open Map View
            </Link>
          </div>
        </div>
      </section>

      {/* ── PORTAL CARDS ── */}
      <section id="portals" style={{ padding: '80px 40px', background: '#f5f7fa' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div className="section-header">
            <div className="section-tag">🚪 Access Portals</div>
            <h2 className="section-title">Choose Your Portal</h2>
            <p className="section-sub">Three tailored access points — for citizens, field workers, and administrators.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28 }}>

            {/* Citizen */}
            <Link to="/citizen" className="portal-card-jal" style={{
              background: 'white', borderRadius: 20, overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
              border: '1px solid #e2eff9',
              textDecoration: 'none',
            }}>
              <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '32px', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: 8 }}>👥</div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Public Access · No Login
                </div>
              </div>
              <div style={{ padding: '28px 24px' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#16324f', marginBottom: 12 }}>Citizen Portal</h3>
                <p style={{ color: '#5b7083', lineHeight: 1.7, fontSize: '0.9rem', marginBottom: 24 }}>
                  Explore water quality data, view interactive maps, and receive multilingual safety alerts for your area — no account needed.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontWeight: 700, fontSize: '0.9rem' }}>
                  Explore Now <ArrowRight size={15} />
                </div>
              </div>
            </Link>

            {/* Worker */}
            <Link to="/login?type=worker" className="portal-card-jal" style={{
              background: 'white', borderRadius: 20, overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
              border: '1px solid #e2eff9',
              textDecoration: 'none',
            }}>
              <div style={{ background: 'linear-gradient(135deg, #1677B8, #0B5D8F)', padding: '32px', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: 8 }}>🧪</div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Field Staff · Secure Login
                </div>
              </div>
              <div style={{ padding: '28px 24px' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#16324f', marginBottom: 12 }}>Field Worker Portal</h3>
                <p style={{ color: '#5b7083', lineHeight: 1.7, fontSize: '0.9rem', marginBottom: 24 }}>
                  Submit water quality samples, manage assigned locations, and track synchronization status directly from the field.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1677B8', fontWeight: 700, fontSize: '0.9rem' }}>
                  Worker Login <ArrowRight size={15} />
                </div>
              </div>
            </Link>

            {/* Admin */}
            <Link to="/login?type=admin" className="portal-card-jal" style={{
              background: 'white', borderRadius: 20, overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
              border: '1px solid #e2eff9',
              textDecoration: 'none',
            }}>
              <div style={{ background: 'linear-gradient(135deg, #7c3aed, #4c1d95)', padding: '32px', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: 8 }}>🛡️</div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Administration · Secure Login
                </div>
              </div>
              <div style={{ padding: '28px 24px' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#16324f', marginBottom: 12 }}>Administrator Portal</h3>
                <p style={{ color: '#5b7083', lineHeight: 1.7, fontSize: '0.9rem', marginBottom: 24 }}>
                  Manage field workers, review all submissions, import CSV datasets, configure alert rules, and view system audit logs.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#7c3aed', fontWeight: 700, fontSize: '0.9rem' }}>
                  Admin Login <ArrowRight size={15} />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── KEY FEATURES ── */}
      <section style={{ padding: '80px 40px', background: 'white' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div className="section-header">
            <div className="section-tag">⚙️ Core Features</div>
            <h2 className="section-title">Why JalRakshak?</h2>
            <p className="section-sub">Built for scale, accuracy, and accessibility across India's diverse water landscape.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {[
              { icon: ShieldCheck, color: '#1677B8', bg: '#e8f4fd', title: 'Deterministic Rule Engine', desc: 'Safety classifications are made deterministically against IS 10500:2012 thresholds — zero AI hallucinations, guaranteed accuracy.' },
              { icon: Globe2, color: '#10b981', bg: '#e6f6ef', title: '14-Language Vernacular Alerts', desc: 'Complex technical water safety data translated into natural, easy-to-understand alerts in 14 Indian regional languages.' },
              { icon: Activity, color: '#8b5cf6', bg: '#ede9fe', title: 'Real-time Field Collection', desc: 'Field workers collect and sync water samples offline. Data auto-syncs when connectivity is restored.' },
              { icon: MapPin, color: '#ef4444', bg: '#fef2f2', title: 'District-level Coverage', desc: 'Monitor water quality across districts, blocks, and villages with granular geographic precision.' },
              { icon: BarChart3, color: '#f59e0b', bg: '#fffbeb', title: 'Verified Datasets', desc: 'Explore real-world water quality data spanning multiple states, districts, and water sources.' },
              { icon: Bell, color: '#06b6d4', bg: '#ecfeff', title: 'Smart Alert System', desc: 'Automated alerts for unsafe water conditions, sent to administrators, field teams, and citizens instantly.' },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} style={{
                  padding: '28px 24px',
                  background: 'white',
                  border: '1px solid #e8eff5',
                  borderRadius: 16,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: f.bg, color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, border: `1px solid ${f.color}20` }}>
                    <Icon size={26} strokeWidth={1.8} />
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#16324f', marginBottom: 10 }}>{f.title}</h3>
                  <p style={{ color: '#5b7083', fontSize: '0.875rem', lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{
        background: 'linear-gradient(135deg, #1677B8 0%, #0B5D8F 50%, #16324f 100%)',
        padding: '70px 40px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>💧</div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 900, color: 'white', marginBottom: 16, letterSpacing: '-0.02em' }}>
            Har Ghar Jal — Safe Water for Every Home
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: 36 }}>
            Join India's mission to ensure clean, safe drinking water for every household through science, technology, and community participation.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/citizen" style={{ background: 'white', color: '#1677B8', textDecoration: 'none', padding: '14px 32px', borderRadius: 8, fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
            >
              <Users size={18} /> Citizen Access
            </Link>
            <Link to="/login?type=worker" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', textDecoration: 'none', padding: '14px 32px', borderRadius: 8, fontWeight: 700, fontSize: '1rem', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 8, backdropFilter: 'blur(8px)', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
            >
              <Droplets size={18} /> Field Worker Login
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#16324f', color: 'rgba(255,255,255,0.8)', padding: '60px 40px 0' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 48, marginBottom: 48 }}>

            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <img src="/logo.png" alt="JalRakshak" style={{ width: 52, height: 52, objectFit: 'contain' }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'white' }}>JalRakshak</div>
                  <div style={{ fontSize: '0.7rem', color: '#64b4e8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Water Guardian</div>
                </div>
              </div>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.65)', marginBottom: 20 }}>
                AI-Based Water Quality Monitoring &amp; Vernacular Alert System for rural India.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ padding: '4px 12px', background: 'rgba(22,119,184,0.3)', borderRadius: 50, fontSize: '0.72rem', fontWeight: 700, color: '#64b4e8' }}>IS 10500:2012</div>
                <div style={{ padding: '4px 12px', background: 'rgba(16,185,129,0.2)', borderRadius: 50, fontSize: '0.72rem', fontWeight: 700, color: '#52b788' }}>Govt. of India</div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Access</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Citizen Dashboard', to: '/citizen/dashboard' },
                  { label: 'Water Quality Map', to: '/citizen/map' },
                  { label: 'Alert Center', to: '/citizen/alerts' },
                  { label: 'Data Explorer', to: '/citizen/explorer' },
                  { label: 'About JalRakshak', to: '/citizen/about' },
                ].map((l, i) => (
                  <Link key={i} to={l.to} className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ChevronRight size={14} style={{ color: '#1677B8', flexShrink: 0 }} /> {l.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Portals */}
            <div>
              <h4 style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Portals</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Citizen Access (Public)', to: '/citizen' },
                  { label: 'Field Worker Login', to: '/login?type=worker' },
                  { label: 'Admin Login', to: '/login?type=admin' },
                ].map((l, i) => (
                  <Link key={i} to={l.to} className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ChevronRight size={14} style={{ color: '#1677B8', flexShrink: 0 }} /> {l.label}
                  </Link>
                ))}
              </div>

              <h4 style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem', marginTop: 28, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>External Links</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Jal Jeevan Mission', href: 'https://jaljeevanmission.gov.in/' },
                  { label: 'Ministry of Jal Shakti', href: 'https://jalshakti-ddws.gov.in/' },
                ].map((l, i) => (
                  <a key={i} href={l.href} target="_blank" rel="noreferrer" className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ExternalLink size={12} style={{ color: '#1677B8', flexShrink: 0 }} /> {l.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <Phone size={16} style={{ color: '#64b4e8', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>Helpline</div>
                    <div style={{ fontSize: '0.825rem', color: 'rgba(255,255,255,0.65)' }}>1800-180-5555 (Toll Free)</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <Mail size={16} style={{ color: '#64b4e8', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>Email</div>
                    <div style={{ fontSize: '0.825rem', color: 'rgba(255,255,255,0.65)' }}>support@jalrakshak.gov.in</div>
                  </div>
                </div>
              </div>

              {/* System Status */}
              <div style={{ marginTop: 28, padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontWeight: 700, color: 'white', fontSize: '0.82rem', marginBottom: 10 }}>System Status</div>
                {[
                  { label: 'Rule Engine', ok: true },
                  { label: 'Translation Engine', ok: true },
                  { label: 'API Services', ok: true },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.ok ? '#10b981' : '#ef4444', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)' }}>{s.label}</span>
                    <span style={{ fontSize: '0.72rem', color: s.ok ? '#52b788' : '#ef4444', marginLeft: 'auto', fontWeight: 600 }}>
                      {s.ok ? 'Online' : 'Offline'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '20px 0', maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
              © 2026 JalRakshak · Department of Drinking Water &amp; Sanitation · Government of India
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              {['Privacy Policy', 'Terms of Use', 'Accessibility', 'Sitemap'].map((l, i) => (
                <a key={i} href="#" style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
                >{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
