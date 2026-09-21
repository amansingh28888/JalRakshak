import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSamples, getStates } from '../api';
import type { WaterSample, PaginatedResponse } from '../types';
import { getCategoryConfig, getActionConfig } from '../utils/display';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'POTABLE_SAFE', label: '✅ Safe' },
  { value: 'UNSAFE_BIOLOGICAL_PATHOGEN', label: '🦠 Biological' },
  { value: 'CRITICAL_CHEMICAL_TOXIN', label: '⚗️ Chemical' },
  { value: 'MODERATE_PHYSICAL_PARAM', label: '🌊 Physical' },
  { value: 'CRITICAL_MIXED_HAZARD', label: '☣️ Mixed' },
];

export default function Explorer() {
  const navigate = useNavigate();
  const [data, setData] = useState<PaginatedResponse<WaterSample> | null>(null);
  const [states, setStates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    page: 1, page_size: 25,
    state: '', district: '', category: '',
    do_not_boil: undefined as boolean | undefined,
    search: '',
  });

  const fetchData = useCallback(() => {
    setLoading(true);
    const params: Record<string, unknown> = { ...filters };
    if (!params.state) delete params.state;
    if (!params.district) delete params.district;
    if (!params.category) delete params.category;
    if (params.do_not_boil === undefined) delete params.do_not_boil;
    if (!params.search) delete params.search;

    getSamples(params as Parameters<typeof getSamples>[0])
      .then(setData)
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { getStates().then(setStates); }, []);

  const setFilter = (key: string, val: unknown) =>
    setFilters(f => ({ ...f, [key]: val, page: 1 }));

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Outfit', fontSize: '1.75rem', fontWeight: 800, color: '#e2e8f0', marginBottom: 6 }}>
          🔍 Water Quality Explorer
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Browse, search, and filter all water quality samples. Click any row for full details.
        </p>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <input className="form-input" placeholder="🔍 Search state / district / village..."
            value={filters.search} onChange={e => setFilter('search', e.target.value)} />
          <select className="form-input" value={filters.state} onChange={e => setFilter('state', e.target.value)}>
            <option value="">All States</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="form-input" value={filters.category} onChange={e => setFilter('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select className="form-input"
            value={filters.do_not_boil === undefined ? '' : String(filters.do_not_boil)}
            onChange={e => setFilter('do_not_boil', e.target.value === '' ? undefined : e.target.value === 'true')}>
            <option value="">All Actions</option>
            <option value="true">🚫 DO NOT BOIL only</option>
            <option value="false">Others</option>
          </select>
          <select className="form-input" value={filters.page_size}
            onChange={e => setFilter('page_size', Number(e.target.value))}>
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      {data && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
            {data.total.toLocaleString()} results · Page {data.page} of {data.pages}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" disabled={data.page <= 1}
              onClick={() => setFilter('page', filters.page - 1)} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
              ← Prev
            </button>
            <button className="btn-secondary" disabled={data.page >= data.pages}
              onClick={() => setFilter('page', filters.page + 1)} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading...</div>
          ) : (
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>State / District</th>
                  <th>Source</th>
                  <th>Category</th>
                  <th>Action</th>
                  <th>F mg/L</th>
                  <th>As mg/L</th>
                  <th>NO₃ mg/L</th>
                  <th>E.coli</th>
                  <th>DO NOT BOIL</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map(s => {
                  const cat = getCategoryConfig(s.alert_category);
                  const act = getActionConfig(s.action_code);
                  return (
                    <tr key={s.id} onClick={() => navigate(`/sample/${s.id}`)}
                      style={{ cursor: 'pointer' }}>
                      <td style={{ color: '#64748b', fontSize: '0.75rem' }}>{s.id}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.875rem' }}>{s.state_ut}</div>
                        <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{s.district}</div>
                      </td>
                      <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{s.water_source_type || '—'}</td>
                      <td>
                        <span className={cat.badgeClass} style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: 20 }}>
                          {cat.icon} {cat.label}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: act.isDoNotBoil ? '#f87171' : '#94a3b8', fontWeight: act.isDoNotBoil ? 700 : 400 }}>
                        {act.icon} {act.label}
                      </td>
                      <td style={{ color: (s.fluoride_mg_l || 0) > 1.5 ? '#f87171' : '#94a3b8', fontSize: '0.8rem' }}>
                        {s.fluoride_mg_l?.toFixed(3) ?? '—'}
                      </td>
                      <td style={{ color: (s.arsenic_mg_l || 0) > 0.05 ? '#f87171' : '#94a3b8', fontSize: '0.8rem' }}>
                        {s.arsenic_mg_l?.toFixed(4) ?? '—'}
                      </td>
                      <td style={{ color: (s.nitrate_mg_l || 0) > 45 ? '#f87171' : '#94a3b8', fontSize: '0.8rem' }}>
                        {s.nitrate_mg_l?.toFixed(1) ?? '—'}
                      </td>
                      <td style={{ color: (s.e_coli_mpn || 0) > 0 ? '#fb923c' : '#94a3b8', fontSize: '0.8rem' }}>
                        {s.e_coli_mpn?.toFixed(0) ?? '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {s.do_not_boil
                          ? <span style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700 }}>🚫 YES</span>
                          : <span style={{ color: '#475569', fontSize: '0.75rem' }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
