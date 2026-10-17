import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAlerts, getDashboardSummary, getStates, getDistricts } from '../../api';
import type { DashboardSummary } from '../../types';
import { getCategoryConfig, formatPercentage } from '../../utils/display';
import {
  AlertTriangle, Droplets, MapPin, CheckCircle2, FlaskConical, Bug,
  AlertOctagon, Waves, Database, CheckCircle, Ban, ShieldCheck,
  LineChart as LineChartIcon, TrendingUp, BarChart2, FileDown,
  Activity, Zap, Eye, Download, RefreshCw, ArrowUpRight,
  ArrowDownRight, Filter, Share2, Clock
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, AreaChart, Area, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, RadialBarChart,
  RadialBar
} from 'recharts';
import { Link, Navigate, useNavigate } from 'react-router-dom';

const CATEGORY_COLORS: Record<string, string> = {
  POTABLE_SAFE:               '#10b981',
  UNSAFE_BIOLOGICAL_PATHOGEN: '#f97316',
  CRITICAL_CHEMICAL_TOXIN:    '#ef4444',
  MODERATE_PHYSICAL_PARAM:    '#eab308',
  CRITICAL_MIXED_HAZARD:      '#dc2626',
};

const GRADIENT_COLORS = {
  safe:     { start: '#10b981', end: '#059669' },
  warning:  { start: '#fbbf24', end: '#d97706' },
  danger:   { start: '#ef4444', end: '#dc2626' },
  info:     { start: '#0ea5e9', end: '#0284c7' },
  primary:  { start: '#00d2ff', end: '#3a7bd5' },
  purple:   { start: '#8b5cf6', end: '#6d28d9' },
};

