import { useEffect, useState } from 'react';
import { getStandards } from '../api';

export default function Standards() {
  const [standards, setStandards] = useState<Record<string, unknown> | null>(null);

  useEffect(() => { getStandards().then(setStandards); }, []);

  if (!standards) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading standards...</div>;

  const params = standards.parameters as Record<string, Record<string, unknown>>;

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Outfit', fontSize: '1.75rem', fontWeight: 800, color: '#e2e8f0', marginBottom: 6 }}>
          📋 Water Quality Standards Reference
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          All thresholds used by JalRakshak's rule engine. Source: <strong style={{ color: '#60a5fa' }}>IS 10500:2012</strong> — Bureau of Indian Standards, Drinking Water Specification (Second Revision).
        </p>
      </div>

      {/* Reference Note */}
      <div style={{ padding: '14px 20px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, marginBottom: 24, fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6 }}>
        <strong style={{ color: '#60a5fa' }}>IS 10500:2012</strong> distinguishes between "Acceptable" limits (desirable) and "Permissible" limits (allowed in absence of alternate source). Where "No relaxation" is marked, the acceptable limit is also the maximum — no higher value is permitted even when no alternative source exists.
        <br /><br />
        <strong style={{ color: '#f87171' }}>Chemical Hazard parameters (Fluoride, Arsenic, Nitrate) are non-volatile</strong> — boiling concentrates them. These trigger the DO NOT BOIL guardrail regardless of severity level.
      </div>

      {/* Chemical hazard highlight */}
      <div className="dnb-banner" style={{ padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ fontWeight: 700, color: '#f87171', marginBottom: 6 }}>🚫 Anti-Boiling Parameters (IS 10500:2012)</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {Object.entries(params).filter(([, v]) => v.is_chemical_hazard as boolean).map(([k, v]) => (
            <div key={k} style={{ padding: '8px 14px', background: 'rgba(239,68,68,0.15)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)' }}>
              <div style={{ fontWeight: 700, color: '#f87171', fontSize: '0.9rem' }}>{v.name as string}</div>
              <div style={{ fontSize: '0.75rem', color: '#fca5a5' }}>
                Acceptable: {v.acceptable_limit as number} {v.unit as string}
                {' | '}Permissible: {v.permissible_limit as number} {v.unit as string}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Standards Table */}
      <div className="glass-card" style={{ overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Unit</th>
                <th>Acceptable Limit</th>
                <th>Permissible Limit</th>
                <th>No Relaxation</th>
                <th>Hazard Type</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(params).map(([key, param]) => {
                const isChemical = param.is_chemical_hazard as boolean;
                const isBio = param.is_biological_hazard as boolean;
                const isPhys = param.is_physical_param as boolean;
                const hazardLabel = isChemical ? '⚗️ Chemical (DO NOT BOIL)' : isBio ? '🦠 Biological' : isPhys ? '🌊 Physical' : '—';
                const hazardColor = isChemical ? '#f87171' : isBio ? '#fb923c' : '#94a3b8';
                return (
                  <tr key={key} style={{ background: isChemical ? 'rgba(239,68,68,0.03)' : undefined }}>
                    <td style={{ fontWeight: 600, color: '#e2e8f0' }}>{param.name as string}</td>
                    <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{param.unit as string}</td>
                    <td style={{ color: '#10b981', fontWeight: 600 }}>
                      {param.lower_limit !== null ? `${param.lower_limit}–${param.upper_limit}` : (param.acceptable_limit as number)?.toFixed(param.acceptable_limit as number < 1 ? 3 : 0) ?? '—'}
                    </td>
                    <td style={{ color: '#fbbf24' }}>
                      {param.no_relaxation ? <span style={{ color: '#f87171', fontWeight: 600 }}>No relaxation</span> : (param.permissible_limit as number)?.toFixed(param.permissible_limit as number < 1 ? 3 : 0) ?? '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {param.no_relaxation ? <span style={{ color: '#f87171' }}>✓</span> : <span style={{ color: '#475569' }}>—</span>}
                    </td>
                    <td style={{ color: hazardColor, fontWeight: 600, fontSize: '0.8rem' }}>{hazardLabel}</td>
                    <td style={{ color: '#64748b', fontSize: '0.75rem' }}>{param.reference as string}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interpretation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {Object.entries(params).map(([key, param]) => (
          <div key={key} className="glass-card" style={{ padding: 18, borderLeft: `3px solid ${(param.is_chemical_hazard as boolean) ? '#ef4444' : (param.is_biological_hazard as boolean) ? '#f97316' : '#3b82f6'}` }}>
            <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 8, fontFamily: 'Outfit' }}>{param.name as string}</div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: 8 }}>{param.interpretation as string}</div>
            <div style={{ fontSize: '0.8rem', color: '#60a5fa', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8 }}>
              💡 {param.recommended_action as string}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
