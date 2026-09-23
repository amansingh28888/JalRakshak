import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSamples, getStates } from '../api';
import type { WaterSample, PaginatedResponse } from '../types';
import { getCategoryConfig, getActionConfig } from '../utils/display';
import { Search, ChevronLeft, ChevronRight, Ban } from 'lucide-react';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'POTABLE_SAFE', label: 'Safe' },
  { value: 'UNSAFE_BIOLOGICAL_PATHOGEN', label: 'Biological' },
  { value: 'CRITICAL_CHEMICAL_TOXIN', label: 'Chemical' },
  { value: 'MODERATE_PHYSICAL_PARAM', label: 'Physical' },
  { value: 'CRITICAL_MIXED_HAZARD', label: 'Mixed' },
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
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.75rem', color: 'var(--color-text)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Search size={28} color="var(--color-primary)" />
          Water Quality Explorer
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          Browse, search, and filter all water quality samples. Click any row for full details.
        </p>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <input className="form-input" placeholder="Search state / district / village..."
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
            <option value="true">DO NOT BOIL only</option>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>
            {data.total.toLocaleString()} results · Page {data.page} of {data.pages}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" disabled={data.page <= 1}
              onClick={() => setFilter('page', filters.page - 1)} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
              <ChevronLeft size={16} /> Prev
            </button>
            <button className="btn-secondary" disabled={data.page >= data.pages}
              onClick={() => setFilter('page', filters.page + 1)} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <Search size={32} className="animate-pulse" color="var(--color-primary)" />
              <span>Loading results...</span>
            </div>
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
                    <tr key={s.id} onClick={() => navigate(`/citizen/sample/${s.id}`)}
                      style={{ cursor: 'pointer' }}>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', fontFamily: 'monospace' }}>{s.id}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.875rem' }}>{s.state_ut}</div>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>{s.district}</div>
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>{s.water_source_type || '—'}</td>
                      <td>
                        <span className={cat.badgeClass} style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: 20 }}>
                          {cat.label}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: act.isDoNotBoil ? 'var(--color-danger)' : 'var(--color-text-secondary)', fontWeight: act.isDoNotBoil ? 600 : 400 }}>
                        {act.label}
                      </td>
                      <td style={{ color: (s.fluoride_mg_l || 0) > 1.5 ? 'var(--color-danger)' : 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: (s.fluoride_mg_l || 0) > 1.5 ? 600 : 400 }}>
                        {s.fluoride_mg_l?.toFixed(3) ?? '—'}
                      </td>
                      <td style={{ color: (s.arsenic_mg_l || 0) > 0.05 ? 'var(--color-danger)' : 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: (s.arsenic_mg_l || 0) > 0.05 ? 600 : 400 }}>
                        {s.arsenic_mg_l?.toFixed(4) ?? '—'}
                      </td>
                      <td style={{ color: (s.nitrate_mg_l || 0) > 45 ? 'var(--color-danger)' : 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: (s.nitrate_mg_l || 0) > 45 ? 600 : 400 }}>
                        {s.nitrate_mg_l?.toFixed(1) ?? '—'}
                      </td>
                      <td style={{ color: (s.e_coli_mpn || 0) > 0 ? 'var(--color-warning)' : 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: (s.e_coli_mpn || 0) > 0 ? 600 : 400 }}>
                        {s.e_coli_mpn?.toFixed(0) ?? '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {s.do_not_boil
                          ? <span style={{ background: '#FCE8E8', color: 'var(--color-danger)', border: '1px solid rgba(214,69,69,0.3)', padding: '4px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Ban size={12} strokeWidth={3} /> YES
                            </span>
                          : <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>—</span>}
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
