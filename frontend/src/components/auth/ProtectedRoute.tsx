import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles?: ('admin' | 'field_worker')[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { session, role, isLoading, profileLoaded } = useAuth();

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

  // Step 3: Session exists but role doesn't match — show access denied
  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 400 }}>
          <ShieldAlert size={48} color="var(--color-danger)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ color: 'var(--color-text)', marginBottom: 12 }}>Access Denied</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>
            You do not have permission to access this portal.
            {role && ` (Your role: ${role})`}
          </p>
          <Link to="/" className="btn-primary" style={{ display: 'inline-flex', textDecoration: 'none' }}>
            Return to Portal Selection
          </Link>
        </div>
      </div>
    );
  }

  // Step 4: Authorized — render child routes
  return <Outlet />;
}
