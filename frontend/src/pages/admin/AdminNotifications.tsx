/**
 * JalRakshak — Admin Notifications & Email Dashboard
 * ====================================================
 * Displays email notification delivery status, stats, config warnings,
 * village citizen recipient details, and allows sending test emails and retrying deliveries.
 */import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getNotificationConfigStatus,
  getAdminNotificationStats,
  getAdminNotificationLogs,
  getAlertAffectedCitizens,
  sendAdminTestEmail,
  retryNotification,
  type NotificationLog,
  type NotificationStats,
  type NotificationConfigStatus,
  type AlertCitizenRecipient,
} from '../../api';
import {
  Mail, AlertTriangle, CheckCircle2, XCircle, RefreshCw,
  Globe, BarChart2, Clock, Eye, Users, Send,
  Zap, X
} from 'lucide-react';

const LANG_NAMES: Record<string, string> = {
  en: 'English', hi: 'हिंदी', pa: 'ਪੰਜਾਬੀ', bn: 'বাংলা',
  mr: 'मराठी', gu: 'ગુજરાતી', ta: 'தமிழ்', te: 'తెలుగు',
  kn: 'ಕನ್ನಡ', ml: 'മലയാളം', or: 'ଓଡ଼ିଆ', as: 'অসমীয়া', ur: 'اردو',
};

const SEVERITY_STYLE: Record<string, { color: string; bg: string }> = {
  CRITICAL: { color: '#DC2626', bg: '#FEF2F2' },
  HIGH:     { color: '#EA580C', bg: '#FFF7ED' },
  MODERATE: { color: '#D97706', bg: '#FFFBEB' },
  LOW:      { color: '#16A34A', bg: '#F0FDF4' },
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
    SENT:           { bg: '#DCFCE7', color: '#166534', icon: <CheckCircle2 size={12} /> },
    DELIVERED:      { bg: '#DCFCE7', color: '#166534', icon: <CheckCircle2 size={12} /> },
    FAILED:         { bg: '#FEE2E2', color: '#991B1B', icon: <XCircle size={12} /> },
    PENDING:        { bg: '#FEF9C3', color: '#854D0E', icon: <Clock size={12} /> },
    NOT_DISPATCHED: { bg: '#F3F4F6', color: '#4B5563', icon: <AlertTriangle size={12} /> },
  };
  const s = styles[status] || { bg: '#F3F4F6', color: '#374151', icon: null };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: s.bg, color: s.color,
      padding: '2px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700,
    }}>
      {s.icon}{status}
    </span>
  );
}

function ConfigWarningBanner({ config }: { config: NotificationConfigStatus }) {
  if (config.resend_configured) {
    return (
      <div style={{
        background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: 10,
        padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
      }}>
        <CheckCircle2 size={20} color="#16A34A" />
        <div>
          <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.9rem' }}>
            Resend is configured — real emails are being delivered
          </div>
          <div style={{ color: '#166534', fontSize: '0.8rem', marginTop: 2 }}>
            From: {config.email_from} &nbsp;|&nbsp;
            Admin alerts: {config.admin_alert_email_configured ? '✅ configured' : '⚠️ not set'}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{
      background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10,
      padding: '14px 20px', display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20,
    }}>
      <AlertTriangle size={20} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
      <div>
        <div style={{ fontWeight: 700, color: '#92400E', fontSize: '0.9rem' }}>
          Email delivery is in simulation mode
        </div>
        <div style={{ color: '#92400E', fontSize: '0.8rem', marginTop: 4, lineHeight: 1.5 }}>
          {config.warning}
        </div>
        <div style={{ marginTop: 8, fontSize: '0.8rem', color: '#78350F' }}>
          To enable real delivery: set <code style={{ background: '#FDE68A', padding: '1px 6px', borderRadius: 4 }}>RESEND_API_KEY=re_xxxxxxx</code> in <code>backend/.env</code> and restart the server.
        </div>
      </div>
    </div>
  );
}

