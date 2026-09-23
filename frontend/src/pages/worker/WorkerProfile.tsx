import { useAuth } from '../../context/AuthContext';
import { UserCircle, MapPin, Phone, Mail, Shield } from 'lucide-react';

export default function WorkerProfile() {
  const { profile, user, signOut } = useAuth();

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>My Profile</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>Your field worker account information and assignment details.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        {/* Avatar Card */}
        <div className="card" style={{ padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCircle size={48} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--color-text)' }}>{profile?.full_name || 'Field Worker'}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
              <span className="severity-SAFE">ACTIVE</span>
            </div>
          </div>
          <div style={{ width: '100%', padding: '12px', background: 'var(--color-primary-light)', borderRadius: 8, fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600, textAlign: 'center' }}>
            Field Worker
          </div>
          <button onClick={signOut} style={{ width: '100%', padding: '10px', background: 'none', border: '1px solid var(--color-border)', borderRadius: 6, color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.15s' }}>
            Sign Out
          </button>
        </div>

        {/* Details Card */}
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>Account Details</h2>

          <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Mail size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Email Address</div>
                <div style={{ fontWeight: 500, color: 'var(--color-text)' }}>{profile?.email || user?.email || 'N/A'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Phone size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Phone Number</div>
                <div style={{ fontWeight: 500, color: 'var(--color-text)' }}>{profile?.phone || 'Not provided'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MapPin size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Assignment Area</div>
                {profile?.state_ut ? (
                  <div style={{ fontWeight: 500, color: 'var(--color-text)' }}>
                    {profile.village && `${profile.village}, `}
                    {profile.district && `${profile.district}, `}
                    {profile.state_ut}
                  </div>
                ) : (
                  <div style={{ color: 'var(--color-text-secondary)' }}>No specific area assigned — can submit from any location</div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Shield size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Account Status</div>
                <div style={{ fontWeight: 500 }}>
                  <span className={profile?.status === 'active' ? 'severity-SAFE' : 'severity-CRITICAL'}>
                    {(profile?.status || 'active').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
