import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { updateProfile } from '../../api';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocations } from '../../hooks/useLocations';


export default function CitizenProfileSetup() {
  const navigate = useNavigate();
  const { user, profile, profileLoaded, refreshProfile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    state_id: '',
    district_id: '',
  });

  const { states, getDistricts, loading: locLoading } = useLocations();

  useEffect(() => {
    // If not authenticated, send to login
    if (profileLoaded && !user) {
      navigate('/citizen/login');
      return;
    }

    // If profile is already complete, redirect to dashboard
    if (profileLoaded && profile) {
      if (profile.role === 'admin') {
        navigate('/admin/dashboard');
        return;
      }
      if (profile.role === 'field_worker') {
        navigate('/worker/dashboard');
        return;
      }
      if (profile.role === 'analyst') {
        navigate('/analyst/dashboard');
        return;
      }
      // If citizen already has district and state filled, they are set
      if (profile.role === 'citizen' && profile.state_ut && profile.district) {
        navigate('/citizen/dashboard');
        return;
      }
    }
    
    // Pre-fill from Google OAuth metadata
    if (user) {
      const name = user.user_metadata?.full_name || user.user_metadata?.name || '';
      const phone = user.user_metadata?.phone || '';
      setFormData(f => ({
        ...f,
        fullName: f.fullName || name,
        mobile: f.mobile || phone,
      }));
    }
  }, [user, profile, profileLoaded, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(f => ({ ...f, [e.target.name]: e.target.value }));
    if (e.target.name === 'state_id') {
      setFormData(f => ({ ...f, district_id: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);

    if (!formData.fullName.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!formData.mobile.trim() || formData.mobile.trim().length < 10) {
      setError('Please provide a valid mobile phone number.');
      return;
    }
    if (!formData.state_id || !formData.district_id) {
      setError('Please select your state and district.');
      return;
    }

    setLoading(true);

    try {
      const selectedState = states.find(s => s.id === formData.state_id);
      const selectedDistrict = getDistricts(formData.state_id).find(d => d.id === formData.district_id);

      // 1. Update user_profiles via backend authoritative endpoint
      try {
        await updateProfile({
          full_name: formData.fullName.trim(),
          phone: formData.mobile.trim(),
          state_ut: selectedState?.name || '',
          district: selectedDistrict?.name || '',
          state_id: formData.state_id,
          district_id: formData.district_id,
        });
      } catch (beErr) {
        console.warn('Backend updateProfile failed, falling back to direct Supabase:', beErr);
        const { error: userProfileError } = await supabase
          .from('user_profiles')
          .upsert({
            auth_user_id: user.id,
            full_name: formData.fullName.trim(),
            email: user.email,
            phone: formData.mobile.trim(),
            role: 'citizen',
            status: 'active',
            state_ut: selectedState?.name || '',
            district: selectedDistrict?.name || '',
            state_id: formData.state_id,
            district_id: formData.district_id,
          }, { onConflict: 'auth_user_id' });

        if (userProfileError) {
          console.warn('user_profiles update error:', userProfileError);
        }
      }


      // 2. Update citizen_profiles
      const { error: profileError } = await supabase
        .from('citizen_profiles')
        .upsert({
          user_id: user.id,
          full_name: formData.fullName.trim(),
          mobile: formData.mobile.trim(),
          email: user.email,
          state: selectedState?.name || '',
          district: selectedDistrict?.name || '',
          state_id: formData.state_id,
          district_id: formData.district_id,
        }, { onConflict: 'user_id' });

      if (profileError) throw profileError;

      // Refresh AuthContext state and navigate
      await refreshProfile();
      navigate('/citizen/dashboard');
      
    } catch (err: any) {
      setError(err.message || 'Failed to save profile. Please try again.');
      setLoading(false);
    }
  };

  if (!profileLoaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
        <Loader2 size={48} color="var(--color-primary)" className="animate-spin" />
        <div style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Loading profile...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#ffffff', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)', width: '100%', maxWidth: '500px', border: '1px solid #e2e8f0' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-block', padding: '4px 12px', background: '#ecfdf5', color: '#059669', borderRadius: 99, fontSize: '0.8rem', fontWeight: 700, marginBottom: 12 }}>
            STEP 2 OF 2: LOCATION DETAILS
          </div>
          <h1 style={{ color: '#0f172a', fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>Complete Your Profile</h1>
          <p style={{ color: '#64748b', fontSize: '0.92rem' }}>Please specify your residential district so JalRakshak can deliver real-time water quality advisories for your area.</p>
        </div>
        
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.875rem', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <AlertTriangle size={18} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Full Name *</label>
            <input required type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Full Name" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#0f172a', background: '#fff', fontSize: '0.95rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Mobile Number *</label>
            <input required type="tel" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="10-digit mobile number" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#0f172a', background: '#fff', fontSize: '0.95rem' }} />
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

          <button type="submit" disabled={loading} style={{ marginTop: '12px', width: '100%', padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            {loading ? <><Loader2 size={20} className="animate-spin" /> Saving Profile...</> : 'Save & Open Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