/* ── Sparkline Mini Component ────────────────────────────────── */
function MiniSparkline({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  const max = Math.max(...data, 1);
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: ((max - v) / max) * height
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = pathD + ` L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none"
      style={{ opacity: 0.7, overflow: 'visible' }}>
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.4} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#spark-${color.replace('#', '')})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ── Animated Counter ────────────────────────────────────────── */
function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);
  return <>{current.toLocaleString()}</>;
}

/* ── Water Safety Score Gauge ────────────────────────────────── */
function SafetyGauge({ percentage }: { percentage: number }) {
  const radius = 80;
  const stroke = 12;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;
  const color = percentage >= 80 ? '#10b981' : percentage >= 50 ? '#eab308' : '#ef4444';
  const label = percentage >= 80 ? 'GOOD' : percentage >= 50 ? 'MODERATE' : 'CRITICAL';

  return (
    <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto' }}>
      <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity={1} />
            <stop offset="100%" stopColor={color} stopOpacity={0.5} />
          </linearGradient>
          <filter id="gaugeGlowFilter">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.05)"
          strokeWidth={stroke} />
        <circle cx="100" cy="100" r={radius} fill="none" stroke="url(#gaugeGrad)"
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={dashOffset}
          filter="url(#gaugeGlowFilter)"
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
      </svg>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2.5rem', fontWeight: 800, color, lineHeight: 1 }}>
          {percentage.toFixed(0)}%
        </div>
        <div style={{
          fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em',
          color, marginTop: 4, textTransform: 'uppercase',
          padding: '2px 10px', borderRadius: 20,
          background: `${color}20`,
        }}>{label}</div>
      </div>
    </div>
  );
}

/* ── Enhanced KPI Card ───────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, sub, accent, onClick, trend, sparkData }: {
  icon: any; label: string; value: string | number; sub?: string; accent?: string;
  onClick?: () => void; trend?: 'up' | 'down' | 'neutral';
  sparkData?: number[];
}) {
  return (
    <div
      className="card card-hover"
      style={{
        borderTop: accent ? `3px solid ${accent}` : undefined,
        cursor: onClick ? 'pointer' : undefined,
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 150,
      }}
      onClick={onClick}
    >
      {sparkData && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, opacity: 0.5 }}>
          <MiniSparkline data={sparkData} color={accent || '#00d2ff'} height={50} />
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, position: 'relative', zIndex: 1 }}>
        <div style={{
          color: accent || 'var(--color-primary)',
          background: `${accent || 'var(--color-primary)'}15`,
          padding: 10, borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={20} strokeWidth={2} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {trend && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 2,
              fontSize: '0.7rem', fontWeight: 700,
              color: trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#94a3b8',
              background: trend === 'up' ? 'rgba(16,185,129,0.15)' : trend === 'down' ? 'rgba(239,68,68,0.15)' : 'rgba(148,163,184,0.15)',
              padding: '3px 8px', borderRadius: 20
            }}>
              {trend === 'up' ? <ArrowUpRight size={12} /> : trend === 'down' ? <ArrowDownRight size={12} /> : null}
              {trend === 'up' ? '+2.3%' : trend === 'down' ? '-1.5%' : '0%'}
            </span>
          )}
          {sub && <span style={{
            fontSize: '0.7rem', color: 'var(--color-text-secondary)',
            background: 'var(--color-bg-soft)',
            padding: '3px 10px', borderRadius: 20, fontWeight: 600
          }}>{sub}</span>}
        </div>
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>
          {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: 4, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

/* ── Quick Action Button ─────────────────────────────────────── */
function QuickAction({ icon: Icon, label, description, gradient, onClick }: {
  icon: any; label: string; description: string;
  gradient: { start: string; end: string }; onClick: () => void;
}) {
  return (
    <div
      className="card card-hover"
      onClick={onClick}
      style={{
        padding: '20px 24px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 16,
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 120, height: 120,
        background: `radial-gradient(circle at top right, ${gradient.start}15, transparent 70%)`,
        borderRadius: '0 16px 0 0',
      }} />
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: `linear-gradient(135deg, ${gradient.start}, ${gradient.end})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 4px 15px ${gradient.start}40`,
        flexShrink: 0,
      }}>
        <Icon size={22} color="#fff" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>{description}</div>
      </div>
      <ArrowUpRight size={18} color="var(--color-text-secondary)" style={{ flexShrink: 0, opacity: 0.5 }} />
    </div>
  );
}

/* ── Parameter Health Bar ────────────────────────────────────── */
function ParameterBar({ name, safe, warning, danger, total }: {
  name: string; safe: number; warning: number; danger: number; total: number;
}) {
  const pctSafe = total > 0 ? (safe / total) * 100 : 0;
  const pctWarn = total > 0 ? (warning / total) * 100 : 0;
  const pctDanger = total > 0 ? (danger / total) * 100 : 0;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text)' }}>{name}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{total.toLocaleString()} samples</span>
      </div>
      <div style={{
        display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden',
        background: 'rgba(255,255,255,0.05)'
      }}>
        <div style={{ width: `${pctSafe}%`, background: `linear-gradient(90deg, ${GRADIENT_COLORS.safe.start}, ${GRADIENT_COLORS.safe.end})`, transition: 'width 1s ease' }} />
        <div style={{ width: `${pctWarn}%`, background: `linear-gradient(90deg, ${GRADIENT_COLORS.warning.start}, ${GRADIENT_COLORS.warning.end})`, transition: 'width 1s ease' }} />
        <div style={{ width: `${pctDanger}%`, background: `linear-gradient(90deg, ${GRADIENT_COLORS.danger.start}, ${GRADIENT_COLORS.danger.end})`, transition: 'width 1s ease' }} />
      </div>
    </div>
  );
}


/* ════════════════════════════════════════════════════════════════
   CITIZEN DASHBOARD
   ════════════════════════════════════════════════════════════════ */

export default function CitizenDashboard() {
  const { profile, isLoading, profileLoaded } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Available locations
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);

  // Selected filters: '' means All India
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');

  const navigate = useNavigate();
  const fetchSeqRef = useRef(0);

  // Load available states once on mount
  useEffect(() => {
    getStates()
      .then(stList => {
        if (Array.isArray(stList)) {
          setAvailableStates(stList);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch districts whenever selected state changes
  useEffect(() => {
    if (selectedState) {
      getDistricts(selectedState)
        .then(dList => {
          if (Array.isArray(dList)) {
            setAvailableDistricts(dList);
          }
        })
        .catch(console.error);
    } else {
      setAvailableDistricts([]);
      setSelectedDistrict('');
    }
  }, [selectedState]);

  // Fetch Dashboard Summary when state or district changes
  useEffect(() => {
    const seq = ++fetchSeqRef.current;
    setLoadingSummary(true);

    const params: { state?: string; district?: string } = {};
    if (selectedState) params.state = selectedState;
    if (selectedDistrict) params.district = selectedDistrict;

    getDashboardSummary(Object.keys(params).length > 0 ? params : undefined)
      .then(res => {
        if (fetchSeqRef.current === seq) {
          setSummary(res);
        }
      })
      .catch(err => {
        if (fetchSeqRef.current === seq) {
          console.error('Failed to load dashboard summary:', err);
        }
      })
      .finally(() => {
        if (fetchSeqRef.current === seq) {
          setLoadingSummary(false);
        }
      });
  }, [selectedState, selectedDistrict]);

  // Fetch Alerts for the selected location
  useEffect(() => {
    if (profile?.role === 'citizen') {
      const seq = fetchSeqRef.current;
      setLoadingAlerts(true);
      const filterParams: any = {
        state: selectedState || undefined,
        district: selectedDistrict || undefined,
        page_size: 10
      };
      getAlerts(filterParams)
        .then(res => {
          if (fetchSeqRef.current === seq) {
            setAlerts(res.items || []);
          }
        })
        .catch(console.error)
        .finally(() => {
          if (fetchSeqRef.current === seq) {
            setLoadingAlerts(false);
          }
        });
    } else {
      setLoadingAlerts(false);
    }
  }, [selectedState, selectedDistrict, profile?.role]);

  if (isLoading || !profileLoaded || (loadingSummary && !summary)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(0,210,255,0.2), rgba(58,123,213,0.2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'pulse-glow 2s ease-in-out infinite'
        }}>
          <Droplets size={36} color="var(--color-primary)" />
        </div>
        <div style={{ color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: '0.95rem' }}>
          Loading {selectedDistrict ? `${selectedDistrict}, ` : ''}{selectedState ? selectedState : 'National'} water quality data...
        </div>
        <div style={{
          width: 200, height: 3, borderRadius: 2, overflow: 'hidden',
          background: 'rgba(255,255,255,0.05)'
        }}>
          <div style={{
            width: '40%', height: '100%',
            background: 'linear-gradient(90deg, transparent, var(--color-primary), transparent)',
            animation: 'shimmer 1.5s ease-in-out infinite',
            borderRadius: 2,
          }} />
        </div>
      </div>
    );
  }

  // Redirect if not logged in
  if (!isLoading && profileLoaded && !profile) {
    return <Navigate to="/citizen/login" replace />;
  }

  const userHomeDistrict = profile?.district || profile?.district_id || '';
  const userHomeState = profile?.state_ut || profile?.state_id || '';

  const latestAlert = alerts.length > 0 ? alerts[0] : null;
  const statusColor = latestAlert?.severity === 'CRITICAL' ? '#ef4444' : latestAlert?.severity === 'HIGH' ? '#f59e0b' : '#10b981';
  const statusText = latestAlert?.severity || 'SAFE';
  const statusLabel = statusText === 'SAFE' ? 'Water is Safe' : statusText === 'CRITICAL' ? 'Critical Alert' : 'Needs Attention';

  // Chart tooltip style
  const tooltipStyle = {
    background: 'rgba(9, 20, 40, 0.95)',
    border: '1px solid rgba(0, 210, 255, 0.2)',
    borderRadius: 12,
    color: '#e0f2fe',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(10px)',
    padding: '12px 16px',
  };

  // Real Chart data from database summary
  const pieData = summary?.category_distribution.map(c => ({
    name:     getCategoryConfig(c.category).label,
    value:    c.count,
    category: c.category,
  })) || [];

  const stateBarData = summary?.top_chemical_states.slice(0, 8).map(s => ({
    state:    s.state_ut.length > 12 ? s.state_ut.slice(0, 12) + '…' : s.state_ut,
    chemical: s.chemical_alerts,
  })) || [];

  const radarData = summary ? [
    { param: 'Chemical', value: summary.chemical_alerts, fullMark: summary.total_samples },
    { param: 'Biological', value: summary.biological_alerts, fullMark: summary.total_samples },
    { param: 'Physical', value: summary.physical_concerns, fullMark: summary.total_samples },
    { param: 'Mixed', value: summary.mixed_hazards, fullMark: summary.total_samples },
    { param: 'Safe', value: summary.safe_samples, fullMark: summary.total_samples },
  ] : [];

  // Real Monthly Trends directly from verified database records
  const trendData = summary?.monthly_trends && summary.monthly_trends.length > 0
    ? summary.monthly_trends.map(t => ({
        month: t.month,
        safe: t.safe,
        chemical: t.chemical,
        biological: t.biological,
        physical: t.physical,
        total: t.total,
      }))
    : [];

  const radialData = summary ? [
    { name: 'Safe', value: summary.safe_percentage, fill: '#10b981' },
    { name: 'Chemical', value: summary.total_samples > 0 ? (summary.chemical_alerts / summary.total_samples * 100) : 0, fill: '#ef4444' },
    { name: 'Biological', value: summary.total_samples > 0 ? (summary.biological_alerts / summary.total_samples * 100) : 0, fill: '#f97316' },
    { name: 'Physical', value: summary.total_samples > 0 ? (summary.physical_concerns / summary.total_samples * 100) : 0, fill: '#eab308' },
  ] : [];

  // Real Severity breakdown per location from verified database records
  const severityStackData = summary?.severity_by_location && summary.severity_by_location.length > 0
    ? summary.severity_by_location.map(s => ({
        state: s.loc.length > 10 ? s.loc.slice(0, 10) + '…' : s.loc,
        critical: s.critical,
        high: s.high,
        moderate: s.moderate,
        low: s.low,
      }))
    : [];

  const generateSparkData = (base: number, variance: number) =>
    Array.from({ length: 12 }, () => Math.max(0, Math.round(base + (Math.sin(variance) * 0.1))));

  // Real Parameter Health directly from verified IS 10500 database compliance
  const parameterHealth = summary?.parameter_health && summary.parameter_health.length > 0
    ? summary.parameter_health
    : [];

  const totalAttention = summary ? (summary.biological_alerts + summary.chemical_alerts + summary.physical_concerns + summary.mixed_hazards) : 0;
  const attentionPct = summary && summary.total_samples > 0 ? (totalAttention / summary.total_samples * 100) : 0;

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
      {/* ═══ Welcome Header ═══ */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 24, flexWrap: 'wrap', gap: 16
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
              padding: '8px 12px', borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(0, 210, 255, 0.3)',
            }}>
              <Activity size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', color: '#fff', margin: 0 }}>
                {selectedDistrict
                  ? `${selectedDistrict}, ${selectedState}`
                  : selectedState
                  ? `${selectedState} Water Quality`
                  : 'National Water Quality Dashboard'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-secondary)', fontSize: '0.88rem', marginTop: 2 }}>
                <MapPin size={14} color="var(--color-primary)" />
                <span>
                  {selectedDistrict ? `${selectedDistrict} District, ${selectedState}` : selectedState ? `${selectedState} State Analytics` : 'All-India Surveillance (36 States & UTs)'}
                </span>
                {summary && (
                  <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 12, color: 'var(--color-primary)' }}>
                    {summary.total_samples.toLocaleString()} verified samples
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Global actions: Export, Refresh, Live Map */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn-secondary" style={{ padding: '8px 18px', fontSize: '0.82rem' }}
            onClick={() => navigate('/reports')}>
            <Download size={14} /> Export
          </button>
          <button className="btn-secondary" style={{ padding: '8px 18px', fontSize: '0.82rem' }}
            onClick={() => {
              const seq = ++fetchSeqRef.current;
              setLoadingSummary(true);
              const params: any = {};
              if (selectedState) params.state = selectedState;
              if (selectedDistrict) params.district = selectedDistrict;
              getDashboardSummary(Object.keys(params).length > 0 ? params : undefined)
                .then(res => { if (fetchSeqRef.current === seq) setSummary(res); })
                .finally(() => { if (fetchSeqRef.current === seq) setLoadingSummary(false); });
            }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.82rem' }}
            onClick={() => navigate('/citizen/map')}>
            <MapPin size={14} /> Live Map
          </button>
        </div>
      </div>

      {/* ═══ Geographic Location Filter Bar ═══ */}
      <div className="card" style={{
        padding: '16px 20px',
        marginBottom: 24,
        background: 'rgba(9, 20, 40, 0.7)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 210, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#38bdf8', fontSize: '0.85rem', fontWeight: 700 }}>
            <Filter size={16} /> Filter Geographic Scope:
          </div>

          {/* Quick All-India Button */}
          <button
            type="button"
            onClick={() => {
              setSelectedState('');
              setSelectedDistrict('');
            }}
            style={{
              background: !selectedState ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' : 'rgba(255,255,255,0.06)',
              color: !selectedState ? '#fff' : 'var(--color-text-secondary)',
              border: '1px solid ' + (!selectedState ? 'transparent' : 'rgba(255,255,255,0.1)'),
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s',
            }}
          >
            <Database size={13} /> 🇮🇳 All-India
          </button>

          {/* Quick Home State Button (if profile has location) */}
          {userHomeState && (
            <button
              type="button"
              onClick={() => {
                setSelectedState(userHomeState);
                if (userHomeDistrict) setSelectedDistrict(userHomeDistrict);
              }}
              style={{
                background: selectedState === userHomeState && (!userHomeDistrict || selectedDistrict === userHomeDistrict)
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'rgba(255,255,255,0.06)',
                color: selectedState === userHomeState ? '#fff' : 'var(--color-text-secondary)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
              }}
            >
              <MapPin size={13} /> My Region ({userHomeDistrict ? `${userHomeDistrict}, ` : ''}{userHomeState})
            </button>
          )}

          {/* State Dropdown Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <select
              value={selectedState}
              onChange={e => {
                setSelectedState(e.target.value);
                setSelectedDistrict('');
              }}
              aria-label="Select State or Union Territory"
              style={{
                background: '#0a192f',
                color: '#e2e8f0',
                border: '1px solid rgba(0, 210, 255, 0.3)',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                minWidth: 180,
              }}
            >
              <option value="">— Select State / UT (36) —</option>
              {availableStates.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* District Dropdown Selector (Active when a state is chosen) */}
          {selectedState && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <select
                value={selectedDistrict}
                onChange={e => setSelectedDistrict(e.target.value)}
                aria-label={`Select District in ${selectedState}`}
                style={{
                  background: '#0a192f',
                  color: '#e2e8f0',
                  border: '1px solid rgba(0, 210, 255, 0.3)',
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: 170,
                }}
              >
                <option value="">All Districts in {selectedState}</option>
                {availableDistricts.map(dt => (
                  <option key={dt} value={dt}>{dt}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Active Scope Badge */}
        <div style={{
          fontSize: '0.75rem',
          color: selectedState ? '#38bdf8' : '#94a3b8',
          background: selectedState ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255,255,255,0.05)',
          padding: '4px 12px',
          borderRadius: 20,
          border: '1px solid ' + (selectedState ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.08)'),
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: selectedState ? '#38bdf8' : '#10b981' }} />
          Active Dataset: <strong>{selectedDistrict ? `${selectedDistrict}, ${selectedState}` : selectedState ? selectedState : 'National (All-India)'}</strong>
        </div>
      </div>

      {/* ═══ Latest Status + Safety Score ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, marginBottom: 28 }}>
        {/* Status Card */}
        <div className="card" style={{
          padding: '28px 32px', position: 'relative', overflow: 'hidden',
          borderTop: `3px solid ${statusColor}`,
        }}>
          <div style={{
            position: 'absolute', top: -30, right: -30, width: 150, height: 150,
            background: `radial-gradient(circle, ${statusColor}15, transparent 70%)`,
          }} />
          <div style={{
            fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-secondary)',
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16
          }}>
            Latest Water Status — {selectedDistrict ? `${selectedDistrict} District` : (selectedState || 'All India Overview')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: `${statusColor}20`, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 25px ${statusColor}30`,
            }}>
              {statusText === 'SAFE' ? <CheckCircle2 size={32} color={statusColor} /> : <AlertTriangle size={32} color={statusColor} />}
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: statusColor, lineHeight: 1 }}>
                {statusText}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                {statusLabel}
              </div>
            </div>
          </div>

          {/* Mini stats row */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{
              background: 'rgba(255,255,255,0.03)', borderRadius: 10,
              padding: '10px 16px', flex: '1 1 120px',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>Active Alerts</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: alerts.length > 0 ? '#ef4444' : '#10b981' }}>{alerts.length}</div>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.03)', borderRadius: 10,
              padding: '10px 16px', flex: '1 1 120px',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>Scope</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>{selectedDistrict || selectedState || 'National'}</div>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.03)', borderRadius: 10,
              padding: '10px 16px', flex: '1 1 120px',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>Region</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>{selectedState || 'All India'}</div>
            </div>
          </div>
        </div>

        {/* Safety Gauge */}
        {summary && (
          <div className="card" style={{
            padding: '24px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'radial-gradient(circle at 50% 30%, rgba(16,185,129,0.08), transparent 70%)',
            }} />
            <h3 style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary)',
              marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {selectedState ? `${selectedState} Safety Score` : 'National Safety Score'}
            </h3>
            <SafetyGauge percentage={summary.safe_percentage} />
            <div style={{ marginTop: 12, textAlign: 'center', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
              <strong style={{ color: '#10b981' }}>{summary.safe_samples.toLocaleString()}</strong> of {summary.total_samples.toLocaleString()} safe
            </div>
          </div>
        )}
      </div>

      {/* ═══ National/State KPI Grid ═══ */}
      {summary && (
        <>
          {/* Attention Banner */}
          {totalAttention > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(239, 68, 68, 0.08))',
              border: '1px solid rgba(201,130,0,0.25)',
              borderRadius: 16, padding: '16px 24px', marginBottom: 24,
              display: 'flex', alignItems: 'flex-start', gap: 16,
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{
                background: 'rgba(245, 158, 11, 0.2)', borderRadius: 12,
                padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <AlertTriangle size={20} color="#f59e0b" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fbbf24', marginBottom: 6 }}>
                  ⚠ {totalAttention.toLocaleString()} samples need attention {selectedDistrict ? `in ${selectedDistrict}, ${selectedState}` : selectedState ? `in ${selectedState}` : 'nationally'} ({formatPercentage(attentionPct)})
                </div>

                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.78rem' }}>
                  {summary.chemical_alerts > 0 && (
                    <span style={{ color: '#fca5a5', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FlaskConical size={12} /> {summary.chemical_alerts.toLocaleString()} chemical
                    </span>
                  )}
                  {summary.biological_alerts > 0 && (
                    <span style={{ color: '#fde68a', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Bug size={12} /> {summary.biological_alerts.toLocaleString()} biological
                    </span>
                  )}
                  {summary.mixed_hazards > 0 && (
                    <span style={{ color: '#fca5a5', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertOctagon size={12} /> {summary.mixed_hazards.toLocaleString()} mixed
                    </span>
                  )}
                  {summary.physical_concerns > 0 && (
                    <span style={{ color: '#fde68a', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Waves size={12} /> {summary.physical_concerns.toLocaleString()} physical
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
            <KpiCard icon={Database} label="Total Samples" value={summary.total_samples}
              accent="var(--color-primary)" trend="up"
              sparkData={generateSparkData(summary.total_samples / 12, summary.total_samples / 30)} />
            <KpiCard icon={CheckCircle} label="Safe Samples" value={summary.safe_samples}
              sub={formatPercentage(summary.safe_percentage)} accent="#10b981" trend="up"
              sparkData={generateSparkData(summary.safe_samples / 12, summary.safe_samples / 30)}
              onClick={() => navigate('/citizen/explorer?category=POTABLE_SAFE')} />
            <KpiCard icon={FlaskConical} label="Chemical Issues" value={summary.chemical_alerts}
              accent="#ef4444" trend="down"
              sparkData={generateSparkData(summary.chemical_alerts / 12, summary.chemical_alerts / 20)}
              onClick={() => navigate('/citizen/alerts?category=CRITICAL_CHEMICAL_TOXIN')} />
            <KpiCard icon={Bug} label="Biological" value={summary.biological_alerts}
              accent="#f97316" trend="down"
              sparkData={generateSparkData(summary.biological_alerts / 12, summary.biological_alerts / 20)}
              onClick={() => navigate('/citizen/alerts?category=UNSAFE_BIOLOGICAL_PATHOGEN')} />
            <KpiCard icon={Waves} label="Physical" value={summary.physical_concerns}
              accent="#eab308"
              sparkData={generateSparkData(summary.physical_concerns / 12, summary.physical_concerns / 20)}
              onClick={() => navigate('/citizen/alerts?category=MODERATE_PHYSICAL_PARAM')} />
            <KpiCard icon={AlertOctagon} label="Mixed Hazards" value={summary.mixed_hazards}
              accent="#dc2626" trend="down"
              sparkData={generateSparkData(summary.mixed_hazards / 12, summary.mixed_hazards / 20)}
              onClick={() => navigate('/citizen/alerts?category=CRITICAL_MIXED_HAZARD')} />
          </div>

          {/* Do Not Boil Banner */}
          {summary.do_not_boil_alerts > 0 && (
            <div className="dnb-banner" style={{
              padding: '12px 20px', marginBottom: 24,
              fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <Ban size={16} />
              <span>
                <strong>{summary.do_not_boil_alerts.toLocaleString()} samples</strong> ({formatPercentage(summary.do_not_boil_percentage)})
                — chemical contamination where boiling is not effective. Proper filtration required.
              </span>
            </div>
          )}

          {/* ═══ Main Charts Row — Trends + Radar ═══ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24, marginBottom: 28 }}>
            {/* Area Chart — Monthly Trends */}
            <div className="card" style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', margin: 0, marginBottom: 4 }}>
                    Monthly Quality Trends
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                    Contamination levels across the year
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: 20, background: 'rgba(0,210,255,0.15)', color: 'var(--color-primary)', fontWeight: 600 }}>12M</span>
                  <span style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>6M</span>
                  <span style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>3M</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="gradSafe2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradChem2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradBio2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradPhys2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(val: any) => [Number(val).toLocaleString(), '']} />
                  <Area type="monotone" dataKey="safe" stroke="#10b981" fill="url(#gradSafe2)" strokeWidth={2} name="Safe" />
                  <Area type="monotone" dataKey="chemical" stroke="#ef4444" fill="url(#gradChem2)" strokeWidth={2} name="Chemical" />
                  <Area type="monotone" dataKey="biological" stroke="#f97316" fill="url(#gradBio2)" strokeWidth={2} name="Biological" />
                  <Area type="monotone" dataKey="physical" stroke="#eab308" fill="url(#gradPhys2)" strokeWidth={2} name="Physical" />
                  <Legend
                    formatter={(value: string) => <span style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 500 }}>{value}</span>}
                    iconType="circle" iconSize={8}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Radar Chart */}
            <div className="card" style={{ padding: '24px 28px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', margin: 0, marginBottom: 4 }}>
                Contamination Profile
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: 0, marginBottom: 16 }}>
                Multi-parameter risk analysis
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="param" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Radar name="Contamination" dataKey="value" stroke="#00d2ff" fill="#00d2ff" fillOpacity={0.2} strokeWidth={2} />
                  <Tooltip contentStyle={tooltipStyle} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ═══ Second Charts Row — Pie + States + Radial ═══ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 28 }}>
            {/* Pie Chart */}
            <div className="card" style={{ padding: '24px 28px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', margin: 0, marginBottom: 4 }}>
                Quality Distribution
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: 0, marginBottom: 8 }}>
                Sample categorization
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={90} innerRadius={50}
                    label={({ percent }: { percent?: number }) => `${((percent ?? 0) * 100).toFixed(1)}%`}
                    labelLine={{ stroke: '#475569' }}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[entry.category] || '#94A3B8'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle}
                    formatter={(val) => [Number(val).toLocaleString(), 'Samples']} />
                  <Legend
                    formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 500 }}>{value}</span>}
                    iconType="circle" iconSize={8}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Chemical States/Districts Bar */}
            <div className="card" style={{ padding: '24px 28px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', margin: 0, marginBottom: 4 }}>
                {selectedState ? `Chemical Alerts in ${selectedState}` : 'Chemical Alerts by State'}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: 0, marginBottom: 8 }}>
                {selectedState ? 'Top affected districts' : 'Top affected regions'}
              </p>

              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stateBarData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <defs>
                    <linearGradient id="barGrad2" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3a7bd5" />
                      <stop offset="100%" stopColor="#00d2ff" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis type="category" dataKey="state" tick={{ fill: '#94a3b8', fontSize: 11 }} width={85} />
                  <Tooltip contentStyle={tooltipStyle}
                    formatter={(val) => [Number(val).toLocaleString(), 'Alerts']} />
                  <Bar dataKey="chemical" fill="url(#barGrad2)" radius={[0, 6, 6, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Radial Bar */}
            <div className="card" style={{ padding: '24px 28px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', margin: 0, marginBottom: 4 }}>
                Category Breakdown
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: 0, marginBottom: 8 }}>
                Percentage distribution
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="25%" outerRadius="90%" data={radialData} startAngle={90} endAngle={-270}>
                  <RadialBar background={{ fill: 'rgba(255,255,255,0.03)' }}
                    dataKey="value" cornerRadius={8} />
                  <Tooltip contentStyle={tooltipStyle}
                    formatter={(val: any) => [`${Number(val).toFixed(1)}%`, '']} />
                  <Legend
                    formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 500 }}>{value}</span>}
                    iconType="circle" iconSize={8}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ═══ Third Row — Severity + Parameter Health ═══ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 28 }}>
            {/* Stacked Severity */}
            <div className="card" style={{ padding: '24px 28px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', margin: 0, marginBottom: 4 }}>
                {selectedState ? `Severity by District (${selectedState})` : 'Severity by State (National)'}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: 0, marginBottom: 8 }}>
                {selectedState ? 'District risk breakdown' : 'Regional risk breakdown'}
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={severityStackData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="state" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="low" stackId="sev" fill="#60a5fa" barSize={22} name="Low" />
                  <Bar dataKey="moderate" stackId="sev" fill="#eab308" name="Moderate" />
                  <Bar dataKey="high" stackId="sev" fill="#f97316" name="High" />
                  <Bar dataKey="critical" stackId="sev" fill="#ef4444" radius={[4, 4, 0, 0]} name="Critical" />
                  <Legend
                    formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 500 }}>{value}</span>}
                    iconType="square" iconSize={8}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Severity Distribution */}
            <div className="card" style={{ padding: '24px 28px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', margin: 0, marginBottom: 4 }}>
                Alert Severity
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: 0, marginBottom: 8 }}>
                Overall severity distribution
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={summary.severity_distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="severity" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle}
                    formatter={(val) => [Number(val).toLocaleString(), 'Samples']} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={36}>
                    {summary.severity_distribution.map((entry, index) => {
                      let color = '#10b981';
                      if (entry.severity === 'LOW') color = '#60a5fa';
                      if (entry.severity === 'MODERATE') color = '#eab308';
                      if (entry.severity === 'HIGH') color = '#f97316';
                      if (entry.severity === 'CRITICAL') color = '#ef4444';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Parameter Health */}
            <div className="card" style={{ padding: '24px 28px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', margin: 0, marginBottom: 4 }}>
                Parameter Health
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: 0, marginBottom: 16 }}>
                IS 10500 compliance
              </p>
              {parameterHealth.map(p => (
                <ParameterBar key={p.name} {...p} />
              ))}
              <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.7rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981' }} /> Safe
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#eab308' }} /> Warning
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#ef4444' }} /> Danger
                </span>
              </div>
            </div>
          </div>

          {/* ═══ Water Source Analysis ═══ */}
          <div className="card" style={{ padding: '24px 28px', marginBottom: 28 }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', margin: 0, marginBottom: 4 }}>
              Water Source Analysis
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: 0, marginBottom: 16 }}>
              Sample distribution by source type
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {summary.source_distribution.map((s, idx) => {
                const colors = ['#00d2ff', '#10b981', '#8b5cf6', '#f97316', '#ef4444', '#eab308'];
                const color = colors[idx % colors.length];
                return (
                  <div key={s.source} style={{
                    background: 'rgba(255,255,255,0.03)', borderRadius: 12,
                    padding: '14px 18px', border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>{s.source || 'Unknown'}</span>
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 700, color,
                        background: `${color}20`, padding: '3px 10px', borderRadius: 20
                      }}>{s.percentage}%</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 6, height: 6, marginBottom: 6 }}>
                      <div style={{
                        background: `linear-gradient(90deg, ${color}80, ${color})`,
                        borderRadius: 6, height: 6, width: `${s.percentage}%`,
                        transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: `0 0 8px ${color}40`,
                      }} />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      {s.count.toLocaleString()} samples
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ═══ Scientific Lab Analysis & Purification Pictures Section ═══ */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <FlaskConical size={22} color="var(--color-primary)" />
              Water Quality Analysis & Purification Infrastructure
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.86rem', margin: 0 }}>
              Certified laboratory spectrometry, chemical hazard tracking, and regional filtration pipelines
            </p>
          </div>
          <span style={{
            background: 'rgba(0, 210, 255, 0.1)',
            border: '1px solid rgba(0, 210, 255, 0.25)',
            color: 'var(--color-primary)',
            padding: '4px 12px', borderRadius: 20,
            fontSize: '0.75rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            Live Sensors Active
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 24,
        }}>
          {/* Picture Card 1: Spectrometry Lab */}
          <div className="card card-hover" style={{ overflow: 'hidden', padding: 0, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
              <img
                src="/water_lab_analysis.jpg"
                alt="Automated Water Testing Laboratory"
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  transition: 'transform 0.5s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, rgba(9,20,40,0.2) 0%, rgba(9,20,40,0.85) 100%)',
              }} />
              <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 8 }}>
                <span style={{
                  background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
                  color: '#38bdf8', fontSize: '0.72rem', fontWeight: 700,
                  padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(56,189,248,0.3)',
                  display: 'flex', alignItems: 'center', gap: 5
                }}>
                  <Zap size={12} /> Spectrophotometric Assay
                </span>
              </div>
              <div style={{ position: 'absolute', bottom: 12, left: 16, right: 16 }}>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                  Digital Laboratory Telemetry
                </div>
                <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                  Microbial pathogens & trace heavy metal profiling
                </div>
              </div>
            </div>

            <div style={{ padding: '20px 24px' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
                marginBottom: 16, textAlign: 'center'
              }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 8px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>pH Level</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981', marginTop: 2 }}>7.41 pH</div>
                  <div style={{ fontSize: '0.65rem', color: '#10b981' }}>Optimal</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 8px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Turbidity</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0ea5e9', marginTop: 2 }}>0.12 NTU</div>
                  <div style={{ fontSize: '0.65rem', color: '#0ea5e9' }}>Crystal Clear</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 8px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Dissolved TDS</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#8b5cf6', marginTop: 2 }}>115 mg/L</div>
                  <div style={{ fontSize: '0.65rem', color: '#8b5cf6' }}>Pure Mineral</div>
                </div>
              </div>

              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
                Every sample is classified deterministically according to strict WHO and Bureau of Indian Standards (BIS IS:10500) water safety protocols.
              </p>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn-secondary"
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.78rem', justifyContent: 'center' }}
                  onClick={() => navigate('/citizen/explorer')}
                >
                  <Eye size={14} /> Explore Samples
                </button>
                <button
                  className="btn-primary"
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.78rem', justifyContent: 'center' }}
                  onClick={() => navigate('/reports')}
                >
                  <Download size={14} /> Full Lab Audit
                </button>
              </div>
            </div>
          </div>

          {/* Picture Card 2: Purification Infrastructure */}
          <div className="card card-hover" style={{ overflow: 'hidden', padding: 0, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
              <img
                src="/water_purification_plant.jpg"
                alt="Smart Municipal UV-C Purification Plant"
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  transition: 'transform 0.5s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, rgba(9,20,40,0.2) 0%, rgba(9,20,40,0.85) 100%)',
              }} />
              <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 8 }}>
                <span style={{
                  background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
                  color: '#10b981', fontSize: '0.72rem', fontWeight: 700,
                  padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(16,185,129,0.3)',
                  display: 'flex', alignItems: 'center', gap: 5
                }}>
                  <ShieldCheck size={12} /> Smart UV-C Disinfection
                </span>
              </div>
              <div style={{ position: 'absolute', bottom: 12, left: 16, right: 16 }}>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                  Regional Water Purification Plant
                </div>
                <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                  Multi-barrier reverse osmosis & ultraviolet disinfection
                </div>
              </div>
            </div>

            <div style={{ padding: '20px 24px' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
                marginBottom: 16, textAlign: 'center'
              }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 8px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Purification Rate</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981', marginTop: 2 }}>99.99%</div>
                  <div style={{ fontSize: '0.65rem', color: '#10b981' }}>Pathogen Free</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 8px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Throughput</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#00d2ff', marginTop: 2 }}>1,250 L/h</div>
                  <div style={{ fontSize: '0.65rem', color: '#00d2ff' }}>Continuous</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 8px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Chlorine Residual</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>0.15 ppm</div>
                  <div style={{ fontSize: '0.65rem', color: '#f59e0b' }}>Protected</div>
                </div>
              </div>

              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
                Automated dosing monitors prevent biological pathogens like E. Coli and Coliform bacteria from entering community distribution pipelines.
              </p>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn-secondary"
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.78rem', justifyContent: 'center' }}
                  onClick={() => navigate('/citizen/map')}
                >
                  <MapPin size={14} /> View Safe Sources
                </button>
                <button
                  className="btn-primary"
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.78rem', justifyContent: 'center', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}
                  onClick={() => {
                    const phone = '1800-180-1551';
                    window.location.href = `tel:${phone}`;
                  }}
                >
                  <Waves size={14} /> Water Helpline
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Recent Alerts (District-specific) ═══ */}
      <div className="card" style={{ marginBottom: 28, overflow: 'hidden' }}>
        <div style={{
          padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Droplets size={18} color="var(--color-primary)" /> Recent Alerts — {selectedDistrict ? `${selectedDistrict}, ${selectedState}` : selectedState ? selectedState : 'National (All-India)'}
          </h3>
          <Link to="/citizen/alerts" style={{
            fontSize: '0.8rem', color: 'var(--color-primary)', textDecoration: 'none',
            fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4
          }}>
            View All <ArrowUpRight size={14} />
          </Link>
        </div>

        {loadingAlerts ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div style={{ padding: '32px 28px', textAlign: 'center' }}>
            <CheckCircle2 size={40} color="#10b981" style={{ marginBottom: 12, opacity: 0.6 }} />
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              No recent water quality alerts {selectedDistrict ? `in ${selectedDistrict}` : selectedState ? `in ${selectedState}` : 'nationally'}. Water appears safe! 💧
            </div>
          </div>
        ) : (
          <div>
            {alerts.map((alert, i) => {
              const sevColor = alert.severity === 'CRITICAL' ? '#ef4444' : alert.severity === 'HIGH' ? '#f97316' : '#eab308';
              return (
                <div key={alert.id} style={{
                  padding: '16px 28px',
                  borderBottom: i < alerts.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  transition: 'background 0.2s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: `${sevColor}15`, display: 'flex',
                      alignItems: 'center', justifyContent: 'center'
                    }}>
                      <AlertTriangle size={18} color={sevColor} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>
                          {alert.severity} Water Quality Alert
                        </span>
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px',
                          borderRadius: 6, background: `${sevColor}20`, color: sevColor,
                          textTransform: 'uppercase',
                        }}>{alert.severity}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={11} /> {alert.village || 'Unknown location'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} /> {alert.sample_date || alert.created_at?.substring(0,10)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link to={`/citizen/sample/${alert.id}`} className="btn-secondary"
                    style={{ padding: '6px 16px', fontSize: '0.78rem', textDecoration: 'none', borderRadius: 20 }}>
                    View Details
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ Quick Actions ═══ */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Zap size={18} color="var(--color-primary)" /> Quick Actions
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          <QuickAction icon={LineChartIcon} label="Trends Analysis"
            description="Historical patterns & safety parameters over time"
            gradient={GRADIENT_COLORS.primary}
            onClick={() => navigate('/analytics/trends')} />
          <QuickAction icon={TrendingUp} label="Predictive Forecast"
            description="AI-powered contamination level projections"
            gradient={GRADIENT_COLORS.warning}
            onClick={() => navigate('/analytics/forecast')} />
          <QuickAction icon={BarChart2} label="Location Comparison"
            description="Benchmark districts on quality parameters"
            gradient={GRADIENT_COLORS.purple}
            onClick={() => navigate('/analytics/compare')} />
          <QuickAction icon={FileDown} label="Export Reports"
            description="Download analytical data in PDF, Excel, CSV"
            gradient={GRADIENT_COLORS.safe}
            onClick={() => navigate('/reports')} />
          <QuickAction icon={MapPin} label="Interactive Map"
            description="Geo-visualize contamination hotspots nationwide"
            gradient={GRADIENT_COLORS.info}
            onClick={() => navigate('/citizen/map')} />
          <QuickAction icon={Eye} label="Sample Explorer"
            description="Browse & filter all water quality samples"
            gradient={GRADIENT_COLORS.danger}
            onClick={() => navigate('/citizen/explorer')} />
          <QuickAction icon={Filter} label="Alert Center"
            description="View and manage active contamination alerts"
            gradient={{ start: '#f472b6', end: '#db2777' }}
            onClick={() => navigate('/citizen/alerts')} />
          <QuickAction icon={Share2} label="Share Dashboard"
            description="Generate public link for community access"
            gradient={{ start: '#a78bfa', end: '#7c3aed' }}
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              alert('Dashboard link copied to clipboard!');
            }} />
        </div>
      </div>

      {/* ═══ Footer Note ═══ */}
      <div style={{
        padding: '14px 24px',
        background: 'rgba(0, 210, 255, 0.05)',
        borderRadius: 12,
        border: '1px solid rgba(0, 210, 255, 0.15)',
        fontSize: '0.82rem',
        color: 'var(--color-text-secondary)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <ShieldCheck size={18} color="var(--color-primary)" />
        <span>
          <strong style={{ color: 'var(--color-text)' }}>Safety Architecture:</strong> All classifications are computed deterministically by the rule engine.
          AI translation operates strictly in the presentation layer.
        </span>
      </div>
    </div>
  );
}
