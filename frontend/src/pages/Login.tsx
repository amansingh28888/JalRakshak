import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { ShieldCheck, Droplets, ArrowLeft, Loader2, AlertTriangle, Users, BarChart3, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [searchParams] = useSearchParams();
  const loginType = searchParams.get('type');
  const navigate = useNavigate();
  const { session, profile, isLoading, profileLoaded } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  useEffect(() => {
    // If already logged in, redirect based on verified role
    if (session && profileLoaded && profile) {
      if (profile.status === 'pending_approval') {
        // Stays on pending approval view handled by route guards
        return;
      }
      if (profile.role === 'admin') navigate('/admin/dashboard');
      else if (profile.role === 'field_worker') navigate('/worker/dashboard');
      else if (profile.role === 'analyst') navigate('/analyst/dashboard');
      else if (profile.role === 'citizen') navigate('/citizen/dashboard');
      else navigate('/');
    }
  }, [session, profile, profileLoaded, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please provide both email address and password.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('email not confirmed')) {
          throw new Error('Please check your email and verify your account before logging in.');
        } else if (authError.message.toLowerCase().includes('invalid login credentials')) {
          throw new Error('Invalid email or password. Please verify your credentials and try again.');
        }
        throw authError;
      }

      if (!data.session) {
        throw new Error('Authentication failed. No active session established.');
      }
      // AuthContext onAuthStateChange will resolve profile and useEffect will route to dashboard
    } catch (e: any) {
      setError(e.message || 'Incorrect email or password. Please try again.');
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError(null);
    setResetSuccess(null);

    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: window.location.origin + '/login',
      });
      if (resetErr) throw resetErr;
      setResetSuccess('Password reset link sent! Please check your inbox.');
    } catch (err: any) {
      setResetError(err.message || 'Failed to send reset link. Please check the email entered.');
    } finally {
      setResetLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
        <Loader2 size={48} color="var(--color-primary)" className="animate-spin" />
        <div style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Initializing Portal...</div>
      </div>
    );
  }

  // 1. Role Selection View
  if (!loginType) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <button 
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: '0.9rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 40, alignSelf: 'flex-start', marginLeft: 'auto', marginRight: 'auto', maxWidth: 1000, width: '100%' }}
        >
          <ArrowLeft size={16} /> Back to Home
        </button>

        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', marginBottom: 10, textAlign: 'center' }}>Choose Portal</h1>
        <p style={{ color: '#64748b', fontSize: '1.05rem', marginBottom: 44, textAlign: 'center' }}>Select your account role to continue to the appropriate JalRakshak portal.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, maxWidth: 1000, width: '100%' }}>
          
          {/* Citizen */}
          <div style={{ background: 'white', padding: 32, borderRadius: 16, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'transform 0.2s' }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Users size={30} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>CITIZEN</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 24, flex: 1, lineHeight: 1.5 }}>Check water safety alerts, view maps, and report water issues</p>
            <button onClick={() => navigate('/citizen/login')} style={{ width: '100%', padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}>
              Citizen Login
            </button>
          </div>

          {/* Worker */}
          <div style={{ background: 'white', padding: 32, borderRadius: 16, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'transform 0.2s' }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Droplets size={30} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>FIELD WORKER</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 24, flex: 1, lineHeight: 1.5 }}>Record water sample tests, GPS locations, and physical observations</p>
            <button onClick={() => navigate('/login?type=worker')} style={{ width: '100%', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}>
              Worker Login
            </button>
          </div>

          {/* Admin */}
          <div style={{ background: 'white', padding: 32, borderRadius: 16, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'transform 0.2s' }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: '#f5f3ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <ShieldCheck size={30} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>ADMIN</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 24, flex: 1, lineHeight: 1.5 }}>Manage user roles, review all samples, configure rules, and audit logs</p>
            <button onClick={() => navigate('/login?type=admin')} style={{ width: '100%', padding: '12px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}>
              Admin Login
            </button>
          </div>

        </div>

        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <span style={{ color: '#64748b', fontSize: '0.9rem' }}>New citizen? </span>
          <Link to="/citizen/register" style={{ color: '#0ea5e9', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
            Register Citizen Account
          </Link>
        </div>
      </div>
    );
  }

  // 2. Dedicated Login Views (Worker / Analyst / Admin)
  const isWorker = loginType === 'worker';
  const isAnalyst = loginType === 'analyst';
  const roleName = isWorker ? 'Field Worker' : isAnalyst ? 'Analyst' : 'Admin';
  const roleColor = isWorker ? '#3b82f6' : isAnalyst ? '#0284c7' : '#8b5cf6';
  const roleBg = isWorker ? '#eff6ff' : isAnalyst ? '#e0f2fe' : '#f5f3ff';
  const RoleIcon = isWorker ? Droplets : isAnalyst ? BarChart3 : ShieldCheck;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: 'white', padding: 40, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', width: '100%', maxWidth: 440, border: '1px solid #e2e8f0' }}>
        
        <button 
          onClick={() => navigate('/login')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: '0.85rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 28 }}
        >
          <ArrowLeft size={16} /> Choose Another Role
        </button>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 16, background: roleBg, color: roleColor, marginBottom: 16 }}>
            <RoleIcon size={28} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
            {roleName} Login
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Enter your authorized credentials to access the {roleName} Portal.
          </p>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#ef4444', fontSize: '0.85rem', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <AlertTriangle size={18} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Forgot Password Modal */}
        {showForgotPassword ? (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#f1f5f9', padding: '12px 16px', borderRadius: 8, fontSize: '0.85rem', color: '#475569' }}>
              Enter your account email to receive password recovery instructions.
            </div>

            {resetSuccess && (
              <div style={{ padding: '12px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, color: '#059669', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={16} /> {resetSuccess}
              </div>
            )}

            {resetError && (
              <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#ef4444', fontSize: '0.85rem' }}>
                {resetError}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>Email Address</label>
              <input 
                type="email" 
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                placeholder="name@jalrakshak.gov.in"
                required 
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem', color: '#0f172a' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                type="submit" 
                disabled={resetLoading}
                style={{ flex: 1, padding: '12px', background: roleColor, color: 'white', border: 'none', borderRadius: 8, fontSize: '0.95rem', fontWeight: 600, cursor: resetLoading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
              >
                {resetLoading ? <Loader2 size={18} className="animate-spin" /> : 'Send Reset Link'}
              </button>
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                style={{ padding: '12px 16px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={`${loginType}@jalrakshak.gov.in`}
                required 
                autoComplete="email"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem', color: '#0f172a' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  style={{ background: 'none', border: 'none', color: roleColor, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required 
                  autoComplete="current-password"
                  style={{ width: '100%', padding: '10px 42px 10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem', color: '#0f172a' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              style={{ width: '100%', padding: '12px', background: roleColor, color: 'white', border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8 }}
            >
              {loading ? <><Loader2 size={20} className="animate-spin" /> Verifying Credentials...</> : 'Sign In'}
            </button>
          </form>
        )}

        <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #f1f5f9', textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
          <span>Registering as a citizen? </span>
          <Link to="/citizen/register" style={{ color: '#0ea5e9', fontWeight: 600, textDecoration: 'none' }}>
            Create Citizen Account
          </Link>
        </div>

      </div>
    </div>
  );
}
