import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Sample {
  id: number;
  sample_id: string;
  state_ut: string;
  district: string;
  village: string;
  water_source_type: string;
  alert_category: string;
  severity: string;
}

export default function AdminSamples() {
  const { session } = useAuth();
  const [samples, setSamples] = useState<Sample[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSamples = async (pageIndex: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/samples?page=${pageIndex}&page_size=20`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSamples(data.items);
        setTotalPages(data.pages);
      }
    } catch (e) {
      console.error('Failed to fetch samples:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSamples(page);
  }, [session, page]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>All Samples</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>Review water quality submissions from all sources.</p>
        </div>
      </div>

      <div className="card">
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
            <input type="text" placeholder="Search by ID, State, or District..." className="form-input" style={{ paddingLeft: 44, width: '100%', maxWidth: 400 }} />
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><Loader2 size={32} className="animate-spin" style={{ margin: '0 auto' }} color="var(--color-primary)" /></div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sample ID</th>
                  <th>Location</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {samples.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-secondary)' }}>No samples found.</td>
                  </tr>
                ) : samples.map(sample => (
                  <tr key={sample.id}>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{sample.sample_id}</td>
                    <td>{sample.village}, {sample.district}, {sample.state_ut}</td>
                    <td>{sample.water_source_type}</td>
                    <td>
                      <span className={`severity-${sample.severity.toUpperCase()}`}>
                        {sample.alert_category}
                      </span>
                    </td>
                    <td>
                      <Link to={`/citizen/sample/${sample.id}`} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', textDecoration: 'none' }}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div style={{ padding: '16px 32px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Page {page} of {totalPages}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={page === 1}
                  className="btn-secondary"
                >
                  Previous
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                  disabled={page === totalPages}
                  className="btn-primary"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
