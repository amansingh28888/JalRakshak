// JalRakshak — API client
import axios from 'axios';
import type {
  WaterSample, PaginatedResponse, DashboardSummary,
  WaterQualityVerdict, AdvisoryResponse, MapMarker, DemoScenario
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  headers: { 'Content-Type': 'application/json' },
});

// ── Samples ────────────────────────────────────────────────────────────────────
export interface SampleFilters {
  page?: number;
  page_size?: number;
  state?: string;
  district?: string;
  water_source?: string;
  season?: string;
  category?: string;
  severity?: string;
  action_code?: string;
  do_not_boil?: boolean;
  search?: string;
}

export const getSamples = (filters: SampleFilters = {}) =>
  api.get<PaginatedResponse<WaterSample>>('/api/samples', { params: filters }).then(r => r.data);

export const getSample = (id: number) =>
  api.get<WaterSample>(`/api/samples/${id}`).then(r => r.data);

export const getSampleVerdict = (id: number) =>
  api.get<WaterQualityVerdict>(`/api/samples/${id}/verdict`).then(r => r.data);

// ── Dashboard ──────────────────────────────────────────────────────────────────
export const getDashboardSummary = (params?: { state?: string; district?: string }) =>
  api.get<DashboardSummary>('/api/dashboard/summary', { params }).then(r => r.data);

export const getStateStats = () =>
  api.get<Record<string, unknown>[]>('/api/dashboard/by-state').then(r => r.data);

export const getDistrictStats = (state?: string) =>
  api.get<Record<string, unknown>[]>('/api/dashboard/by-district', { params: state ? { state } : {} }).then(r => r.data);

export const getStates = () =>
  api.get<string[]>('/api/states').then(r => r.data);

export const getDistricts = (state?: string) =>
  api.get<string[]>('/api/districts', { params: state ? { state } : {} }).then(r => r.data);

// ── Alerts ─────────────────────────────────────────────────────────────────────
export interface AlertFilters {
  page?: number;
  page_size?: number;
  do_not_boil_only?: boolean;
  critical_only?: boolean;
  category?: string;
  state?: string;
  district?: string;
}
export const getAlerts = (filters: AlertFilters = {}) =>
  api.get('/api/alerts', { params: filters }).then(r => r.data);

// ── User Profile ───────────────────────────────────────────────────────────────
export const updateProfile = (data: Record<string, any>) =>
  api.put('/api/auth/profile', data).then(r => r.data);


// ── Analytics & Reports ────────────────────────────────────────────────────────
export const getAnalyticsTrends = (params: any) => 
  api.get('/api/analytics/trends', { params }).then(r => r.data);

export const getAnalyticsForecast = (params: any) =>
  api.get('/api/analytics/forecast', { params }).then(r => r.data);

export const getAnalyticsCompare = (params: any) =>
  api.get('/api/analytics/compare', { params }).then(r => r.data);

// ── Map ────────────────────────────────────────────────────────────────────────
export const getMapMarkers = (params: Record<string, unknown> = {}) =>
  api.get<{ markers: MapMarker[]; total: number }>('/api/map/samples', { params }).then(r => r.data);

// ── Evaluate ───────────────────────────────────────────────────────────────────
export const evaluateSample = (sample: Record<string, unknown>) =>
  api.post<WaterQualityVerdict & { location: unknown }>('/api/evaluate', sample).then(r => r.data);

// ── AI Advisory ───────────────────────────────────────────────────────────────
export const getAdvisory = (request: Record<string, unknown>) =>
  api.post<AdvisoryResponse>('/api/ai/advisory', request).then(r => r.data);

export const getGeminiStatus = () =>
  api.get<{ gemini_configured: boolean; model?: string; fallback_available: boolean }>(
    '/api/ai/status'
  ).then(r => r.data);

// ── Demo Scenarios ─────────────────────────────────────────────────────────────
export const getDemoScenario = (scenario: string) =>
  api.get<DemoScenario>(`/api/demo/scenario/${scenario}`).then(r => r.data);

// ── Standards ──────────────────────────────────────────────────────────────────
export const getStandards = () =>
  api.get('/api/standards').then(r => r.data);

