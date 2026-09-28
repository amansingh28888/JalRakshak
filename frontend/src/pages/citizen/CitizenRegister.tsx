import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { Loader2 } from 'lucide-react';
import { useLocations } from '../../hooks/useLocations';

export default function CitizenRegister() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
    state_id: '',
    district_id: '',
  });

  const { states, getDistricts, loading: locLoading } = useLocations();

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/citizen/setup',
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError('Google sign-in could not be completed. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(f => ({ ...f, [e.target.name]: e.target.value }));
    if (e.target.name === 'state_id') {
      setFormData(f => ({ ...f, district_id: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // 1. Sign up user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Insert into citizen_profiles
        const { error: profileError } = await supabase.from('citizen_profiles').insert({
          user_id: authData.user.id,
          full_name: formData.fullName,
          mobile: formData.mobile,
          email: formData.email,
          state_id: formData.state_id,
          district_id: formData.district_id,
        });

        if (profileError) throw profileError;

        // Redirect to dashboard
        navigate('/citizen/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '24px' }}>
      <div style={{ background: '#ffffff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', width: '100%', maxWidth: '500px' }}>
        <h1 style={{ color: '#0f172a', fontSize: '1.75rem', marginBottom: '8px', textAlign: 'center' }}>Citizen Registration</h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '24px', textAlign: 'center' }}>Sign up to receive water quality alerts for your district.</p>
        
        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Full Name *</label>
            <input required type="text" name="fullName" value={formData.fullName} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#0f172a', background: '#fff' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Mobile Number *</label>
            <input required type="tel" name="mobile" value={formData.mobile} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#0f172a', background: '#fff' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Email Address *</label>
            <input required type="email" name="email" value={formData.email} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#0f172a', background: '#fff' }} />
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Password *</label>
              <input required type="password" name="password" value={formData.password} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#0f172a', background: '#fff' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>Confirm Password *</label>
              <input required type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#0f172a', background: '#fff' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>State *</label>
              <select required name="state_id" value={formData.state_id} onChange={handleChange} disabled={locLoading} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#0f172a', background: '#fff' }}>
                <option value="">Select State</option>
                {states.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>District *</label>
              <select required name="district_id" value={formData.district_id} onChange={handleChange} disabled={!formData.state_id || locLoading} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#0f172a', background: '#fff' }}>
                <option value="">{formData.state_id ? 'Select District' : 'Select State First'}</option>
                {formData.state_id && getDistricts(formData.state_id).map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ marginTop: '8px', width: '100%', padding: '12px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '1rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Register'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
          <span style={{ padding: '0 16px', color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
        </div>

        <button 
          type="button"
          onClick={handleGoogleLogin} 
          style={{ width: '100%', padding: '12px', background: '#fff', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', transition: 'all 0.2s' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
        
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
          Already registered? <Link to="/citizen/login" style={{ color: '#0ea5e9', textDecoration: 'none', fontWeight: 600 }}>Login here</Link>
        </div>
      </div>
    </div>
  );
}
