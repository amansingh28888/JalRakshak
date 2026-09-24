import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle, Droplets } from 'lucide-react';
import { indiaLocations, indiaStates } from '../../utils/indiaLocations';

const WATER_SOURCES = ['Groundwater', 'Surface Water', 'Tap Water', 'Borewell', 'Handpump', 'River', 'Canal', 'Lake', 'Pond', 'Spring', 'Rainwater', 'Well'];
const SEASONS = ['Summer', 'Winter', 'Monsoon', 'Post-Monsoon'];

export default function CollectSample() {
  const { session, profile } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    // Location
    state_ut: profile?.state_ut || '',
    district: profile?.district || '',
    village: profile?.village || '',
    water_source_type: '',
    season_cycle: '',
    sample_date: new Date().toISOString().slice(0, 10),
    location_type: 'field',
    // Physical
    ph: '',
    turbidity_ntu: '',
    tds_mg_l: '',
    total_hardness_mg_l: '',
    chloride_mg_l: '',
    // Chemical
    fluoride_mg_l: '',
    arsenic_ug_l: '',
    nitrate_mg_l: '',
    iron_mg_l: '',
    uranium_ug_l: '',
    // Biological
    e_coli_mpn: '',
    total_coliform_mpn: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Build payload — only send fields with values
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(form)) {
      if (v === '') continue;
      const numFields = ['ph','turbidity_ntu','tds_mg_l','total_hardness_mg_l','chloride_mg_l','fluoride_mg_l','arsenic_ug_l','nitrate_mg_l','iron_mg_l','uranium_ug_l','e_coli_mpn','total_coliform_mpn'];
      payload[k] = numFields.includes(k) ? parseFloat(v as string) : v;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(
        `${baseUrl}/api/worker/samples`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/worker/samples'), 2000);
      } else {
        const data = await res.json();
        setError(data.detail || 'Submission failed. Please try again.');
      }
    } catch (e) {
      setError('Network error. Check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(22,138,91,0.1)', color: '#168A5B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle size={40} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Sample Submitted!</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>Sample recorded successfully.</p>
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Redirecting to your samples...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Droplets size={28} color="var(--color-primary)" /> Collect Water Sample
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>
          Fill in the measured values. The system will automatically classify water quality.
        </p>
      </div>

      {error && (
        <div style={{ background: '#FCE8E8', color: 'var(--color-danger)', padding: '12px 16px', borderRadius: 8, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={20} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Section: Location */}
        <div className="card" style={{ padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 24, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            📍 Sample Location
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>State / UT *</label>
              <select required className="form-input" value={form.state_ut}
                onChange={e => { set('state_ut', e.target.value); set('district', ''); }}
                disabled={!!profile?.state_ut}>
                <option value="">Select State</option>
                {indiaStates.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {profile?.state_ut && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>Pre-filled from your assignment</div>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>District *</label>
              <select required className="form-input" value={form.district}
                onChange={e => set('district', e.target.value)}
                disabled={!form.state_ut || !!profile?.district}>
                <option value="">Select District</option>
                {form.state_ut && indiaLocations[form.state_ut]?.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Village / Block / Locality</label>
              <input className="form-input" type="text" value={form.village} onChange={e => set('village', e.target.value)} placeholder="Enter village or locality name" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Water Source *</label>
              <select required className="form-input" value={form.water_source_type} onChange={e => set('water_source_type', e.target.value)}>
                <option value="">Select Source</option>
                {WATER_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Season</label>
              <select className="form-input" value={form.season_cycle} onChange={e => set('season_cycle', e.target.value)}>
                <option value="">Select Season</option>
                {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Sample Date</label>
              <input className="form-input" type="date" value={form.sample_date} onChange={e => set('sample_date', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Section: Physical Parameters */}
        <div className="card" style={{ padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 24, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ⚗️ Physical Parameters
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {[
              { key: 'ph', label: 'pH (0–14)', placeholder: 'e.g. 7.2' },
              { key: 'turbidity_ntu', label: 'Turbidity (NTU)', placeholder: 'e.g. 5.0' },
              { key: 'tds_mg_l', label: 'TDS (mg/L)', placeholder: 'e.g. 350' },
              { key: 'total_hardness_mg_l', label: 'Total Hardness (mg/L)', placeholder: 'e.g. 200' },
              { key: 'chloride_mg_l', label: 'Chloride (mg/L)', placeholder: 'e.g. 100' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>{f.label}</label>
                <input className="form-input" type="number" step="0.001" value={form[f.key as keyof typeof form]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} />
              </div>
            ))}
          </div>
        </div>

        {/* Section: Chemical Parameters */}
        <div className="card" style={{ padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 24, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🧪 Chemical Parameters
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {[
              { key: 'fluoride_mg_l', label: 'Fluoride (mg/L)', placeholder: 'e.g. 1.0' },
              { key: 'arsenic_ug_l', label: 'Arsenic (µg/L)', placeholder: 'e.g. 10' },
              { key: 'nitrate_mg_l', label: 'Nitrate (mg/L)', placeholder: 'e.g. 45' },
              { key: 'iron_mg_l', label: 'Iron (mg/L)', placeholder: 'e.g. 0.3' },
              { key: 'uranium_ug_l', label: 'Uranium (µg/L)', placeholder: 'e.g. 15' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>{f.label}</label>
                <input className="form-input" type="number" step="0.001" value={form[f.key as keyof typeof form]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} />
              </div>
            ))}
          </div>
        </div>

        {/* Section: Biological Parameters */}
        <div className="card" style={{ padding: 32, marginBottom: 32 }}>
          <h2 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 24, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🦠 Microbiological Parameters
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>E. Coli (MPN/100mL)</label>
              <input className="form-input" type="number" step="0.1" value={form.e_coli_mpn} onChange={e => set('e_coli_mpn', e.target.value)} placeholder="e.g. 0 or 50" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Total Coliform (MPN/100mL)</label>
              <input className="form-input" type="number" step="0.1" value={form.total_coliform_mpn} onChange={e => set('total_coliform_mpn', e.target.value)} placeholder="e.g. 0 or 100" />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
          <button type="button" className="btn-secondary" onClick={() => navigate('/worker/dashboard')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting} style={{ padding: '12px 32px' }}>
            {submitting ? <><Loader2 size={18} className="animate-spin" /> Analysing & Saving...</> : 'Submit Sample'}
          </button>
        </div>
      </form>
    </div>
  );
}
