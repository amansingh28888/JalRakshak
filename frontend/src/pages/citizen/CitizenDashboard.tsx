import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAlerts } from '../../api';
import { AlertTriangle, Droplets, MapPin, CheckCircle2 } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';

export default function CitizenDashboard() {
  const { profile, isLoading, profileLoaded } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  useEffect(() => {
    if (profile?.role === 'citizen' && (profile.district || profile.district_id)) {
      // Get recent alerts for their district
      const filterParams: any = { 
        district: profile.district || profile.district_id, 
        state_ut: profile.state_ut || profile.state_id,
        page_size: 5 
      };
      getAlerts(filterParams)
      .then(res => setAlerts(res.items || []))
      .catch(console.error)
      .finally(() => setLoadingAlerts(false));
    } else {
      setLoadingAlerts(false);
    }
  }, [profile]);

  if (isLoading || !profileLoaded) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading...</div>;
  }

  // Redirect if not logged in or not a citizen
  if (!profile || profile.role !== 'citizen') {
    return <Navigate to="/citizen/login" replace />;
  }

  const latestAlert = alerts.length > 0 ? alerts[0] : null;
  const statusColor = latestAlert?.severity === 'CRITICAL' ? '#ef4444' : latestAlert?.severity === 'HIGH' ? '#f59e0b' : '#10b981';
  const statusText = latestAlert?.severity || 'SAFE';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 24px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', color: '#0f172a', fontWeight: 700, margin: '0 0 8px 0' }}>Welcome, {profile.full_name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '1rem' }}>
            <MapPin size={18} /> 
            {profile.district || profile.district_id}, {profile.state_ut || profile.state_id}
          </div>
        </div>

        {/* Status Card */}
        <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '32px', borderTop: `4px solid ${statusColor}` }}>
          <h2 style={{ fontSize: '1.1rem', color: '#64748b', fontWeight: 600, margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Latest Water Status</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {statusText === 'SAFE' ? <CheckCircle2 size={48} color={statusColor} /> : <AlertTriangle size={48} color={statusColor} />}
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: statusColor }}>{statusText}</span>
          </div>
        </div>

        {/* Recent Alerts */}
        <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Droplets size={20} color="#0ea5e9" /> Recent Alerts
            </h2>
          </div>
          
          <div style={{ padding: '0' }}>
            {loadingAlerts ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading alerts...</div>
            ) : alerts.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>No recent water quality alerts in your district.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {alerts.map((alert, i) => (
                  <div key={alert.id} style={{ padding: '20px 24px', borderBottom: i < alerts.length - 1 ? '1px solid #f1f5f9' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#0f172a', fontWeight: 600 }}>{alert.severity} Water Quality Alert</h3>
                      <div style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '4px' }}>{alert.village || 'Unknown location'}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{alert.sample_date || alert.created_at?.substring(0,10)}</div>
                    </div>
                    <Link to={`/citizen/sample/${alert.id}`} style={{ padding: '8px 16px', background: '#f1f5f9', color: '#0ea5e9', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
                      View Details
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
