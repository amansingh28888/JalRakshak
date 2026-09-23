import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAlerts } from '../api';
import { getCategoryConfig, getRecommendedActionLabel } from '../utils/display';
import { BellRing, FlaskConical, Bug, Waves, AlertOctagon, Ban, ChevronLeft, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';

const CATEGORY_CHIPS = [
  { value: '',                          label: 'All Problems',       icon: AlertTriangle, color: 'var(--color-text-secondary)' },
  { value: 'CRITICAL_CHEMICAL_TOXIN',   label: 'Chemical',           icon: FlaskConical, color: 'var(--color-danger)' },
  { value: 'UNSAFE_BIOLOGICAL_PATHOGEN',label: 'Biological',         icon: Bug, color: 'var(--color-warning)' },
  { value: 'CRITICAL_MIXED_HAZARD',     label: 'Mixed Hazard',       icon: AlertOctagon, color: '#B91C1C' },
  { value: 'MODERATE_PHYSICAL_PARAM',   label: 'Physical Parameter', icon: Waves, color: '#F59E0B' },
];

export default function AlertCenter() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialCategory = searchParams.get('category') || '';

  const [data, setData]       = useState<{ total: number; items: Record<string, unknown>[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page:           1,
    page_size:      25,
    do_not_boil_only: false,
    critical_only:  false,
    category:       initialCategory,
  });

  useEffect(() => {
    setLoading(true);
    getAlerts(filters).then(setData).finally(() => setLoading(false));
  }, [filters]);

  const activeChip = filters.category;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.75rem', color: 'var(--color-text)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BellRing size={28} color="var(--color-primary)" />
          Alert Center
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          All water quality alerts, categorised by problem type. Click a row to view full sample details.
        </p>
      </div>

      {/* Category Filter Chips */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        {CATEGORY_CHIPS.map(chip => {
          const Icon = chip.icon;
          const isActive = activeChip === chip.value;
          return (
            <button
              key={chip.value}
              onClick={() => setFilters(f => ({ ...f, category: chip.value, page: 1 }))}
              style={{
                padding: '8px 16px',
                borderRadius: 24,
                border: `1px solid ${isActive ? chip.color : 'var(--color-border)'}`,
                background: isActive ? `${chip.color}15` : 'var(--color-bg)',
                color: isActive ? chip.color : 'var(--color-text-secondary)',
                fontSize: '0.85rem',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: isActive ? 'none' : '0 1px 2px rgba(22,50,79,0.05)'
              }}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 2} /> {chip.label}
            </button>
          );
        })}
      </div>

      {/* Secondary filter strip */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 }}>
          <input type="checkbox" checked={filters.critical_only}
            onChange={e => setFilters(f => ({ ...f, critical_only: e.target.checked, page: 1 }))} 
            style={{ width: 16, height: 16, accentColor: 'var(--color-danger)' }}
          />
          <AlertTriangle size={16} color="var(--color-danger)" />
          Critical severity only
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 }}>
          <input type="checkbox" checked={filters.do_not_boil_only}
            onChange={e => setFilters(f => ({ ...f, do_not_boil_only: e.target.checked, page: 1 }))} 
            style={{ width: 16, height: 16, accentColor: 'var(--color-danger)' }}
          />
          <Ban size={16} color="var(--color-danger)" />
          Chemical hazard only (boiling ineffective)
        </label>
        <span style={{ marginLeft: 'auto', color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>
          {data?.total.toLocaleString() ?? '—'} alerts found
        </span>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Loader2 size={32} className="animate-spin" color="var(--color-primary)" />
            <span>Loading alerts...</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Alert ID</th>
                  <th>Location</th>
                  <th>Problem Type</th>
                  <th>Primary Contaminant</th>
                  <th>Severity</th>
                  <th>Required Action</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((alert: Record<string, unknown>) => {
                  const cat        = getCategoryConfig(alert.alert_category as string);
                  const recActions = (alert.recommended_actions as string[]) || [];
                  const avoidActions = (alert.avoid_actions as string[]) || [];
                  const isChemical = avoidActions.includes('DO_NOT_RELY_ON_BOILING');

                  return (
                    <tr
                      key={alert.id as number}
                      onClick={() => navigate(`/citizen/sample/${alert.id}`)}
                      style={{
                        cursor: 'pointer',
                        background: isChemical ? '#FCE8E8' : undefined,
                      }}
                    >
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', fontFamily: 'monospace' }}>#{alert.id as number}</td>

                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.875rem' }}>{alert.state_ut as string}</div>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
                          {alert.district as string}{alert.village ? ` · ${alert.village as string}` : ''}
                        </div>
                      </td>

                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: 'var(--color-bg)',
                          border: `1px solid ${cat.color}40`,
                          color: cat.color,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: 20,
                        }}>
                          {cat.label}
                        </span>
                      </td>

                      <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                        {alert.primary_contaminant as string || '—'}
                      </td>

                      <td>
                        <span style={{
                          fontSize: '0.75rem', fontWeight: 700,
                          color: alert.severity === 'CRITICAL' ? 'var(--color-danger)'
                               : alert.severity === 'HIGH'     ? 'var(--color-warning)'
                                                               : '#F59E0B',
                        }}>
                          {alert.severity as string}
                        </span>
                      </td>

                      <td style={{ fontSize: '0.8rem', maxWidth: 220 }}>
                        {recActions.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {(() => {
                              const first = getRecommendedActionLabel(recActions[0]);
                              return (
                                <span style={{ color: isChemical ? 'var(--color-danger)' : 'var(--color-text)', fontWeight: 500 }}>
                                  {first.label}
                                </span>
                              );
                            })()}
                            {isChemical && (
                              <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Ban size={12} strokeWidth={2.5} /> Boiling is not effective
                              </span>
                            )}
                          </div>
                        ) : '—'}
                      </td>

                      <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                        {alert.water_source_type as string || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && (
          <div style={{ padding: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn-secondary" disabled={filters.page <= 1}
              onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
              <ChevronLeft size={16} /> Prev
            </button>
            <button className="btn-secondary"
              disabled={(filters.page * filters.page_size) >= (data.total || 0)}
              onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
