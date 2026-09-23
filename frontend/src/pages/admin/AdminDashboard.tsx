import { Users, Droplets, AlertTriangle, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const { profile } = useAuth();

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>
          Welcome back, {profile?.full_name || 'Admin'}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>
          Here is an overview of the JalRakshak system status.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 40 }}>
        {/* KPI Cards */}
        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Samples
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Droplets size={20} strokeWidth={2.5} />
            </div>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
            50,042
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-safe)', marginTop: 8, fontWeight: 500 }}>
            +142 this week
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Field Workers
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} strokeWidth={2.5} />
            </div>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
            124
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-safe)', marginTop: 8, fontWeight: 500 }}>
            +3 new registrations
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Critical Alerts
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} strokeWidth={2.5} />
            </div>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
            18
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-danger)', marginTop: 8, fontWeight: 500 }}>
            Requires immediate action
          </div>
        </div>
        
        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              System Uptime
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={20} strokeWidth={2.5} />
            </div>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
            99.9%
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-safe)', marginTop: 8, fontWeight: 500 }}>
            All systems nominal
          </div>
        </div>
      </div>
      
      <div className="card" style={{ padding: 32 }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 16 }}>Quick Actions</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>Use the sidebar navigation to manage workers, review incoming sample data, and monitor the audit logs.</p>
      </div>
    </div>
  );
}
