import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAlerts } from '../api';
import { getCategoryConfig, getMessageTypeConfig, getRecommendedActionLabel } from '../utils/display';

// Category filter chips
const CATEGORY_CHIPS = [
  { value: '',                          label: 'All Problems',       icon: '⚠️', color: '#94a3b8'  },
  { value: 'CRITICAL_CHEMICAL_TOXIN',   label: 'Chemical',           icon: '⚗️', color: '#ef4444'  },
  { value: 'UNSAFE_BIOLOGICAL_PATHOGEN',label: 'Biological',         icon: '🦠', color: '#f97316'  },
  { value: 'CRITICAL_MIXED_HAZARD',     label: 'Mixed Hazard',       icon: '☣️', color: '#dc2626'  },
  { value: 'MODERATE_PHYSICAL_PARAM',   label: 'Physical Parameter', icon: '🌊', color: '#eab308'  },
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
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Outfit', fontSize: '1.75rem', fontWeight: 800, color: '#e2e8f0', marginBottom: 6 }}>
          🚨 Alert Center
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          All water quality alerts, categorised by problem type. Click a row to view full sample details.
        </p>
      </div>

      {/* Category Filter Chips — primary navigation for problem type */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {CATEGORY_CHIPS.map(chip => (
          <button
            key={chip.value}
            onClick={() => setFilters(f => ({ ...f, category: chip.value, page: 1 }))}
            style={{
              padding: '7px 16px',
              borderRadius: 24,
              border: `1px solid ${activeChip === chip.value ? chip.color : 'rgba(255,255,255,0.1)'}`,
              background: activeChip === chip.value ? `${chip.color}22` : 'rgba(255,255,255,0.04)',
              color: activeChip === chip.value ? chip.color : '#94a3b8',
              fontSize: '0.82rem',
              fontWeight: activeChip === chip.value ? 700 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {chip.icon} {chip.label}
          </button>
        ))}
      </div>

      {/* Secondary filter strip */}
      <div className="glass-card" style={{ padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: '0.875rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={filters.critical_only}
            onChange={e => setFilters(f => ({ ...f, critical_only: e.target.checked, page: 1 }))} />
          🚨 Critical severity only
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: '0.875rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={filters.do_not_boil_only}
            onChange={e => setFilters(f => ({ ...f, do_not_boil_only: e.target.checked, page: 1 }))} />
          🚱 Chemical hazard only (boiling ineffective)
        </label>
        <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: '0.85rem' }}>
          {data?.total.toLocaleString() ?? '—'} alerts
        </span>
      </div>

      {/* Problem type context banner — shows when a category is active */}
      {activeChip && (() => {
        const mtMap: Record<string, string> = {
          CRITICAL_CHEMICAL_TOXIN:    'CHEMICAL_CONTAMINATION',
          UNSAFE_BIOLOGICAL_PATHOGEN: 'BIOLOGICAL_CONTAMINATION',
          CRITICAL_MIXED_HAZARD:      'MIXED_HAZARD',
          MODERATE_PHYSICAL_PARAM:    'PHYSICAL_PARAMETER',
        };
        const mtConfig = getMessageTypeConfig(mtMap[activeChip]);
        return (
          <div style={{
            background: `${mtConfig.bgColor}`,
            border: `1px solid ${mtConfig.borderColor}40`,
            borderRadius: 10,
            padding: '12px 18px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <span style={{ fontSize: '1.5rem' }}>{mtConfig.icon}</span>
            <div>
              <div style={{ fontWeight: 700, color: mtConfig.color, fontSize: '0.9rem' }}>{mtConfig.headline}</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>{mtConfig.actionHeading}</div>
            </div>
          </div>
        );
      })()}

      {/* Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading alerts...</div>
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
                  const msgType    = (alert.message_type as string) || 'CHEMICAL_CONTAMINATION';
                  const mtConfig   = getMessageTypeConfig(msgType);
                  const recActions = (alert.recommended_actions as string[]) || [];
                  const avoidActions = (alert.avoid_actions as string[]) || [];
                  const isChemical = avoidActions.includes('DO_NOT_RELY_ON_BOILING');

                  return (
                    <tr
                      key={alert.id as number}
                      onClick={() => navigate(`/sample/${alert.id}`)}
                      style={{
                        cursor: 'pointer',
                        background: isChemical ? 'rgba(239,68,68,0.04)' : undefined,
                      }}
                    >
                      <td style={{ color: '#64748b', fontSize: '0.75rem' }}>#{alert.id as number}</td>

                      <td>
                        <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.875rem' }}>{alert.state_ut as string}</div>
                        <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                          {alert.district as string}{alert.village ? ` · ${alert.village as string}` : ''}
                        </div>
                      </td>

                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: `${mtConfig.color}22`,
                          border: `1px solid ${mtConfig.color}44`,
                          color: mtConfig.color,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: 20,
                        }}>
                          {cat.icon} {cat.label}
                        </span>
                      </td>

                      <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                        {alert.primary_contaminant as string || '—'}
                      </td>

                      <td>
                        <span style={{
                          fontSize: '0.75rem', fontWeight: 600,
                          color: alert.severity === 'CRITICAL' ? '#f87171'
                               : alert.severity === 'HIGH'     ? '#fb923c'
                                                               : '#fbbf24',
                        }}>
                          {alert.severity as string}
                        </span>
                      </td>

                      <td style={{ fontSize: '0.78rem', maxWidth: 200 }}>
                        {recActions.length > 0 ? (
                          <div>
                            {(() => {
                              const first = getRecommendedActionLabel(recActions[0]);
                              return (
                                <span style={{ color: isChemical ? '#fca5a5' : '#94a3b8' }}>
                                  {first.icon} {first.label}
                                </span>
                              );
                            })()}
                            {isChemical && (
                              <div style={{ color: '#f87171', fontSize: '0.72rem', marginTop: 2 }}>
                                🚱 Boiling is not effective
                              </div>
                            )}
                          </div>
                        ) : '—'}
                      </td>

                      <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
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
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn-secondary" disabled={filters.page <= 1}
              onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
              ← Prev
            </button>
            <button className="btn-secondary"
              disabled={(filters.page * filters.page_size) >= (data.total || 0)}
              onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
