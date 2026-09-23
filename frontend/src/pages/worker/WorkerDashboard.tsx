import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PlusCircle, Droplets, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

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

export default function WorkerDashboard() {
  const { profile, session } = useAuth();
  const [samples, setSamples] = useState<Sample[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, safe: 0, critical: 0 });

  useEffect(() => {
    const fetchMySamples = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/worker/samples?page=1&page_size=5`,
          { headers: { Authorization: `Bearer ${session?.access_token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setSamples(data.items || []);
          const allRes = await fetch(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/worker/samples?page=1&page_size=1000`,
            { headers: { Authorization: `Bearer ${session?.access_token}` } }
          );
          if (allRes.ok) {
            const allData = await allRes.json();
            const all: Sample[] = allData.items || [];
            setStats({
              total: allData.total || 0,
              safe: all.filter(s => s.severity === 'SAFE').length,
              critical: all.filter(s => s.severity === 'CRITICAL').length,
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

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>
            Welcome, {profile?.full_name || 'Field Worker'}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>
            {profile?.district ? `Assigned: ${profile.district}, ${profile.state_ut}` : 'Field Data Collection Portal'}
          </p>
        </div>
        <Link to="/worker/collect" className="btn-primary" style={{ textDecoration: 'none', gap: 8, display: 'inline-flex', alignItems: 'center' }}>
          <PlusCircle size={18} /> Collect Sample
        </Link>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 40 }}>
        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>My Samples</div>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Droplets size={20} strokeWidth={2.5} />
            </div>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-text)' }}>{isLoading ? '—' : stats.total}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 8 }}>Total submitted</div>
        </div>
        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Safe Samples</div>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(22,138,91,0.1)', color: '#168A5B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={20} strokeWidth={2.5} />
            </div>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-text)' }}>{isLoading ? '—' : stats.safe}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-safe)', marginTop: 8 }}>Cleared by rule engine</div>
        </div>
        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Critical</div>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(239,68,68,0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} strokeWidth={2.5} />
            </div>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-text)' }}>{isLoading ? '—' : stats.critical}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-danger)', marginTop: 8 }}>Needs immediate action</div>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="card">
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Submissions</h2>
          <Link to="/worker/samples" style={{ color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>View All →</Link>
        </div>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto' }} color="var(--color-primary)" />
          </div>
        ) : samples.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <Droplets size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p style={{ marginBottom: 16 }}>No samples submitted yet.</p>
            <Link to="/worker/collect" className="btn-primary" style={{ textDecoration: 'none' }}>
              Submit Your First Sample
            </Link>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Sample ID</th>
                <th>Location</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {samples.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{s.sample_id}</td>
                  <td>{s.village || s.district}, {s.state_ut}</td>
                  <td>{s.sample_date}</td>
                  <td><span className={`severity-${s.severity?.toUpperCase()}`}>{s.alert_category}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
