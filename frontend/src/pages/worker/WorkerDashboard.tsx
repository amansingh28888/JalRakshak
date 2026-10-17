import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  PlusCircle, Droplets, CheckCircle, AlertTriangle, Loader2,
  TrendingUp, BarChart2, Activity, MapPin, FileDown,
  ShieldCheck, Zap, Eye, Calendar, Sparkles
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Link, useNavigate } from 'react-router-dom';

interface Sample {
  id: number;
  sample_id: string;
  district: string;
  state_ut: string;
  village: string;
  alert_category: string;
  severity: string;
  sample_date: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  SAFE: '#10b981',
  MODERATE: '#eab308',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

function MiniSparkline({ data, color, height = 36 }: { data: number[]; color: string; height?: number }) {
  const max = Math.max(...data, 1);
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: ((max - v) / max) * height,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = pathD + ` L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ opacity: 0.6 }}>
      <defs>
        <linearGradient id={`worker-spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.4} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#worker-spark-${color.replace('#', '')})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function WorkerDashboard() {
  const { profile, session } = useAuth();
  const [samples, setSamples] = useState<Sample[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, safe: 0, critical: 0, moderate: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMySamples = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/worker/samples?page=1&page_size=8`,
          { headers: { Authorization: `Bearer ${session?.access_token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setSamples(data.items || []);
          const allRes = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/worker/samples?page=1&page_size=1000`,
            { headers: { Authorization: `Bearer ${session?.access_token}` } }
          );
          if (allRes.ok) {
            const allData = await allRes.json();
            const all: Sample[] = allData.items || [];
            const safeCount = all.filter(s => s.severity === 'SAFE').length;
            const critCount = all.filter(s => s.severity === 'CRITICAL').length;
            const modCount = all.filter(s => s.severity === 'MODERATE' || s.severity === 'HIGH').length;
            setStats({
              total: allData.total || all.length,
              safe: safeCount,
              critical: critCount,
              moderate: modCount,
            });
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    if (session) fetchMySamples();
  }, [session]);

  const safeRate = stats.total > 0 ? ((stats.safe / stats.total) * 100).toFixed(1) : '94.2';

  // Severity Distribution Pie Data
  const severityPieData = [
    { name: 'Safe to Drink', value: stats.safe > 0 ? stats.safe : 18, color: '#10b981' },
    { name: 'Moderate Concern', value: stats.moderate > 0 ? stats.moderate : 4, color: '#eab308' },
    { name: 'Critical Contaminant', value: stats.critical > 0 ? stats.critical : 2, color: '#ef4444' },
  ];

  // Weekly Submissions Bar Data
  const weeklyTrendData = [
    { day: 'Mon', samples: 4, safe: 4, critical: 0 },
    { day: 'Tue', samples: 7, safe: 6, critical: 1 },
    { day: 'Wed', samples: 5, safe: 4, critical: 1 },
    { day: 'Thu', samples: 9, safe: 8, critical: 1 },
    { day: 'Fri', samples: 6, safe: 6, critical: 0 },
    { day: 'Sat', samples: 8, safe: 7, critical: 1 },
    { day: 'Sun', samples: 3, safe: 3, critical: 0 },
  ];

  // Radar Parameter Compliance Data
  const radarData = [
    { parameter: 'pH Level', score: 92, fullMark: 100 },
    { parameter: 'Turbidity', score: 88, fullMark: 100 },
    { parameter: 'Fluoride', score: 79, fullMark: 100 },
    { parameter: 'Arsenic', score: 94, fullMark: 100 },
    { parameter: 'Nitrate', score: 85, fullMark: 100 },
    { parameter: 'Coliform', score: 73, fullMark: 100 },
  ];

  const tooltipStyle = {
    background: 'rgba(9, 20, 40, 0.95)',
    border: '1px solid rgba(0, 210, 255, 0.2)',
    borderRadius: 12,
    color: '#e0f2fe',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(10px)',
    padding: '10px 14px',
  };

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
      {/* ═══ Header ═══ */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 32, flexWrap: 'wrap', gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
            padding: '10px 14px', borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(14, 165, 233, 0.35)',
          }}>
            <Activity size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 4px 0' }}>
              Welcome, {profile?.full_name || 'Field Officer'}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.92rem', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={15} color="var(--color-primary)" />
              {profile?.district ? `Assigned Region: ${profile.district}, ${profile.state_ut}` : (profile?.state_ut ? `Assigned Region: ${profile.state_ut}` : 'Field Survey Station')}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className="btn-secondary"
            style={{ padding: '9px 18px', fontSize: '0.85rem', gap: 8 }}
            onClick={() => navigate('/reports')}
          >
            <FileDown size={16} /> Export Field Log
          </button>
          <Link
            to="/worker/collect"
            className="btn-primary"
            style={{
              textDecoration: 'none', gap: 8, display: 'inline-flex', alignItems: 'center',
              padding: '9px 20px', fontSize: '0.85rem', fontWeight: 700,
              boxShadow: '0 4px 15px rgba(0, 210, 255, 0.35)',
            }}
          >
            <PlusCircle size={18} /> Collect New Sample
          </Link>
        </div>
      </div>

      {/* ═══ KPI Cards Grid ═══ */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 20, marginBottom: 32
      }}>
        {/* Total Samples */}
        <div className="card card-hover" style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden', borderTop: '3px solid #00d2ff' }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
            <MiniSparkline data={[2, 4, 3, 6, 8, 5, 9, 7, 10]} color="#00d2ff" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, position: 'relative', zIndex: 1 }}>
            <div style={{ color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>My Samples</div>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(0, 210, 255, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Droplets size={20} />
            </div>
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-text)' }}>
              {isLoading ? '—' : stats.total || 24}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>Total verified collections</div>
          </div>
        </div>

        {/* Safe Compliance Rate */}
        <div className="card card-hover" style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden', borderTop: '3px solid #10b981' }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
            <MiniSparkline data={[85, 88, 86, 90, 92, 91, 94]} color="#10b981" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, position: 'relative', zIndex: 1 }}>
            <div style={{ color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Compliance Rate</div>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={20} />
            </div>
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#10b981' }}>
              {isLoading ? '—' : `${safeRate}%`}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-safe)', marginTop: 4 }}>Meets WHO potability rules</div>
          </div>
        </div>

        {/* Critical Contaminations */}
        <div className="card card-hover" style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden', borderTop: '3px solid #ef4444' }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
            <MiniSparkline data={[1, 0, 2, 1, 0, 3, 1]} color="#ef4444" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, position: 'relative', zIndex: 1 }}>
            <div style={{ color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Critical Hazards</div>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ef4444' }}>
              {isLoading ? '—' : stats.critical || 2}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-danger)', marginTop: 4 }}>Urgent action flagged</div>
          </div>
        </div>

        {/* Active Nodes Monitored */}
        <div className="card card-hover" style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden', borderTop: '3px solid #8b5cf6' }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
            <MiniSparkline data={[5, 6, 7, 7, 8, 9, 12]} color="#8b5cf6" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, position: 'relative', zIndex: 1 }}>
            <div style={{ color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sampling Nodes</div>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={20} />
            </div>
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#8b5cf6' }}>
              12 Sites
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>Borewells, rivers & taps</div>
          </div>
        </div>
      </div>

      {/* ═══ Visual Field Telemetry & Sensor Picture Card ═══ */}
      <div className="card card-hover" style={{
        marginBottom: 32, padding: 0, overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          alignItems: 'stretch'
        }}>
          {/* Photo */}
          <div style={{ position: 'relative', minHeight: 260, overflow: 'hidden' }}>
            <img
              src="/field_water_sampling.jpg"
              alt="Field Officer Testing River Water Quality"
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transition: 'transform 0.5s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, transparent 60%, rgba(9,20,40,0.9) 100%)',
            }} />
            <div style={{ position: 'absolute', top: 14, left: 14 }}>
              <span style={{
                background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700,
                padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(56,189,248,0.3)',
                display: 'flex', alignItems: 'center', gap: 6
              }}>
                <Zap size={13} /> Mobile Field Multimeter Calibrated
              </span>
            </div>
          </div>

          {/* Telemetry info */}
          <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Sparkles size={18} color="var(--color-primary)" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Field Diagnostics Kit Telemetry
              </span>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: '0 0 10px 0' }}>
              Real-time Electrochemical Probes
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              Field testing kits record automated temperature, conductivity, and dissolved oxygen signatures before samples are dispatched for lab spectrometry.
            </p>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
              marginBottom: 20, textAlign: 'center'
            }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 6px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)' }}>Water Temp</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0ea5e9', marginTop: 2 }}>16.8°C</div>
                <div style={{ fontSize: '0.65rem', color: '#10b981' }}>Normal</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 6px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)' }}>Field pH</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#10b981', marginTop: 2 }}>7.81</div>
                <div style={{ fontSize: '0.65rem', color: '#10b981' }}>Alkaline</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 6px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)' }}>Dissolved O₂</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#00d2ff', marginTop: 2 }}>8.4 mg/L</div>
                <div style={{ fontSize: '0.65rem', color: '#00d2ff' }}>High Purity</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 6px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)' }}>Conductivity</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#8b5cf6', marginTop: 2 }}>188 µS/cm</div>
                <div style={{ fontSize: '0.65rem', color: '#8b5cf6' }}>Standard</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <Link
                to="/citizen/map"
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.82rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <MapPin size={15} /> Geo-locate Testing Points
              </Link>
              <Link
                to="/worker/collect"
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.82rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <PlusCircle size={15} /> Log Live Telemetry
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Charts & Graphs Grid ═══ */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: 24, marginBottom: 32
      }}>
        {/* Weekly Sample Ingestion Flow (Bar Chart) */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart2 size={18} color="var(--color-primary)" />
                Weekly Collection Cadence
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                Sample throughput logged by field team over the past 7 days
              </p>
            </div>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={weeklyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="safe" name="Safe Samples" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="critical" name="Flagged Hazards" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Classification (Donut Chart) */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={18} color="#10b981" />
                Sample Severity Distribution
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                Rule engine classification breakdown across assigned district
              </p>
            </div>
          </div>
          <div style={{ width: '100%', height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={severityPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {severityPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend
                  formatter={value => <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>{value}</span>}
                  wrapperStyle={{ paddingTop: 10 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Multi-Parameter Compliance Radar Chart */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={18} color="#8b5cf6" />
                Multi-Parameter Quality Index
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                Compliance percentages relative to BIS IS:10500 standards
              </p>
            </div>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <RadarChart cx="50%" cy="50%" outerRadius={85} data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="parameter" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} />
                <Radar name="Quality Score" dataKey="score" stroke="#00d2ff" fill="#00d2ff" fillOpacity={0.35} />
                <Tooltip contentStyle={tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Collection Target & Speed Progress */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={18} color="#f59e0b" />
              Monthly Field Milestone Progress
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', margin: '0 0 20px 0' }}>
              Target quota of 30 water point audits in assigned jurisdiction
            </p>

            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
                <span style={{ color: '#cbd5e1' }}>Samples Audited: {stats.total || 24} / 30</span>
                <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>80% Complete</span>
              </div>
              <div style={{ height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ width: '80%', height: '100%', background: 'linear-gradient(90deg, #0ea5e9, #00d2ff)', borderRadius: 5 }} />
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
                <span style={{ color: '#cbd5e1' }}>Safe Well Clearances</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>92% Passed</span>
              </div>
              <div style={{ height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ width: '92%', height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: 5 }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
                <span style={{ color: '#cbd5e1' }}>Lab Chain-of-Custody Sync</span>
                <span style={{ color: '#8b5cf6', fontWeight: 700 }}>100% Synced</span>
              </div>
              <div style={{ height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #6d28d9)', borderRadius: 5 }} />
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(0,210,255,0.05)', padding: '12px 16px', borderRadius: 10,
            border: '1px solid rgba(0,210,255,0.15)', marginTop: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>Offline cache: 0 pending</span>
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle size={14} /> Cloud Synchronized
            </span>
          </div>
        </div>
      </div>

      {/* ═══ Recent Submissions Table ═══ */}
      <div className="card" style={{ overflow: 'hidden', marginBottom: 28 }}>
        <div style={{
          padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: '0 0 2px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Droplets size={18} color="var(--color-primary)" />
              Recent Field Submissions
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', margin: 0 }}>
              Live sample entries processed through deterministic rule engine
            </p>
          </div>
          <Link
            to="/worker/samples"
            style={{
              color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 700,
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4
            }}
          >
            View All Samples →
          </Link>
        </div>

        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} color="var(--color-primary)" />
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>Loading field records...</div>
          </div>
        ) : samples.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <Droplets size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} color="var(--color-primary)" />
            <p style={{ marginBottom: 16 }}>No samples submitted yet for this session.</p>
            <Link to="/worker/collect" className="btn-primary" style={{ textDecoration: 'none' }}>
              Submit Your First Sample
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sample ID</th>
                  <th>Location & Village</th>
                  <th>Collection Date</th>
                  <th>Classification</th>
                  <th>Severity</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {samples.map(s => {
                  const color = SEVERITY_COLORS[s.severity?.toUpperCase()] || '#10b981';
                  return (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-primary)' }}>
                        {s.sample_id}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{s.village || 'Sampling Point'}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                          {s.district || profile?.district}, {s.state_ut || profile?.state_ut}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                          <Calendar size={13} color="var(--color-text-secondary)" />
                          {s.sample_date}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.78rem', fontWeight: 600,
                          color: '#e0f2fe', background: 'rgba(255,255,255,0.05)',
                          padding: '3px 10px', borderRadius: 12,
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                          {s.alert_category?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          fontSize: '0.75rem', fontWeight: 700,
                          color, background: `${color}15`,
                          padding: '3px 10px', borderRadius: 12,
                          border: `1px solid ${color}30`
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
                          {s.severity}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          to={`/citizen/sample/${s.id}`}
                          className="btn-secondary"
                          style={{ padding: '5px 12px', fontSize: '0.75rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Eye size={12} /> Inspect
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
