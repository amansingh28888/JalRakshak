import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSample, getSampleVerdict } from '../api';
import type { WaterSample, WaterQualityVerdict } from '../types';
import {
  getCategoryConfig, getSeverityConfig, getMessageTypeConfig,
  getRecommendedActionLabel, getAvoidActionLabel, formatValue,
} from '../utils/display';
import { MultilingualAdvisory } from '../components/MultilingualAdvisory';

const PARAM_DISPLAY = [
  { key: 'ph',               label: 'pH',            unit: 'pH units',  acceptable: '6.5–8.5', permissible: 'No relaxation',        chemical: false },
  { key: 'turbidity_ntu',    label: 'Turbidity',     unit: 'NTU',       acceptable: '1.0',     permissible: '5.0',                  chemical: false },
  { key: 'tds_mg_l',         label: 'TDS',           unit: 'mg/L',      acceptable: '500',     permissible: '2000',                 chemical: false },
  { key: 'fluoride_mg_l',    label: 'Fluoride',      unit: 'mg/L',      acceptable: '1.0',     permissible: '1.5',                  chemical: true  },
  { key: 'arsenic_mg_l',     label: 'Arsenic',       unit: 'mg/L',      acceptable: '0.01',    permissible: '0.05',                 chemical: true  },
  { key: 'nitrate_mg_l',     label: 'Nitrate',       unit: 'mg/L',      acceptable: '45',      permissible: '45 (no relaxation)',   chemical: true  },
  { key: 'e_coli_mpn',       label: 'E. coli',       unit: 'MPN/100mL', acceptable: '0',       permissible: '0 (zero tolerance)',   chemical: false },
  { key: 'total_coliform_mpn',label:'Total Coliform', unit: 'MPN/100mL', acceptable: '0',       permissible: '0',                    chemical: false },
];

