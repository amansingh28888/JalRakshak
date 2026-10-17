import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, AreaChart, Area, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, RadialBarChart,
  RadialBar
} from 'recharts';
import {
  Droplets, AlertTriangle, FlaskConical, Bug,
  AlertOctagon, Waves, Database, CheckCircle,
  Ban, ShieldCheck, LineChart as LineChartIcon, TrendingUp, BarChart2, FileDown,
  Activity, MapPin, Zap, Eye, Download, RefreshCw,
  ArrowUpRight, ArrowDownRight, Filter, Share2
} from 'lucide-react';
import { getDashboardSummary } from '../api';
import type { DashboardSummary } from '../types';
import { getCategoryConfig, formatPercentage } from '../utils/display';

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
    let animId: number;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * value));
      if (progress < 1) animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
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
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity={1} />
            <stop offset="100%" stopColor={color} stopOpacity={0.5} />
          </linearGradient>
          <filter id="gaugeGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.05)"
          strokeWidth={stroke} />
        <circle cx="100" cy="100" r={radius} fill="none" stroke="url(#gaugeGradient)"
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={dashOffset}
          filter="url(#gaugeGlow)"
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
        minHeight: 160,
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
   MAIN DASHBOARD COMPONENT
   ════════════════════════════════════════════════════════════════ */

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  /* ── Loading state ─────────────────────────────────────────── */
  if (loading) return (
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
        Analyzing water quality data...
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

  if (error) return (
    <div className="card" style={{ padding: 24, color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: 12 }}>
      <AlertTriangle size={24} />
      <span>Failed to load dashboard: {error}</span>
    </div>
  );

  if (!summary) return null;

  const totalAttention = summary.biological_alerts + summary.chemical_alerts + summary.physical_concerns + summary.mixed_hazards;
  const attentionPct   = summary.total_samples > 0 ? (totalAttention / summary.total_samples * 100) : 0;

  /* ── Chart data preparations ───────────────────────────────── */
  const pieData = summary.category_distribution.map(c => ({
    name:     getCategoryConfig(c.category).label,
    value:    c.count,
    category: c.category,
  }));

  const stateBarData = summary.top_chemical_states.slice(0, 8).map(s => ({
    state:    s.state_ut.length > 12 ? s.state_ut.slice(0, 12) + '…' : s.state_ut,
    chemical: s.chemical_alerts,
  }));

  // Radar data for contamination breakdown
  const radarData = [
    { param: 'Chemical', value: summary.chemical_alerts, fullMark: summary.total_samples },
    { param: 'Biological', value: summary.biological_alerts, fullMark: summary.total_samples },
    { param: 'Physical', value: summary.physical_concerns, fullMark: summary.total_samples },
    { param: 'Mixed', value: summary.mixed_hazards, fullMark: summary.total_samples },
    { param: 'Safe', value: summary.safe_samples, fullMark: summary.total_samples },
  ];

  // Real Monthly Trends directly from verified database records
  const trendData = summary.monthly_trends && summary.monthly_trends.length > 0
    ? summary.monthly_trends.map(t => ({
        month: t.month,
        safe: t.safe,
        chemical: t.chemical,
        biological: t.biological,
        physical: t.physical,
        total: t.total,
      }))
    : [];

  // Radial bar for category summary
  const radialData = [
    { name: 'Safe', value: summary.safe_percentage, fill: '#10b981' },
    { name: 'Chemical', value: summary.total_samples > 0 ? (summary.chemical_alerts / summary.total_samples * 100) : 0, fill: '#ef4444' },
    { name: 'Biological', value: summary.total_samples > 0 ? (summary.biological_alerts / summary.total_samples * 100) : 0, fill: '#f97316' },
    { name: 'Physical', value: summary.total_samples > 0 ? (summary.physical_concerns / summary.total_samples * 100) : 0, fill: '#eab308' },
  ];

  // Real Severity breakdown per location from verified database records
  const severityStackData = summary.severity_by_location && summary.severity_by_location.length > 0
    ? summary.severity_by_location.map(s => ({
        state: s.loc.length > 10 ? s.loc.slice(0, 10) + '…' : s.loc,
        critical: s.critical,
        high: s.high,
        moderate: s.moderate,
        low: s.low,
      }))
    : [];

  // Deterministic sparkline data without Math.random
  const generateSparkData = (base: number, variance: number) =>
    Array.from({ length: 12 }, () => Math.max(0, Math.round(base + (Math.sin(variance) * 0.1))));

  // Real Parameter Health directly from verified IS 10500 database compliance
  const parameterHealth = summary.parameter_health && summary.parameter_health.length > 0
    ? summary.parameter_health
    : [];

  const tooltipStyle = {
    background: 'rgba(9, 20, 40, 0.95)',
    border: '1px solid rgba(0, 210, 255, 0.2)',
    borderRadius: 12,
    color: '#e0f2fe',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(10px)',
    padding: '12px 16px',
  };

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
      {/* ═══ Header Section ═══ */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 28, flexWrap: 'wrap', gap: 16
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
            <h1 style={{ fontSize: '1.75rem', color: '#fff', margin: 0 }}>
              Analytics Dashboard
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Real-time water quality monitoring across <strong style={{ color: 'var(--color-primary)' }}>{summary.total_states} states</strong> & <strong style={{ color: 'var(--color-primary)' }}>{summary.total_districts} districts</strong> • IS 10500:2012
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn-secondary" style={{ padding: '8px 18px', fontSize: '0.82rem' }}
            onClick={() => navigate('/reports')}>
            <Download size={14} /> Export
          </button>
          <button className="btn-secondary" style={{ padding: '8px 18px', fontSize: '0.82rem' }}
            onClick={() => window.location.reload()}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.82rem' }}
            onClick={() => navigate('/citizen/map')}>
            <MapPin size={14} /> Live Map
          </button>
        </div>
      </div>

      {/* ═══ Attention Banner ═══ */}
      {totalAttention > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(239, 68, 68, 0.08))',
          border: '1px solid rgba(201,130,0,0.25)',
          borderRadius: 16, padding: '18px 24px', marginBottom: 28,
          display: 'flex', alignItems: 'flex-start', gap: 16,
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', top: -20, right: -20, width: 100, height: 100,
            background: 'radial-gradient(circle, rgba(245,158,11,0.15), transparent 70%)',
          }} />
          <div style={{
            background: 'rgba(245, 158, 11, 0.2)', borderRadius: 12,
            padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <AlertTriangle size={22} color="#f59e0b" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fbbf24', marginBottom: 8 }}>
              ⚠ {totalAttention.toLocaleString()} samples require attention ({formatPercentage(attentionPct)})
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: '0.82rem' }}>
              {summary.chemical_alerts > 0 && (
                <span style={{ color: '#fca5a5', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FlaskConical size={13} /> {summary.chemical_alerts.toLocaleString()} chemical
                </span>
              )}
              {summary.biological_alerts > 0 && (
                <span style={{ color: '#fde68a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Bug size={13} /> {summary.biological_alerts.toLocaleString()} biological
                </span>
              )}
              {summary.mixed_hazards > 0 && (
                <span style={{ color: '#fca5a5', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertOctagon size={13} /> {summary.mixed_hazards.toLocaleString()} mixed hazard
                </span>
              )}
              {summary.physical_concerns > 0 && (
                <span style={{ color: '#fde68a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Waves size={13} /> {summary.physical_concerns.toLocaleString()} physical
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Water Safety Score + KPI Grid ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, marginBottom: 28 }}>
        {/* Safety Score Card */}
        <div className="card" style={{
          padding: '28px 24px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(circle at 50% 30%, rgba(16,185,129,0.08), transparent 70%)',
          }} />
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)',
            marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Water Safety Score
          </h3>
          <SafetyGauge percentage={summary.safe_percentage} />
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              <strong style={{ color: '#10b981' }}>{summary.safe_samples.toLocaleString()}</strong> of {summary.total_samples.toLocaleString()} samples safe
            </div>
          </div>
        </div>

        {/* KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <KpiCard icon={Database} label="Total Samples Analyzed" value={summary.total_samples}
            accent="var(--color-primary)" trend="up"
            sparkData={generateSparkData(summary.total_samples / 12, summary.total_samples / 30)} />
          <KpiCard icon={CheckCircle} label="Safe to Drink" value={summary.safe_samples}
            sub={formatPercentage(summary.safe_percentage)} accent="#10b981" trend="up"
            sparkData={generateSparkData(summary.safe_samples / 12, summary.safe_samples / 30)}
            onClick={() => navigate('/samples?category=POTABLE_SAFE')} />
          <KpiCard icon={FlaskConical} label="Chemical Contamination" value={summary.chemical_alerts}
            accent="#ef4444" trend="down"
            sparkData={generateSparkData(summary.chemical_alerts / 12, summary.chemical_alerts / 20)}
            onClick={() => navigate('/alerts?category=CRITICAL_CHEMICAL_TOXIN')} />
          <KpiCard icon={Bug} label="Biological Pathogen" value={summary.biological_alerts}
            accent="#f97316" trend="down"
            sparkData={generateSparkData(summary.biological_alerts / 12, summary.biological_alerts / 20)}
            onClick={() => navigate('/alerts?category=UNSAFE_BIOLOGICAL_PATHOGEN')} />
          <KpiCard icon={Waves} label="Physical Parameters" value={summary.physical_concerns}
            accent="#eab308"
            sparkData={generateSparkData(summary.physical_concerns / 12, summary.physical_concerns / 20)}
            onClick={() => navigate('/alerts?category=MODERATE_PHYSICAL_PARAM')} />
          <KpiCard icon={AlertOctagon} label="Mixed Hazards" value={summary.mixed_hazards}
            accent="#dc2626" trend="down"
            sparkData={generateSparkData(summary.mixed_hazards / 12, summary.mixed_hazards / 20)}
            onClick={() => navigate('/alerts?category=CRITICAL_MIXED_HAZARD')} />
        </div>
      </div>

      {/* ═══ Do Not Boil Banner ═══ */}
      {summary.do_not_boil_alerts > 0 && (
        <div className="dnb-banner" style={{
          padding: '14px 20px', marginBottom: 28,
          fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <Ban size={18} />
          <span>
            <strong>{summary.do_not_boil_alerts.toLocaleString()} samples</strong> ({formatPercentage(summary.do_not_boil_percentage)})
            have chemical contamination where boiling is not effective. Proper filtration required.
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
              <span style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: 20, background: 'rgba(0,210,255,0.15)', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }}>12M</span>
              <span style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-secondary)', fontWeight: 600, cursor: 'pointer' }}>6M</span>
              <span style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-secondary)', fontWeight: 600, cursor: 'pointer' }}>3M</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="gradSafe" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradChem" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradBio" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradPhys" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(val: any) => [Number(val).toLocaleString(), '']} />
              <Area type="monotone" dataKey="safe" stroke="#10b981" fill="url(#gradSafe)" strokeWidth={2} name="Safe" />
              <Area type="monotone" dataKey="chemical" stroke="#ef4444" fill="url(#gradChem)" strokeWidth={2} name="Chemical" />
              <Area type="monotone" dataKey="biological" stroke="#f97316" fill="url(#gradBio)" strokeWidth={2} name="Biological" />
              <Area type="monotone" dataKey="physical" stroke="#eab308" fill="url(#gradPhys)" strokeWidth={2} name="Physical" />
              <Legend
                formatter={(value: string) => <span style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 500 }}>{value}</span>}
                iconType="circle" iconSize={8}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart — Contamination Profile */}
        <div className="card" style={{ padding: '24px 28px' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', margin: 0, marginBottom: 4 }}>
            Contamination Profile
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: 0, marginBottom: 16 }}>
            Multi-parameter risk analysis
          </p>
          <ResponsiveContainer width="100%" height={300}>
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

      {/* ═══ Second Charts Row — Distribution + Chemical States + Radial Bar ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 28 }}>
        {/* Pie Chart — Category Distribution */}
        <div className="card" style={{ padding: '24px 28px' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', margin: 0, marginBottom: 4 }}>
            Quality Distribution
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: 0, marginBottom: 8 }}>
            Sample categorization breakdown
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={95} innerRadius={55}
                label={({ percent }: { percent?: number }) => `${((percent ?? 0) * 100).toFixed(1)}%`}
                labelLine={{ stroke: '#475569' }}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[entry.category] || '#94A3B8'} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle}
                formatter={(val) => [Number(val).toLocaleString(), 'Samples']} />
              <Legend
                formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 500 }}>{value}</span>}
                iconType="circle" iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart — Top Chemical States */}
        <div className="card" style={{ padding: '24px 28px' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', margin: 0, marginBottom: 4 }}>
            Chemical Alerts by State
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: 0, marginBottom: 8 }}>
            Top affected regions
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stateBarData} layout="vertical" margin={{ left: 8, right: 16 }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3a7bd5" />
                  <stop offset="100%" stopColor="#00d2ff" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis type="category" dataKey="state" tick={{ fill: '#94a3b8', fontSize: 11 }} width={85} />
              <Tooltip contentStyle={tooltipStyle}
                formatter={(val) => [Number(val).toLocaleString(), 'Alerts']} />
              <Bar dataKey="chemical" fill="url(#barGrad)" radius={[0, 6, 6, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radial Bar — Category Percentages */}
        <div className="card" style={{ padding: '24px 28px' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', margin: 0, marginBottom: 4 }}>
            Category Breakdown
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: 0, marginBottom: 8 }}>
            Percentage distribution
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="25%" outerRadius="90%" data={radialData} startAngle={90} endAngle={-270}>
              <RadialBar background={{ fill: 'rgba(255,255,255,0.03)' }}
                dataKey="value" cornerRadius={8} />
              <Tooltip contentStyle={tooltipStyle}
                formatter={(val: any) => [`${Number(val).toFixed(1)}%`, '']} />
              <Legend
                formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 500 }}>{value}</span>}
                iconType="circle" iconSize={8}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ═══ Third Row — Severity + Sources + Parameter Health ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 28 }}>
        {/* Stacked Severity Bar */}
        <div className="card" style={{ padding: '24px 28px' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', margin: 0, marginBottom: 4 }}>
            Severity by State
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: 0, marginBottom: 8 }}>
            Risk level breakdown per region
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={severityStackData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="state" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="low" stackId="severity" fill="#60a5fa" radius={[0, 0, 0, 0]} barSize={24} name="Low" />
              <Bar dataKey="moderate" stackId="severity" fill="#eab308" name="Moderate" />
              <Bar dataKey="high" stackId="severity" fill="#f97316" name="High" />
              <Bar dataKey="critical" stackId="severity" fill="#ef4444" radius={[4, 4, 0, 0]} name="Critical" />
              <Legend
                formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 500 }}>{value}</span>}
                iconType="square" iconSize={8}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Severity Distribution (Original) */}
        <div className="card" style={{ padding: '24px 28px' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', margin: 0, marginBottom: 4 }}>
            Alert Severity Breakdown
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: 0, marginBottom: 8 }}>
            Overall severity distribution
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={summary.severity_distribution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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

        {/* Parameter Health Matrix */}
        <div className="card" style={{ padding: '24px 28px' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', margin: 0, marginBottom: 4 }}>
            Parameter Health
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: 0, marginBottom: 16 }}>
            IS 10500 compliance status
          </p>
          <div>
            {parameterHealth.map(p => (
              <ParameterBar key={p.name} {...p} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: '0.7rem' }}>
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

      {/* ═══ Water Source Distribution ═══ */}
      <div className="card" style={{ padding: '24px 28px', marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', margin: 0, marginBottom: 4 }}>
              Water Source Analysis
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              Sample distribution by source type
            </p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          {summary.source_distribution.map((s, idx) => {
            const colors = ['#00d2ff', '#10b981', '#8b5cf6', '#f97316', '#ef4444', '#eab308'];
            const color = colors[idx % colors.length];
            return (
              <div key={s.source} style={{
                background: 'rgba(255,255,255,0.03)', borderRadius: 12,
                padding: '16px 20px', border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 600 }}>{s.source || 'Unknown'}</span>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700, color,
                    background: `${color}20`, padding: '3px 10px', borderRadius: 20
                  }}>{s.percentage}%</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 6, height: 6, marginBottom: 8 }}>
                  <div style={{
                    background: `linear-gradient(90deg, ${color}80, ${color})`,
                    borderRadius: 6, height: 6,
                    width: `${s.percentage}%`,
                    transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: `0 0 8px ${color}40`,
                  }} />
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                  {s.count.toLocaleString()} samples
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ Quick Actions Grid ═══ */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Zap size={20} color="var(--color-primary)" /> Quick Actions
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
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

      {/* ═══ Architecture Note ═══ */}
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
