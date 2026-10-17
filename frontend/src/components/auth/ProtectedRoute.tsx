import { Navigate, Outlet, Link } from 'react-router-dom';
import { useAuth, type UserRole } from '../../context/AuthContext';
import { ShieldAlert, Clock, Loader2, LogOut } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { session, role, status, isLoading, profileLoaded, signOut } = useAuth();

  // Step 1: Still fetching initial session — show loader
  if (isLoading || !profileLoaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
        <Loader2 size={48} color="var(--color-primary)" className="animate-spin" />
        <div style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Verifying credentials...</div>
      </div>
    );
  }

  // Step 2: No session — redirect to login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Step 3: Account pending administrator approval
  if (status === 'pending_approval') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc', padding: 24 }}>
        <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 440, background: 'white', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#d97706' }}>
            <Clock size={36} />
          </div>
          <h2 style={{ color: '#0f172a', fontSize: '1.5rem', fontWeight: 800, marginBottom: 12 }}>
            Account Pending Approval
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 24 }}>
            Your account request for the <strong>{role ? role.replace('_', ' ').toUpperCase() : 'PRIVILEGED'}</strong> role has been received and is currently under administrative review.
          </p>
          <div style={{ padding: '12px 16px', background: '#f1f5f9', borderRadius: 8, fontSize: '0.85rem', color: '#475569', marginBottom: 28, textAlign: 'left' }}>
            🔒 Once an administrator verifies and activates your profile, you will have immediate access to this portal.
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link to="/" className="btn-primary" style={{ textDecoration: 'none', padding: '10px 20px', borderRadius: 8 }}>
              Return to Home
            </Link>
            <button
              onClick={signOut}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 16px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                color: '#64748b',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Account inactive
  if (status === 'inactive') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc', padding: 24 }}>
        <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 420, background: 'white', borderRadius: 16 }}>
          <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ color: '#0f172a', marginBottom: 12 }}>Account Inactive</h2>
          <p style={{ color: '#64748b', marginBottom: 24 }}>
            This account has been deactivated by an administrator. Please contact support.
          </p>
          <button onClick={signOut} className="btn-primary">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Step 5: Session exists but role doesn't match
  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc', padding: 24 }}>
        <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 440, background: 'white', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <ShieldAlert size={52} color="#ef4444" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ color: '#0f172a', fontSize: '1.5rem', fontWeight: 800, marginBottom: 12 }}>Access Denied</h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: 24 }}>
            You do not have permission to access this portal.
            {role && <span style={{ display: 'block', marginTop: 8, color: '#334155', fontWeight: 600 }}>Your active role: {role.replace('_', ' ').toUpperCase()}</span>}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link to="/" className="btn-primary" style={{ display: 'inline-flex', textDecoration: 'none', padding: '10px 20px', borderRadius: 8 }}>
              Return to Home
            </Link>
            <button
              onClick={signOut}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 16px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                color: '#64748b',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 6: Authorized — render child routes
  return <Outlet />;
}
