// JalRakshak — API client
import axios from 'axios';
import type {
  WaterSample, PaginatedResponse, DashboardSummary,
  WaterQualityVerdict, AdvisoryResponse, MapMarker, DemoScenario
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
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
export const getDashboardSummary = () =>
  api.get<DashboardSummary>('/api/dashboard/summary').then(r => r.data);

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
}
export const getAlerts = (filters: AlertFilters = {}) =>
  api.get('/api/alerts', { params: filters }).then(r => r.data);

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
  biological_alerts: number;
  chemical_alerts: number;
  do_not_boil_alerts: number;
  active_workers: number;
}

export const getPublicStats = () =>
  api.get<PublicStats>('/api/dashboard/public-stats').then(r => r.data);
