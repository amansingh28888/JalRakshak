import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { ShieldCheck, Droplets, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [searchParams] = useSearchParams();
  const loginType = searchParams.get('type') || 'worker';
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
      setError(e.message || 'Failed to login');
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

  const isWorker = loginType === 'worker';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-soft)', padding: 24 }}>
      <div className="card" style={{ maxWidth: 420, width: '100%', padding: 40 }}>
        
        <button 
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 32 }}
        >
          <ArrowLeft size={16} /> Back to Portals
        </button>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 16, background: isWorker ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)', color: isWorker ? '#F59E0B' : '#EF4444', marginBottom: 20 }}>
            {isWorker ? <Droplets size={28} /> : <ShieldCheck size={28} />}
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
            {isWorker ? 'Field Worker Login' : 'Admin Login'}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Enter your credentials to access the JalRakshak {isWorker ? 'Field Portal' : 'Admin Portal'}.
          </p>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: '#FCE8E8', border: '1px solid rgba(214,69,69,0.3)', borderRadius: 8, color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <AlertTriangle size={16} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-input" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="worker@jalrakshak.gov.in"
              required 
            />
          </div>
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required 
            />
          </div>
          
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', padding: '12px', fontSize: '1rem', display: 'flex', justifyContent: 'center', gap: 8 }}
            disabled={loading}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Sign In to Portal'}
          </button>
        </form>

      </div>
    </div>
  );
}
