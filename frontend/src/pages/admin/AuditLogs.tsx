import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader2, FileText } from 'lucide-react';

interface Log {
  id: number;
  auth_user_id: string;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  WORKER_CREATED: 'severity-SAFE',
  WORKER_STATUS_CHANGED: 'severity-MODERATE',
  SAMPLE_CREATED: 'severity-SAFE',
};

export default function AuditLogs() {
  const { session } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/admin/audit-logs?limit=100`,
          { headers: { Authorization: `Bearer ${session?.access_token}` } }
        );
        if (res.ok) setLogs(await res.json());
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    };
    if (session) fetch_();
  }, [session]);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <FileText size={28} color="var(--color-primary)" /> Audit Logs
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Chronological record of all system actions. {logs.length > 0 && `(${logs.length} entries)`}</p>
      </div>

      <div className="card">
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto' }} color="var(--color-primary)" />
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            No audit events recorded yet.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Entity ID</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>{log.id}</td>
                  <td>
                    <span className={ACTION_COLORS[log.action] || 'severity-MODERATE'}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>{log.entity_type}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{log.entity_id}</td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                    {log.created_at ? new Date(log.created_at).toLocaleString('en-IN') : '—'}
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
