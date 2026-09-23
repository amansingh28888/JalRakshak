import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { indiaLocations, indiaStates } from '../../utils/indiaLocations';

interface Worker {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  state_ut: string | null;
  district: string | null;
  status: string;
}

export default function WorkerManagement() {
  const { session } = useAuth();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    state_ut: '',
    district: '',
    village: ''
  });

  const fetchWorkers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/admin/workers`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setWorkers(data);
      }
    } catch (e) {
      console.error('Failed to fetch workers:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [session]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/admin/workers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess('Worker account created successfully!');
        setFormData({
          full_name: '', email: '', password: '', phone: '', state_ut: '', district: '', village: ''
        });
        setShowForm(false);
        fetchWorkers();
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to create worker');
      }
    } catch (e) {
      setError('A network error occurred.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>Field Workers</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>Manage field personnel and assignments.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <UserPlus size={18} /> {showForm ? 'Cancel' : 'Add Worker'}
        </button>
      </div>

      {error && (
        <div style={{ background: '#FCE8E8', color: 'var(--color-danger)', padding: '12px 16px', borderRadius: 8, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {success && (
        <div style={{ background: '#E6F6EF', color: 'var(--color-safe)', padding: '12px 16px', borderRadius: 8, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={20} /> {success}
        </div>
      )}

      {showForm && (
        <div className="card" style={{ padding: 32, marginBottom: 32 }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: 24 }}>Create New Worker Account</h2>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Full Name *</label>
              <input type="text" required className="form-input" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Email Address *</label>
              <input type="email" required className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Password *</label>
              <input type="password" required className="form-input" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Phone Number</label>
              <input type="text" className="form-input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>State/UT</label>
              <select 
                className="form-input" 
                value={formData.state_ut} 
                onChange={e => {
                  setFormData({
                    ...formData, 
                    state_ut: e.target.value,
                    district: '' // Reset district when state changes
                  });
                }}
              >
                <option value="">Select State / UT</option>
                {indiaStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>District</label>
              <select 
                className="form-input" 
                value={formData.district} 
                onChange={e => setFormData({...formData, district: e.target.value})}
                disabled={!formData.state_ut}
              >
                <option value="">Select District</option>
                {formData.state_ut && indiaLocations[formData.state_ut]?.map((district) => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Village / Block / Pincode</label>
              <input type="text" className="form-input" value={formData.village} onChange={e => setFormData({...formData, village: e.target.value})} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="submit" disabled={isCreating} className="btn-primary">
                {isCreating ? <><Loader2 size={18} className="animate-spin" /> Creating...</> : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><Loader2 size={32} className="animate-spin" style={{ margin: '0 auto' }} color="var(--color-primary)" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {workers.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-secondary)' }}>No workers found.</td>
                </tr>
              ) : workers.map(worker => (
                <tr key={worker.id}>
                  <td style={{ fontWeight: 500 }}>{worker.full_name}</td>
                  <td>{worker.email}</td>
                  <td>{worker.district ? `${worker.district}, ${worker.state_ut}` : 'Unassigned'}</td>
                  <td>
                    <span className={worker.status === 'active' ? 'severity-SAFE' : 'severity-CRITICAL'}>
                      {worker.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