// ── Import ─────────────────────────────────────────────────────────────────────
export const importCsv = (file: File, replaceExisting = false) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post('/api/import', fd, {
    params: { replace_existing: replaceExisting },
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};

export const importSyntheticData = (n = 5000) =>
  api.post('/api/import/synthetic', null, { params: { n, replace_existing: true } }).then(r => r.data);

// ── Health ─────────────────────────────────────────────────────────────────────
export const getHealth = () =>
  api.get('/health').then(r => r.data);

// ── Public Stats (landing page, no auth) ───────────────────────────────────────
export interface PublicStats {
  total_samples: number;
  total_states: number;
  total_districts: number;
  safe_percentage: number;
  safe_samples?: number;
  biological_alerts: number;
  chemical_alerts: number;
  do_not_boil_alerts: number;
  active_workers: number;
}

export const getPublicStats = () =>
  api.get<PublicStats>('/api/dashboard/public-stats').then(r => r.data);

// ── Notifications ────────────────────────────────────────────────────────────────────────────────
const authApi = (token: string) => axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
});

export interface NotificationLog {
  id: number;
  alert_id: number;
  citizen_id: number | null;
  channel: string;
  recipient: string;
  recipient_role: string;
  language_code: string;
  status: string;
  is_read?: boolean;
  failure_reason: string | null;
  attempt_count: number;
  provider_message_id: string | null;
  sent_at: string | null;
  created_at: string;
  village?: string | null;
  district: string | null;
  state_ut: string | null;
  severity: string | null;
  sample_id_str: string | null;
}

export interface NotificationStats {
  alert_id: number;
  sample_id_str: string | null;
  village?: string | null;
  district: string | null;
  state_ut: string | null;
  severity: string | null;
  primary_contaminant?: string | null;
  sample_date?: string | null;
  total_notifications: number;
  sent: number;
  failed: number;
  pending: number;
  citizen_notified: number;
  admin_notified: number;
  has_simulation: boolean;
}

export interface NotificationConfigStatus {
  resend_configured: boolean;
  email_from: string;
  admin_alert_email_configured: boolean;
  warning: string | null;
}

export interface AlertCitizenRecipient {
  citizen_id: number;
  full_name: string;
  email: string;
  phone: string | null;
  village: string | null;
  district: string | null;
  state_ut: string | null;
  notification_status: string;
  attempt_count: number;
  failure_reason: string | null;
  sent_at: string | null;
  log_id: number | null;
}

export interface CitizenNotificationItem {
  id: number;
  alert_id: number;
  status: string;
  is_read: boolean;
  created_at: string;
  sent_at: string | null;
  village: string | null;
  district: string | null;
  state_ut: string | null;
  sample_id_str: string | null;
  severity: string | null;
  primary_contaminant: string | null;
  contaminant_value: string | null;
  contaminant_unit: string | null;
  contaminant_limit: string | null;
  do_not_boil: boolean;
  language_code: string;
  title: string;
  explanation: string;
  precautions: string[];
}

export const getNotificationConfigStatus = (token: string) =>
  authApi(token).get<NotificationConfigStatus>('/api/notifications/config-status').then(r => r.data);

export const getAdminNotificationLogs = (token: string, params: Record<string, unknown> = {}) =>
  authApi(token).get<NotificationLog[]>('/api/notifications/admin/logs', { params }).then(r => r.data);

export const getAdminNotificationStats = (token: string, params: Record<string, unknown> = {}) =>
  authApi(token).get<NotificationStats[]>('/api/notifications/admin/stats', { params }).then(r => r.data);

export const getAlertAffectedCitizens = (token: string, alertId: number) =>
  authApi(token).get<AlertCitizenRecipient[]>(`/api/notifications/admin/alert/${alertId}/citizens`).then(r => r.data);

export const sendAdminTestEmail = (token: string, data: { recipient_email: string; lang?: string }) =>
  authApi(token).post('/api/notifications/admin/test-email', data).then(r => r.data);

export const retryNotification = (token: string, logId: number) =>
  authApi(token).post(`/api/notifications/admin/retry/${logId}`).then(r => r.data);

export const getMyNotifications = (token: string, params: Record<string, unknown> = {}) =>
  authApi(token).get<CitizenNotificationItem[]>('/api/notifications/citizen/my', { params }).then(r => r.data);

export const markNotificationRead = (token: string, logId: number) =>
  authApi(token).post(`/api/notifications/citizen/read/${logId}`).then(r => r.data);

export const markAllNotificationsRead = (token: string) =>
  authApi(token).post('/api/notifications/citizen/read-all').then(r => r.data);