export default function SampleDetail() {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const [sample,   setSample]   = useState<WaterSample | null>(null);
  const [verdict,  setVerdict]  = useState<WaterQualityVerdict | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const numId = parseInt(id);
    Promise.all([getSample(numId), getSampleVerdict(numId)])
      .then(([s, v]) => {
        setSample(s); setVerdict(v as WaterQualityVerdict);
      })
      .catch(e => setError(e.message));
  }, [id]);

  if (error)                return <div className="glass-card" style={{ padding: 24, color: '#f87171' }}>⚠️ {error}</div>;
  if (!sample || !verdict)  return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading sample...</div>;

  const cat      = getCategoryConfig(verdict.category);
  const sev      = getSeverityConfig(verdict.severity);
  const mtConfig = getMessageTypeConfig(verdict.message_type);

  const hasRecommendedActions = verdict.recommended_actions && verdict.recommended_actions.length > 0;
  const hasAvoidActions       = verdict.avoid_actions && verdict.avoid_actions.length > 0;

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>← Back</button>
        <h1 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 800, color: '#e2e8f0' }}>
          Sample #{sample.id} — {sample.district}, {sample.state_ut}
        </h1>
      </div>

      {/* ── PRIMARY STATUS BANNER — message_type based ──────────────────────── */}
      <div style={{
        background:   mtConfig.bgColor,
        border:       `1px solid ${mtConfig.borderColor}60`,
        borderRadius: 12,
        padding:      '20px 24px',
        marginBottom: 20,
        display:      'flex',
        alignItems:   'center',
        gap:          16,
      }}>
        <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>{mtConfig.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.25rem', color: mtConfig.color }}>
            {mtConfig.headline}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: 4 }}>
            {verdict.safe_to_drink
              ? 'This water is currently within classification thresholds for drinking.'
              : `Primary contaminant: ${verdict.primary_contaminant || 'See parameter table below'}`
            }
          </div>
        </div>
        {/* Safe-to-drink badge */}
        <div style={{
          background:   verdict.safe_to_drink ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
          border:       `1px solid ${verdict.safe_to_drink ? '#10b981' : '#ef4444'}`,
          borderRadius: 8,
          padding:      '8px 16px',
          textAlign:    'center',
          minWidth:     110,
        }}>
          <div style={{ fontSize: '1.4rem' }}>{verdict.safe_to_drink ? '✅' : '🚱'}</div>
          <div style={{
            fontSize:   '0.7rem',
            fontWeight: 700,
            color:      verdict.safe_to_drink ? '#10b981' : '#ef4444',
            marginTop:  4,
          }}>
            {verdict.safe_to_drink ? 'SAFE TO DRINK' : 'NOT SAFE\nTO DRINK'}
          </div>
        </div>
      </div>

      {/* ── WHAT TO DO + WHAT TO AVOID — side by side ───────────────────────── */}
      {(!verdict.safe_to_drink) && (hasRecommendedActions || hasAvoidActions) && (
        <div style={{ display: 'grid', gridTemplateColumns: hasAvoidActions ? '1fr 1fr' : '1fr', gap: 16, marginBottom: 20 }}>

          {/* Recommended Actions */}
          {hasRecommendedActions && (
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 12, color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                ✅ {mtConfig.actionHeading}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {verdict.recommended_actions.map(code => {
                  const { label, icon } = getRecommendedActionLabel(code);
                  return (
                    <div key={code} style={{
                      display:      'flex',
                      alignItems:   'center',
                      gap:          10,
                      padding:      '10px 14px',
                      background:   'rgba(16,185,129,0.08)',
                      border:       '1px solid rgba(16,185,129,0.2)',
                      borderRadius: 8,
                    }}>
                      <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                      <span style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.4 }}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Avoid Actions */}
          {hasAvoidActions && (
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 12, color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                🚫 {mtConfig.avoidHeading || 'Important restriction'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {verdict.avoid_actions.map(code => {
                  const { label, icon } = getAvoidActionLabel(code);
                  return (
                    <div key={code} style={{
                      display:      'flex',
                      alignItems:   'center',
                      gap:          10,
                      padding:      '10px 14px',
                      background:   'rgba(239,68,68,0.1)',
                      border:       '1px solid rgba(239,68,68,0.3)',
                      borderRadius: 8,
                    }}>
                      <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                      <span style={{ fontSize: '0.85rem', color: '#fca5a5', lineHeight: 1.4, fontWeight: 600 }}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Info Row: Location + Classification ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Location */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 14, color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            📍 Location
          </h3>
          {[
            ['State / UT',   sample.state_ut],
            ['District',     sample.district],
            ['Village',      sample.village || '—'],
            ['Source Type',  sample.water_source_type || '—'],
            ['Season',       sample.season_cycle || '—'],
            ['Date',         sample.sample_date || '—'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{k}</span>
              <span style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Classification detail */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 14, color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🧪 Classification Detail
          </h3>
          {/* Category badge */}
          <div style={{ marginBottom: 12 }}>
            <span className={cat.badgeClass} style={{ padding: '6px 14px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 700 }}>
              {cat.icon} {cat.label}
            </span>
          </div>
          {/* Severity */}
          <div style={{ marginBottom: 12 }}>
            <span style={{ background: sev.bgColor, color: sev.color, padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600 }}>
              Severity: {sev.label}
            </span>
          </div>
          {/* Primary contaminant */}
          {verdict.primary_contaminant && (
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 10 }}>
              Primary Contaminant: <strong style={{ color: '#e2e8f0' }}>{verdict.primary_contaminant}</strong>
            </div>
          )}
          {/* Why this classification */}
          <div style={{ marginTop: 10, padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: 6 }}>WHY THIS CLASSIFICATION:</div>
            {verdict.reasons.map((r, i) => (
              <div key={i} style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: 4 }}>• {r}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Parameter Table ──────────────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 16, color: '#e2e8f0' }}>
          📊 Measured Parameters vs. IS 10500:2012 Standards
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Measured Value</th>
                <th>Unit</th>
                <th>Acceptable Limit</th>
                <th>Permissible Limit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {PARAM_DISPLAY.map(p => {
                const val     = (sample as unknown as Record<string, number | undefined>)[p.key];
                const pResult = verdict.parameter_results.find(r => r.field_name === p.key);
                const status  = pResult?.status || 'NO_DATA';
                const statusColor = status === 'OK' ? '#10b981' : status === 'ACCEPTABLE_EXCEEDED' ? '#eab308' : status === 'PERMISSIBLE_EXCEEDED' ? '#ef4444' : '#475569';
                const statusLabel = { OK: '✅ OK', ACCEPTABLE_EXCEEDED: '⚠️ Elevated', PERMISSIBLE_EXCEEDED: '🚨 Exceeded', NO_DATA: '— No Data' }[status] || status;
                return (
                  <tr key={p.key} style={{ background: status === 'PERMISSIBLE_EXCEEDED' ? 'rgba(239,68,68,0.04)' : undefined }}>
                    <td style={{ fontWeight: 600, color: p.chemical ? '#fca5a5' : '#e2e8f0', fontSize: '0.85rem' }}>
                      {p.chemical && <span style={{ color: '#ef4444', marginRight: 4 }}>⚗️</span>}{p.label}
                    </td>
                    <td style={{ fontWeight: 700, color: statusColor, fontSize: '0.9rem' }}>
                      {val !== undefined && val !== null ? formatValue(val, p.key === 'arsenic_mg_l' ? 4 : 2) : '—'}
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{p.unit}</td>
                    <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{p.acceptable}</td>
                    <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{p.permissible}</td>
                    <td><span style={{ color: statusColor, fontWeight: 600, fontSize: '0.8rem' }}>{statusLabel}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── AI Language Advisory ──────────────────────────────────────────────── */}
      <MultilingualAdvisory sample={sample} verdict={verdict} />
    </div>
  );
}
