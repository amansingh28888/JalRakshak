import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { ShieldCheck, Droplets, ArrowLeft, Loader2, AlertTriangle, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [searchParams] = useSearchParams();
  const loginType = searchParams.get('type');
  const navigate = useNavigate();
  const { session, profile, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If already logged in, redirect based on role
    if (session && profile) {
      if (profile.role === 'admin') navigate('/admin/dashboard');
      else if (profile.role === 'field_worker') navigate('/worker/dashboard');
      else if (profile.role === 'citizen') navigate('/citizen/dashboard');
      else navigate('/');
    }
  }, [session, profile, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      
      // Role will be fetched in AuthContext, and the useEffect above will redirect them
    } catch (e: any) {
      setError(e.message || 'Email or password is incorrect.');
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
        <Loader2 size={48} color="var(--color-primary)" className="animate-spin" />
        <div style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Initializing...</div>
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

        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Choose Login Type</h1>
        <p style={{ color: '#64748b', fontSize: '1.05rem', marginBottom: 48 }}>Select your role to continue to the appropriate portal.</p>
        
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 1000, width: '100%' }}>
          
          {/* Citizen */}
          <div style={{ background: 'white', padding: 40, borderRadius: 16, border: '1px solid #e2e8f0', width: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <Users size={32} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>CITIZEN</h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: 32, flex: 1 }}>Check water safety alerts and report issues</p>
            <button onClick={() => navigate('/citizen/login')} style={{ width: '100%', padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>
              Login
            </button>
          </div>

          {/* Worker */}
          <div style={{ background: 'white', padding: 40, borderRadius: 16, border: '1px solid #e2e8f0', width: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <Droplets size={32} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>WORKER</h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: 32, flex: 1 }}>Manage assigned water tasks and samples</p>
            <button onClick={() => navigate('/login?type=worker')} style={{ width: '100%', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>
              Login
            </button>
          </div>

          {/* Admin */}
          <div style={{ background: 'white', padding: 40, borderRadius: 16, border: '1px solid #e2e8f0', width: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: '#f5f3ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <ShieldCheck size={32} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>ADMIN</h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: 32, flex: 1 }}>Monitor system, users, and alerts</p>
            <button onClick={() => navigate('/login?type=admin')} style={{ width: '100%', padding: '12px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>
              Login
            </button>
          </div>

        </div>
      </div>
    );
  }

  // 2. Specific Login Views (Worker / Admin)
  const isWorker = loginType === 'worker';
  const roleName = isWorker ? 'Worker' : 'Admin';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: 'white', padding: 40, borderRadius: 16, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', width: '100%', maxWidth: 420 }}>
        
        <button 
          onClick={() => navigate('/login')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: '0.85rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 32 }}
        >
          <ArrowLeft size={16} /> Back to Role Selection
        </button>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 16, background: isWorker ? '#eff6ff' : '#f5f3ff', color: isWorker ? '#3b82f6' : '#8b5cf6', marginBottom: 20 }}>
            {isWorker ? <Droplets size={28} /> : <ShieldCheck size={28} />}
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
            {roleName} Login
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Enter your credentials to access the {roleName} Portal.
          </p>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#ef4444', fontSize: '0.85rem', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <AlertTriangle size={16} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: 6 }}>Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={`${loginType}@jalrakshak.gov.in`}
              required 
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: 6 }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required 
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: '12px', background: isWorker ? '#3b82f6' : '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 600, display: 'flex', justifyContent: 'center', gap: 8, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Login'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <a href="#" style={{ color: isWorker ? '#3b82f6' : '#8b5cf6', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 500 }}>Forgot Password?</a>
        </div>

      </div>
    </div>
  );
}
