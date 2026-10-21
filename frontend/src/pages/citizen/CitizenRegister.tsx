import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { Loader2, Eye, EyeOff, AlertTriangle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useLocations } from '../../hooks/useLocations';
import { useAuth } from '../../context/AuthContext';

export default function CitizenRegister() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
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
    setSuccessMessage(null);

    // Validation
    if (!formData.fullName.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!formData.mobile.trim() || formData.mobile.trim().length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please verify your password entry.');
      return;
    }
    if (!formData.state_id || !formData.district_id) {
      setError('Please select both your State and District.');
      return;
    }

    setLoading(true);
    try {
      const selectedState = states.find(s => s.id === formData.state_id);
      const selectedDistrict = getDistricts(formData.state_id).find(d => d.id === formData.district_id);

      // Sign up with Supabase Auth including explicit citizen metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName.trim(),
            role: 'citizen',
            phone: formData.mobile.trim(),
            state_ut: selectedState?.name || '',
            district: selectedDistrict?.name || '',
            state_id: formData.state_id,
            district_id: formData.district_id,
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // If session is present (auto-confirmed)
        if (authData.session) {
          // If RLS allows, also update or ensure citizen_profiles directly
          try {
            await supabase.from('citizen_profiles').upsert({
              user_id: authData.user.id,
              full_name: formData.fullName.trim(),
              mobile: formData.mobile.trim(),
              email: formData.email.trim(),
              state: selectedState?.name || '',
              district: selectedDistrict?.name || '',
              state_id: formData.state_id,
              district_id: formData.district_id,
            }, { onConflict: 'user_id' });
          } catch {
            // Trigger already handles DB-level synchronization
          }

          await refreshProfile();
          navigate('/citizen/dashboard');
        } else {
          // Email confirmation enabled on project
          setSuccessMessage(
            'Account created successfully! Please check your email to verify your address before logging in.'
          );
        }
      }
    } catch (err: any) {
      if (err.message?.toLowerCase().includes('already registered')) {
        setError('An account with this email address already exists. Please log in instead.');
      } else {
        setError(err.message || 'Failed to register citizen account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#ffffff', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.07)', width: '100%', maxWidth: '520px', border: '1px solid #e2e8f0' }}>
        
        <button 
          onClick={() => navigate('/login')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: '0.85rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 24 }}
        >
          <ArrowLeft size={16} /> Back to Portal Selection
        </button>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-block', padding: '4px 12px', background: '#ecfdf5', color: '#059669', borderRadius: 99, fontSize: '0.8rem', fontWeight: 700, marginBottom: 12 }}>
            PUBLIC CITIZEN ACCESS
          </div>
          <h1 style={{ color: '#0f172a', fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px' }}>Citizen Registration</h1>
          <p style={{ color: '#64748b', fontSize: '0.92rem' }}>Sign up to monitor drinking water quality and receive instant contamination alerts for your district.</p>
        </div>
        
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.875rem', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <AlertTriangle size={18} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successMessage ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 size={36} />
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Registration Submitted!</h2>
            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 24 }}>
              {successMessage}
            </p>
            <Link to="/citizen/login" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '12px 28px', borderRadius: 8 }}>
              Go to Citizen Login
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Full Name *</label>
                <input required type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="e.g. Ramesh Kumar" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#0f172a', background: '#fff', fontSize: '0.95rem' }} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Mobile Number *</label>
                  <input required type="tel" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="10-digit mobile" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#0f172a', background: '#fff', fontSize: '0.95rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Email Address *</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleChange} placeholder="citizen@example.com" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#0f172a', background: '#fff', fontSize: '0.95rem' }} />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input required type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" style={{ width: '100%', padding: '10px 36px 10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#0f172a', background: '#fff', fontSize: '0.95rem' }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Confirm Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input required type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" style={{ width: '100%', padding: '10px 36px 10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#0f172a', background: '#fff', fontSize: '0.95rem' }} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}>
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>State / UT *</label>
                  <select required name="state_id" value={formData.state_id} onChange={handleChange} disabled={locLoading} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#0f172a', background: '#fff', fontSize: '0.95rem' }}>
                    <option value="">Select State</option>
                    {states.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>District *</label>
                  <select required name="district_id" value={formData.district_id} onChange={handleChange} disabled={!formData.state_id || locLoading} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#0f172a', background: '#fff', fontSize: '0.95rem' }}>
                    <option value="">{formData.state_id ? 'Select District' : 'Select State First'}</option>
                    {formData.state_id && getDistricts(formData.state_id).map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="submit" disabled={loading} style={{ marginTop: '8px', width: '100%', padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                {loading ? <><Loader2 size={20} className="animate-spin" /> Registering Citizen...</> : 'Complete Citizen Registration'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', margin: '22px 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
              <span style={{ padding: '0 16px', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleLogin} 
              style={{ width: '100%', padding: '12px', background: '#fff', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', transition: 'all 0.2s' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign Up with Google
            </button>
            
            <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
              Already registered? <Link to="/citizen/login" style={{ color: '#0ea5e9', textDecoration: 'none', fontWeight: 600 }}>Login here</Link>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
