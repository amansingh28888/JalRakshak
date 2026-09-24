import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Droplets } from 'lucide-react';
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
  sample_date: string;
}

export default function WorkerSamples() {
  const { session } = useAuth();
  const [samples, setSamples] = useState<Sample[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetch_ = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/worker/samples?page=${page}&page_size=20`,
          { headers: { Authorization: `Bearer ${session?.access_token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setSamples(data.items || []);
          setTotalPages(data.pages || 1);
          setTotal(data.total || 0);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    if (session) fetch_();
  }, [session, page]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>My Samples</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {total > 0 ? `${total} total samples submitted by you` : 'Your water quality submissions'}
          </p>
        </div>
        <Link to="/worker/collect" className="btn-primary" style={{ textDecoration: 'none' }}>
          + New Sample
        </Link>
      </div>

      <div className="card">
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto' }} color="var(--color-primary)" />
          </div>
        ) : samples.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <Droplets size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p style={{ marginBottom: 16 }}>You have not submitted any samples yet.</p>
            <Link to="/worker/collect" className="btn-primary" style={{ textDecoration: 'none' }}>
              Submit Your First Sample
            </Link>
          </div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sample ID</th>
                  <th>Location</th>
                  <th>Source</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {samples.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{s.sample_id}</td>
                    <td>{s.village ? `${s.village}, ` : ''}{s.district}, {s.state_ut}</td>
                    <td>{s.water_source_type || '—'}</td>
                    <td>{s.sample_date || '—'}</td>
                    <td><span className={`severity-${s.severity?.toUpperCase()}`}>{s.alert_category || '—'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div style={{ padding: '16px 32px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Page {page} of {totalPages}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary">Previous</button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-primary">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
