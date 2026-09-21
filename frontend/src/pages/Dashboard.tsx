import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
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

function KpiCard({ icon, label, value, sub, accent, onClick }: {
  icon: string; label: string; value: string | number; sub?: string; accent?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className="kpi-card"
      style={{
        borderLeft: accent ? `3px solid ${accent}` : undefined,
        cursor: onClick ? 'pointer' : undefined,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onClick={onClick}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { if (onClick) (e.currentTarget as HTMLElement).style.transform = ''; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: '1.4rem' }}>{icon}</span>
        {sub && <span style={{ fontSize: '0.7rem', color: '#64748b', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 20 }}>{sub}</span>}
      </div>
      <div style={{ fontSize: '1.8rem', fontFamily: 'Outfit', fontWeight: 700, color: accent || '#e2e8f0', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 6 }}>{label}</div>
    </div>
  );
}

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

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: '2rem' }}>💧</div>
      <div style={{ color: '#64748b' }}>Loading dashboard data...</div>
    </div>
  );

  if (error) return (
    <div className="glass-card" style={{ padding: 24, color: '#f87171' }}>
      ⚠️ Failed to load dashboard: {error}
    </div>
  );

  if (!summary) return null;

  const totalAttention = summary.biological_alerts + summary.chemical_alerts + summary.physical_concerns + summary.mixed_hazards;
  const attentionPct   = summary.total_samples > 0 ? (totalAttention / summary.total_samples * 100) : 0;

  const pieData = summary.category_distribution.map(c => ({
    name:     getCategoryConfig(c.category).label,
    value:    c.count,
    category: c.category,
  }));

  const stateBarData = summary.top_chemical_states.slice(0, 8).map(s => ({
    state:    s.state_ut.length > 12 ? s.state_ut.slice(0, 12) + '…' : s.state_ut,
    chemical: s.chemical_alerts,
  }));

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Outfit', fontSize: '1.75rem', fontWeight: 800, color: '#e2e8f0', marginBottom: 6 }}>
          💧 JalRakshak — Overview Dashboard
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          AI-Based Water Quality Monitoring &amp; Vernacular Alert System
          &nbsp;·&nbsp; All metrics computed from live database &nbsp;·&nbsp;
          <span style={{ color: '#3b82f6' }}>IS 10500:2012</span> standards
        </p>
      </div>

      {/* Attention Banner — context-aware, shows what the problems are */}
      {totalAttention > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(220,38,38,0.06))',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12,
            padding: '16px 24px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 16,
          }}
        >
          <span style={{ fontSize: '2rem', lineHeight: 1 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.05rem', color: '#f87171', marginBottom: 6 }}>
              {totalAttention.toLocaleString()} samples require attention ({formatPercentage(attentionPct)})
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '0.82rem' }}>
              {summary.chemical_alerts > 0 && (
                <span style={{ color: '#fca5a5' }}>
                  ⚗️ {summary.chemical_alerts.toLocaleString()} chemical — use appropriate treatment or alternative source
                </span>
              )}
              {summary.biological_alerts > 0 && (
                <span style={{ color: '#fdba74' }}>
                  🦠 {summary.biological_alerts.toLocaleString()} biological — disinfect before drinking
                </span>
              )}
              {summary.mixed_hazards > 0 && (
                <span style={{ color: '#f87171' }}>
                  ☣️ {summary.mixed_hazards.toLocaleString()} mixed — chemical treatment + disinfection required
                </span>
              )}
              {summary.physical_concerns > 0 && (
                <span style={{ color: '#fde68a' }}>
                  🌊 {summary.physical_concerns.toLocaleString()} physical — filter and retest
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Primary KPI Grid — 7 cards: what problem types exist */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 16, marginBottom: 28 }}>
        <KpiCard icon="🗃️" label="Total Samples"        value={summary.total_samples.toLocaleString()} />
        <KpiCard icon="✅" label="Safe to Drink"         value={summary.safe_samples.toLocaleString()}
          sub={formatPercentage(summary.safe_percentage)} accent="#10b981"
          onClick={() => navigate('/samples?category=POTABLE_SAFE')} />
        <KpiCard icon="⚗️" label="Chemical Issues"       value={summary.chemical_alerts.toLocaleString()} accent="#ef4444"
          onClick={() => navigate('/alerts?category=CRITICAL_CHEMICAL_TOXIN')} />
        <KpiCard icon="🦠" label="Biological Issues"     value={summary.biological_alerts.toLocaleString()} accent="#f97316"
          onClick={() => navigate('/alerts?category=UNSAFE_BIOLOGICAL_PATHOGEN')} />
        <KpiCard icon="🌊" label="Physical Issues"       value={summary.physical_concerns.toLocaleString()} accent="#eab308"
          onClick={() => navigate('/alerts?category=MODERATE_PHYSICAL_PARAM')} />
        <KpiCard icon="☣️" label="Mixed Hazards"         value={summary.mixed_hazards.toLocaleString()} accent="#dc2626"
          onClick={() => navigate('/alerts?category=CRITICAL_MIXED_HAZARD')} />
        <KpiCard icon="🗺️" label="States Covered"        value={summary.total_states} />
      </div>

      {/* Secondary info: do_not_boil context note */}
      {summary.do_not_boil_alerts > 0 && (
        <div style={{
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 8,
          padding: '10px 18px',
          marginBottom: 24,
          fontSize: '0.82rem',
          color: '#fca5a5',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span>🚱</span>
          <span>
            <strong>{summary.do_not_boil_alerts.toLocaleString()} samples</strong> ({formatPercentage(summary.do_not_boil_percentage)})
            have chemical contamination where boiling is not effective — fluoride, arsenic, or nitrate.
            These samples require an appropriate treatment system or a safe alternative source.
          </span>
        </div>
      )}

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Pie Chart — problem type distribution */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 20, color: '#e2e8f0' }}>
            Water Quality Distribution
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={100}
                label={({ percent }: { percent?: number }) => `${((percent ?? 0) * 100).toFixed(1)}%`}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[entry.category] || '#64748b'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#0f2042', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8 }}
                formatter={(val) => [Number(val).toLocaleString(), 'Samples']}
              />
              <Legend formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Chemical States Bar */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 20, color: '#e2e8f0' }}>
            Top States by Chemical Alerts
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stateBarData} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis type="category" dataKey="state" tick={{ fill: '#94a3b8', fontSize: 11 }} width={80} />
              <Tooltip
                contentStyle={{ background: '#0f2042', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8 }}
                formatter={(val) => [Number(val).toLocaleString(), 'Chemical Alerts']}
              />
              <Bar dataKey="chemical" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Second Row of Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Source Distribution */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 20, color: '#e2e8f0' }}>
            Water Source Distribution
          </h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {summary.source_distribution.map(s => (
              <div key={s.source} style={{ flex: '1 1 150px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{s.source || 'Unknown'}</span>
                  <span style={{ fontSize: '0.85rem', color: '#60a5fa', fontWeight: 600 }}>{s.percentage}%</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 4, height: 6 }}>
                  <div style={{ background: 'linear-gradient(90deg, #2563eb, #14b8a6)', borderRadius: 4, height: 6, width: `${s.percentage}%`, transition: 'width 0.8s ease' }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 4 }}>{s.count.toLocaleString()} samples</div>
              </div>
            ))}
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 20, color: '#e2e8f0' }}>
            Alert Severity Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={summary.severity_distribution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="severity" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#0f2042', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8 }}
                formatter={(val) => [Number(val).toLocaleString(), 'Samples']}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                {summary.severity_distribution.map((entry, index) => {
                  let color = '#10b981'; // SAFE
                  if (entry.severity === 'LOW') color = '#3b82f6';
                  if (entry.severity === 'MODERATE') color = '#eab308';
                  if (entry.severity === 'HIGH') color = '#f97316';
                  if (entry.severity === 'CRITICAL') color = '#ef4444';
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Architecture Note */}
      <div style={{ marginTop: 24, padding: '12px 20px', background: 'rgba(59,130,246,0.05)', borderRadius: 10, border: '1px solid rgba(59,130,246,0.1)', fontSize: '0.8rem', color: '#64748b' }}>
        🔒 <strong style={{ color: '#60a5fa' }}>Safety Architecture:</strong> All classifications above are computed by the deterministic
        rule engine using IS 10500:2012 standards. Gemini AI is used only for Hindi communication — it never overrides safety decisions.
      </div>
    </div>
  );
}
