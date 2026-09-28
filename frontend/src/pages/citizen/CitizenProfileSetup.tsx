import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocations } from '../../hooks/useLocations';

export default function CitizenProfileSetup() {
  const navigate = useNavigate();
  const { user, profile, profileLoaded } = useAuth();
  
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
    // If they already have a profile, they don't need to be here
    if (profileLoaded && profile) {
      if (profile.role === 'citizen') navigate('/citizen/dashboard');
      else navigate('/');
    }
    // If they are not logged into auth at all
    if (profileLoaded && !user) {
      navigate('/citizen/login');
    }
    
    if (user && user.user_metadata?.full_name) {
      setFormData(f => ({ ...f, fullName: user.user_metadata.full_name }));
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
    setLoading(true);

    try {
      const { error: profileError } = await supabase.from('citizen_profiles').insert({
        user_id: user.id,
        full_name: formData.fullName,
        mobile: formData.mobile,
        email: user.email,
        state_id: formData.state_id,
        district_id: formData.district_id,
      });

      if (profileError) throw profileError;

      // Force a reload to let AuthContext pick up the new profile
      window.location.href = '/citizen/dashboard';
      
    } catch (err: any) {
      setError(err.message || 'Failed to save profile. Please try again.');
      setLoading(false);
    }
  };

  if (!profileLoaded) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '24px' }}>
      <div style={{ background: '#ffffff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', width: '100%', maxWidth: '500px' }}>
        <h1 style={{ color: '#0f172a', fontSize: '1.75rem', marginBottom: '8px', textAlign: 'center' }}>Complete Your Profile</h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '24px', textAlign: 'center' }}>Please provide your details to receive accurate water quality alerts.</p>
        
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
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
