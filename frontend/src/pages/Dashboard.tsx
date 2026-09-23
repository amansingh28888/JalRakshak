import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  Droplets, AlertTriangle, FlaskConical, Bug, 
  AlertOctagon, Waves, Database, CheckCircle, 
  Ban, ShieldCheck 
} from 'lucide-react';
import { getDashboardSummary } from '../api';
import type { DashboardSummary } from '../types';
import { getCategoryConfig, formatPercentage } from '../utils/display';

const CATEGORY_COLORS: Record<string, string> = {
  POTABLE_SAFE:               'var(--color-safe)',
  UNSAFE_BIOLOGICAL_PATHOGEN: 'var(--color-warning)',
  CRITICAL_CHEMICAL_TOXIN:    'var(--color-danger)',
  MODERATE_PHYSICAL_PARAM:    '#F59E0B',
  CRITICAL_MIXED_HAZARD:      '#B91C1C',
};

function KpiCard({ icon: Icon, label, value, sub, accent, onClick }: {
  icon: any; label: string; value: string | number; sub?: string; accent?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={`card ${onClick ? 'card-hover' : ''}`}
      style={{
        borderLeft: accent ? `4px solid ${accent}` : undefined,
        cursor: onClick ? 'pointer' : undefined,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
      onClick={onClick}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ color: accent || 'var(--color-text-secondary)', background: 'var(--color-bg-soft)', padding: 8, borderRadius: 8 }}>
          <Icon size={20} strokeWidth={2} />
        </div>
        {sub && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', background: 'var(--color-bg-soft)', padding: '4px 10px', borderRadius: 20, fontWeight: 600 }}>{sub}</span>}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 4, fontWeight: 500 }}>{label}</div>
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
      <Droplets size={48} color="var(--color-primary)" className="animate-pulse" />
      <div style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Loading dashboard data...</div>
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
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.75rem', color: 'var(--color-text)', marginBottom: 8 }}>
          Overview Dashboard
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          Monitoring water quality across India using <strong>IS 10500:2012</strong> standards.
        </p>
      </div>

      {/* Attention Banner */}
      {totalAttention > 0 && (
        <div
          style={{
            background: '#FDF3E1',
            border: '1px solid rgba(201,130,0,0.3)',
            borderRadius: 12,
            padding: '20px 24px',
            marginBottom: 32,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 16,
          }}
        >
          <AlertTriangle size={28} color="var(--color-warning)" style={{ marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#9C6500', marginBottom: 8 }}>
              {totalAttention.toLocaleString()} samples require attention ({formatPercentage(attentionPct)})
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.85rem' }}>
              {summary.chemical_alerts > 0 && (
                <span style={{ color: '#9C6500', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FlaskConical size={14} /> {summary.chemical_alerts.toLocaleString()} chemical — use alternative source
                </span>
              )}
              {summary.biological_alerts > 0 && (
                <span style={{ color: '#9C6500', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Bug size={14} /> {summary.biological_alerts.toLocaleString()} biological — disinfect before drinking
                </span>
              )}
              {summary.mixed_hazards > 0 && (
                <span style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertOctagon size={14} /> {summary.mixed_hazards.toLocaleString()} mixed — treatment required
                </span>
              )}
              {summary.physical_concerns > 0 && (
                <span style={{ color: '#9C6500', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Waves size={14} /> {summary.physical_concerns.toLocaleString()} physical — filter and retest
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 32 }}>
        <KpiCard icon={Database} label="Total Samples" value={summary.total_samples.toLocaleString()} />
        <KpiCard icon={CheckCircle} label="Safe to Drink" value={summary.safe_samples.toLocaleString()}
          sub={formatPercentage(summary.safe_percentage)} accent="var(--color-safe)"
          onClick={() => navigate('/samples?category=POTABLE_SAFE')} />
        <KpiCard icon={FlaskConical} label="Chemical Issues" value={summary.chemical_alerts.toLocaleString()} accent="var(--color-danger)"
          onClick={() => navigate('/alerts?category=CRITICAL_CHEMICAL_TOXIN')} />
        <KpiCard icon={Bug} label="Biological Issues" value={summary.biological_alerts.toLocaleString()} accent="var(--color-warning)"
          onClick={() => navigate('/alerts?category=UNSAFE_BIOLOGICAL_PATHOGEN')} />
        <KpiCard icon={Waves} label="Physical Issues" value={summary.physical_concerns.toLocaleString()} accent="#F59E0B"
          onClick={() => navigate('/alerts?category=MODERATE_PHYSICAL_PARAM')} />
        <KpiCard icon={AlertOctagon} label="Mixed Hazards" value={summary.mixed_hazards.toLocaleString()} accent="#B91C1C"
          onClick={() => navigate('/alerts?category=CRITICAL_MIXED_HAZARD')} />
      </div>

      {/* Secondary info: do_not_boil context note */}
      {summary.do_not_boil_alerts > 0 && (
        <div style={{
          background: '#FCE8E8',
          border: '1px solid rgba(214,69,69,0.3)',
          borderRadius: 8,
          padding: '12px 20px',
          marginBottom: 32,
          fontSize: '0.85rem',
          color: 'var(--color-danger)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <Ban size={18} />
          <span>
            <strong>{summary.do_not_boil_alerts.toLocaleString()} samples</strong> ({formatPercentage(summary.do_not_boil_percentage)})
            have chemical contamination where boiling is not effective (e.g., fluoride, arsenic). These require proper filtration.
          </span>
        </div>
      )}

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        {/* Pie Chart */}
        <div className="card" style={{ padding: 32 }}>
          <h3 style={{ fontWeight: 600, marginBottom: 24, color: 'var(--color-text)' }}>
            Water Quality Distribution
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={110} innerRadius={60}
                label={({ percent }: { percent?: number }) => `${((percent ?? 0) * 100).toFixed(1)}%`}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[entry.category] || '#94A3B8'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text)', boxShadow: '0 4px 12px rgba(22,50,79,0.1)' }}
                formatter={(val) => [Number(val).toLocaleString(), 'Samples']}
              />
              <Legend formatter={(value) => <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Chemical States Bar */}
        <div className="card" style={{ padding: 32 }}>
          <h3 style={{ fontWeight: 600, marginBottom: 24, color: 'var(--color-text)' }}>
            Top States by Chemical Alerts
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stateBarData} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
              <YAxis type="category" dataKey="state" tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} width={90} />
              <Tooltip
                contentStyle={{ background: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text)', boxShadow: '0 4px 12px rgba(22,50,79,0.1)' }}
                formatter={(val) => [Number(val).toLocaleString(), 'Chemical Alerts']}
              />
              <Bar dataKey="chemical" fill="var(--color-primary)" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Second Row of Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        {/* Source Distribution */}
        <div className="card" style={{ padding: 32 }}>
          <h3 style={{ fontWeight: 600, marginBottom: 24, color: 'var(--color-text)' }}>
            Water Source Distribution
          </h3>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {summary.source_distribution.map(s => (
              <div key={s.source} style={{ flex: '1 1 180px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{s.source || 'Unknown'}</span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--color-text)', fontWeight: 700 }}>{s.percentage}%</span>
                </div>
                <div style={{ background: 'var(--color-bg-soft)', borderRadius: 6, height: 8 }}>
                  <div style={{ background: 'var(--color-primary)', borderRadius: 6, height: 8, width: `${s.percentage}%`, transition: 'width 0.8s ease' }} />
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 8 }}>{s.count.toLocaleString()} samples</div>
              </div>
            ))}
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="card" style={{ padding: 32 }}>
          <h3 style={{ fontWeight: 600, marginBottom: 24, color: 'var(--color-text)' }}>
            Alert Severity Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={summary.severity_distribution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="severity" tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text)', boxShadow: '0 4px 12px rgba(22,50,79,0.1)' }}
                formatter={(val) => [Number(val).toLocaleString(), 'Samples']}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                {summary.severity_distribution.map((entry, index) => {
                  let color = 'var(--color-safe)'; // SAFE
                  if (entry.severity === 'LOW') color = 'var(--color-primary)';
                  if (entry.severity === 'MODERATE') color = '#F59E0B';
                  if (entry.severity === 'HIGH') color = 'var(--color-warning)';
                  if (entry.severity === 'CRITICAL') color = 'var(--color-danger)';
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Architecture Note */}
      <div style={{ padding: '16px 24px', background: 'var(--color-bg)', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <ShieldCheck size={20} color="var(--color-primary)" />
        <span>
          <strong style={{ color: 'var(--color-text)' }}>Safety Architecture:</strong> All classifications are computed deterministically by the rule engine. 
          AI translation operates strictly in the presentation layer.
        </span>
      </div>
    </div>
  );
}