export default function AdminNotifications() {
  const { session } = useAuth();
  const token = session?.access_token ?? '';

  const [config, setConfig] = useState<NotificationConfigStatus | null>(null);
  const [stats, setStats] = useState<NotificationStats[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'logs'>('stats');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [villageFilter, setVillageFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');

  // Retrying & Test Email state
  const [retryingId, setRetryingId] = useState<number | null>(null);
  const [retryMsg, setRetryMsg] = useState<string | null>(null);

  // Test Email Modal
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmailInput, setTestEmailInput] = useState('');
  const [testLangInput, setTestLangInput] = useState('en');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Citizen Recipients Modal for an alert
  const [inspectAlertId, setInspectAlertId] = useState<number | null>(null);
  const [alertCitizens, setAlertCitizens] = useState<AlertCitizenRecipient[]>([]);
  const [citizensLoading, setCitizensLoading] = useState(false);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [cfg, st] = await Promise.all([
        getNotificationConfigStatus(token),
        getAdminNotificationStats(token),
      ]);
      setConfig(cfg);
      setStats(st);
    } catch (e) {
      console.error('Failed to load notifications config/stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    if (!token) return;
    setLogsLoading(true);
    try {
      const params: Record<string, unknown> = { page_size: 100 };
      if (statusFilter) params.status = statusFilter;
      if (villageFilter) params.village = villageFilter;
      if (districtFilter) params.district = districtFilter;
      const data = await getAdminNotificationLogs(token, params);
      setLogs(data);
    } catch (e) {
      console.error('Failed to load notification logs:', e);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]);
  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab, statusFilter, villageFilter, districtFilter, token]);

  const handleInspectAlert = async (alertId: number) => {
    setInspectAlertId(alertId);
    setCitizensLoading(true);
    try {
      const citizens = await getAlertAffectedCitizens(token, alertId);
      setAlertCitizens(citizens);
    } catch (e) {
      console.error('Failed to load affected citizens for alert:', e);
      setAlertCitizens([]);
    } finally {
      setCitizensLoading(false);
    }
  };

  const handleRetry = async (logId: number) => {
    setRetryingId(logId);
    setRetryMsg(null);
    try {
      const result = await retryNotification(token, logId);
      setRetryMsg(`Retry status: ${result.status}${result.simulated ? ' (simulated)' : ''}`);
      await loadLogs();
      if (inspectAlertId) {
        await handleInspectAlert(inspectAlertId);
      }
    } catch (e) {
      setRetryMsg('Retry failed — check backend logs');
    } finally {
      setRetryingId(null);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailInput.trim()) return;
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await sendAdminTestEmail(token, {
        recipient_email: testEmailInput.trim(),
        lang: testLangInput,
      });
      setTestResult(res);
    } catch (e: any) {
      setTestResult({
        success: false,
        failure_reason: e?.response?.data?.detail || e.message || 'Request failed',
      });
    } finally {
      setTestSending(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 12 }}>Loading notification dashboard…</p>
        </div>
      </div>
    );
  }

  // Filtered stats
  const filteredStats = stats.filter(s => {
    if (villageFilter && !(s.village || '').toLowerCase().includes(villageFilter.toLowerCase())) return false;
    if (districtFilter && !(s.district || '').toLowerCase().includes(districtFilter.toLowerCase())) return false;
    return true;
  });

  const totalSent = stats.reduce((a, s) => a + s.sent, 0);
  const totalFailed = stats.reduce((a, s) => a + s.failed, 0);
  const totalPending = stats.reduce((a, s) => a + s.pending, 0);
  const totalAlerts = stats.length;
  const totalCitizens = stats.reduce((a, s) => a + s.citizen_notified, 0);

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', paddingBottom: 48 }}>

      {/* Page Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Mail size={28} color="#0369A1" /> Email Alert & Notification Centre
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 6, fontSize: '0.95rem' }}>
            Automatic Resend email delivery, affected village citizen targeting, and live delivery logs
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => { setShowTestModal(true); setTestResult(null); }}
            style={{
              padding: '10px 18px', borderRadius: 8, border: 'none', background: '#0284C7',
              color: '#fff', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 4px rgba(2,132,199,0.2)',
            }}
          >
            <Send size={15} /> Send Test Email
          </button>
          <button
            onClick={() => { load(); if (activeTab === 'logs') loadLogs(); }}
            style={{
              padding: '10px 16px', borderRadius: 8, border: '1px solid var(--color-border)',
              background: 'var(--color-card)', color: 'var(--color-text)', fontWeight: 600,
              fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Config Status Banner */}
      {config && <ConfigWarningBanner config={config} />}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Alerts Monitored', value: totalAlerts, icon: <Zap size={20} color="#6D28D9" />, bg: '#EDE9FE', color: '#6D28D9' },
          { label: 'Citizens Reached', value: totalCitizens, icon: <Users size={20} color="#0369A1" />, bg: '#E0F2FE', color: '#0369A1' },
          { label: 'Emails Delivered', value: totalSent, icon: <CheckCircle2 size={20} color="#16A34A" />, bg: '#DCFCE7', color: '#16A34A' },
          { label: 'Pending / Simulated', value: totalPending, icon: <Clock size={20} color="#D97706" />, bg: '#FEF3C7', color: '#D97706' },
          { label: 'Failed Deliveries', value: totalFailed, icon: <XCircle size={20} color="#DC2626" />, bg: '#FEE2E2', color: '#DC2626' },
        ].map(card => (
          <div key={card.label} className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {card.icon}
            </div>
            <div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>{card.label}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: card.color, lineHeight: 1.1 }}>{card.value.toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs & Search Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['stats', 'logs'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.9rem',
                background: activeTab === tab ? '#0369A1' : 'var(--color-card)',
                color: activeTab === tab ? '#fff' : 'var(--color-text-secondary)',
                transition: 'all 0.2s',
              }}
            >
              {tab === 'stats' ? <><BarChart2 size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />Alert Overview & Villages</> : <><Eye size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />Detailed Delivery Log</>}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Filter by village..."
            value={villageFilter}
            onChange={e => setVillageFilter(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)',
              background: 'var(--color-card)', color: 'var(--color-text)', fontSize: '0.85rem', width: 160,
            }}
          />
          <input
            type="text"
            placeholder="Filter by district..."
            value={districtFilter}
            onChange={e => setDistrictFilter(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)',
              background: 'var(--color-card)', color: 'var(--color-text)', fontSize: '0.85rem', width: 160,
            }}
          />
          {activeTab === 'logs' && (
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)',
                background: 'var(--color-card)', color: 'var(--color-text)', fontSize: '0.85rem',
              }}
            >
              <option value="">All Statuses</option>
              <option value="SENT">Sent / Delivered</option>
              <option value="PENDING">Pending (Simulated)</option>
              <option value="FAILED">Failed</option>
            </select>
          )}
        </div>
      </div>

      {retryMsg && (
        <div style={{ marginBottom: 16, padding: '10px 18px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, color: '#1E40AF', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{retryMsg}</span>
          <button onClick={() => setRetryMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1E40AF' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Tab: Alert Stats & Affected Villages ── */}
      {activeTab === 'stats' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={16} color="#0369A1" />
            <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>Alerts & Village Recipient Matching</span>
            <span style={{ marginLeft: 'auto', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>{filteredStats.length} alerts</span>
          </div>

          {filteredStats.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              <Mail size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p>No alert notification records match your filter.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg)' }}>
                    {['Alert ID', 'Sample', 'Village / Location', 'Severity', 'Contaminant', 'Date', 'Total', 'Sent', 'Pending', 'Failed', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', borderBottom: '1px solid var(--color-border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStats.map((s, i) => {
                    const sev = SEVERITY_STYLE[s.severity || ''] || { color: '#374151', bg: '#F3F4F6' };
                    return (
                      <tr key={s.alert_id} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#0369A1' }}>
                          #{s.alert_id}
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                          {s.sample_id_str || '-'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                            {s.village ? `Village: ${s.village}` : <span style={{ color: '#D97706' }}>No Village (Ambiguous)</span>}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                            {s.district}, {s.state_ut}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ background: sev.bg, color: sev.color, padding: '2px 8px', borderRadius: 6, fontWeight: 700, fontSize: '0.75rem' }}>
                            {s.severity}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '0.85rem' }}>
                          {s.primary_contaminant || 'Standard issue'}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                          {s.sample_date || '-'}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700 }}>{s.total_notifications}</td>
                        <td style={{ padding: '12px 14px', color: '#16A34A', fontWeight: 700 }}>{s.sent}</td>
                        <td style={{ padding: '12px 14px', color: '#D97706', fontWeight: s.pending > 0 ? 700 : 400 }}>{s.pending}</td>
                        <td style={{ padding: '12px 14px', color: s.failed > 0 ? '#DC2626' : '#374151', fontWeight: s.failed > 0 ? 700 : 400 }}>{s.failed}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <button
                            onClick={() => handleInspectAlert(s.alert_id)}
                            style={{
                              padding: '6px 12px', borderRadius: 6, border: '1px solid #BAE6FD',
                              background: '#F0F9FF', color: '#0369A1', fontSize: '0.78rem',
                              fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                            }}
                          >
                            <Users size={13} /> View Village Citizens
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Detailed Delivery Log ── */}
      {activeTab === 'logs' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Eye size={16} color="#0369A1" />
            <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>Delivery Log Audit Trail</span>
            <span style={{ marginLeft: 'auto', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>{logs.length} records</span>
          </div>

          {logsLoading ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : logs.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              <Mail size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p>No delivery logs match your criteria.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg)' }}>
                    {['Log ID', 'Alert', 'Recipient', 'Role', 'Language', 'Status', 'Attempts', 'Provider ID / Reason', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', borderBottom: '1px solid var(--color-border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr key={log.id} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>{log.id}</td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#0369A1' }}>
                        #{log.alert_id}
                        {log.village && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: 'sans-serif', fontWeight: 500 }}>{log.village}</div>}
                        {log.district && <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontFamily: 'sans-serif' }}>{log.district}</div>}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{log.recipient}</span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, background: log.recipient_role === 'admin' ? '#EDE9FE' : '#E0F2FE', color: log.recipient_role === 'admin' ? '#6D28D9' : '#0369A1' }}>
                          {log.recipient_role}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Globe size={12} />
                          {LANG_NAMES[log.language_code] || log.language_code}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <StatusBadge status={log.status} />
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>{log.attempt_count}</td>
                      <td style={{ padding: '12px 14px', maxWidth: 220 }}>
                        {log.provider_message_id ? (
                          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#166534', background: '#DCFCE7', padding: '1px 5px', borderRadius: 4 }}>
                            {log.provider_message_id.slice(0, 16)}...
                          </span>
                        ) : log.failure_reason ? (
                          <span title={log.failure_reason} style={{ fontSize: '0.75rem', color: '#DC2626' }}>
                            {log.failure_reason.slice(0, 50)}...
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {log.status !== 'SENT' && (
                          <button
                            onClick={() => handleRetry(log.id)}
                            disabled={retryingId === log.id}
                            style={{
                              padding: '5px 10px', borderRadius: 6, border: '1px solid var(--color-border)',
                              background: 'var(--color-card)', color: '#0369A1', fontSize: '0.75rem',
                              fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            <RefreshCw size={11} style={{ animation: retryingId === log.id ? 'spin 1s linear infinite' : 'none' }} />
                            Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Modal: Inspect Village Citizens for an Alert ── */}
      {inspectAlertId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 880, maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={18} color="#0369A1" /> Affected Village Registered Citizens — Alert #{inspectAlertId}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                  Only authorized admins may view affected citizens' contact and delivery statuses.
                </div>
              </div>
              <button onClick={() => setInspectAlertId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', padding: 20 }}>
              {citizensLoading ? (
                <div style={{ padding: 40, textAlign: 'center' }}>
                  <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : alertCitizens.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  <Users size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <p>No registered citizens found in this affected village.</p>
                  <p style={{ fontSize: '0.8rem', marginTop: 4 }}>
                    Alert is retained on the system. When citizens register in this village, future alerts will notify them automatically.
                  </p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bg)' }}>
                      {['Citizen Name', 'Registered Email', 'Phone', 'Location', 'Delivery Status', 'Attempts', 'Action'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {alertCitizens.map((c, i) => (
                      <tr key={c.citizen_id} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--color-text)' }}>{c.full_name}</td>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>{c.email}</td>
                        <td style={{ padding: '10px 12px' }}>{c.phone || '-'}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <div>{c.village || '-'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{c.district}, {c.state_ut}</div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <StatusBadge status={c.notification_status} />
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>{c.attempt_count}</td>
                        <td style={{ padding: '10px 12px' }}>
                          {c.log_id && c.notification_status !== 'SENT' && (
                            <button
                              onClick={() => handleRetry(c.log_id!)}
                              disabled={retryingId === c.log_id}
                              style={{
                                padding: '4px 8px', borderRadius: 6, border: '1px solid var(--color-border)',
                                background: 'var(--color-card)', color: '#0369A1', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                              }}
                            >
                              Retry
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setInspectAlertId(null)}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-card)', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Send Test Email ── */}
      {showTestModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 540 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Send size={18} color="#0284C7" /> Send Provider Verification Test Email
              </h3>
              <button onClick={() => setShowTestModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendTestEmail} style={{ padding: 20 }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 0, marginBottom: 16 }}>
                Sends a formatted water-quality alert test email via Resend to verify your API credentials, DNS domain verification, and template rendering.
              </p>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={testEmailInput}
                  onChange={e => setTestEmailInput(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                    color: 'var(--color-text)', fontSize: '0.9rem', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>
                  Template Language
                </label>
                <select
                  value={testLangInput}
                  onChange={e => setTestLangInput(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                    color: 'var(--color-text)', fontSize: '0.9rem', boxSizing: 'border-box',
                  }}
                >
                  {Object.entries(LANG_NAMES).map(([code, name]) => (
                    <option key={code} value={code}>{name} ({code})</option>
                  ))}
                </select>
              </div>

              {testResult && (
                <div style={{
                  padding: 14, borderRadius: 8, marginBottom: 18,
                  background: testResult.success && !testResult.simulated ? '#DCFCE7' : testResult.simulated ? '#FEF3C7' : '#FEE2E2',
                  border: `1px solid ${testResult.success && !testResult.simulated ? '#86EFAC' : testResult.simulated ? '#FCD34D' : '#FCA5A5'}`,
                  fontSize: '0.85rem',
                }}>
                  <div style={{ fontWeight: 700, color: testResult.success && !testResult.simulated ? '#166534' : testResult.simulated ? '#92400E' : '#991B1B' }}>
                    {testResult.success && !testResult.simulated
                      ? '✅ Test email accepted by Resend!'
                      : testResult.simulated
                      ? '⚠️ Simulation mode (Resend API key not configured)'
                      : '❌ Email delivery failed'}
                  </div>
                  {testResult.provider_message_id && (
                    <div style={{ marginTop: 4, fontFamily: 'monospace', fontSize: '0.8rem', color: '#166534' }}>
                      Resend ID: {testResult.provider_message_id}
                    </div>
                  )}
                  {testResult.failure_reason && (
                    <div style={{ marginTop: 4, color: '#991B1B' }}>
                      {testResult.failure_reason}
                    </div>
                  )}
                  {testResult.config_warning && (
                    <div style={{ marginTop: 4, color: '#92400E' }}>
                      {testResult.config_warning}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-card)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={testSending}
                  style={{
                    padding: '8px 20px', borderRadius: 8, border: 'none', background: '#0284C7',
                    color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  {testSending ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                  {testSending ? 'Sending...' : 'Send Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
