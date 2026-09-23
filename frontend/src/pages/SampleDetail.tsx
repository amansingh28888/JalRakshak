import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSample, getSampleVerdict } from '../api';
import type { WaterSample, WaterQualityVerdict } from '../types';
import {
  getCategoryConfig, getSeverityConfig, getMessageTypeConfig,
  getRecommendedActionLabel, getAvoidActionLabel, formatValue,
} from '../utils/display';
import { MultilingualAdvisory } from '../components/MultilingualAdvisory';
import { ArrowLeft, MapPin, FlaskConical, AlertTriangle, ShieldCheck, Ban, CheckCircle2, AlertOctagon, Info, BarChart3, TestTube2 } from 'lucide-react';

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

  if (error)                return <div className="card" style={{ padding: 24, color: 'var(--color-danger)' }}>⚠️ {error}</div>;
  if (!sample || !verdict)  return <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading sample...</div>;

  const cat      = getCategoryConfig(verdict.category);
  const sev      = getSeverityConfig(verdict.severity);
  const mtConfig = getMessageTypeConfig(verdict.message_type);

  const hasRecommendedActions = verdict.recommended_actions && verdict.recommended_actions.length > 0;
  const hasAvoidActions       = verdict.avoid_actions && verdict.avoid_actions.length > 0;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => navigate(-1)} className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
          Sample #{sample.id} — {sample.district}, {sample.state_ut}
        </h1>
      </div>

      {/* ── PRIMARY STATUS BANNER ──────────────────────── */}
      <div style={{
        background:   mtConfig.bgColor === 'rgba(16,185,129,0.1)' ? '#E6F6EF' : 
                      mtConfig.bgColor === 'rgba(239,68,68,0.1)' ? '#FCE8E8' : 
                      mtConfig.bgColor === 'rgba(249,115,22,0.1)' ? '#FDF3E1' : 
                      mtConfig.bgColor === 'rgba(234,179,8,0.1)' ? '#FDF3E1' : '#F7FAFC',
        border:       `1px solid ${mtConfig.color}40`,
        borderRadius: 12,
        padding:      '24px 32px',
        marginBottom: 24,
        display:      'flex',
        alignItems:   'center',
        gap:          24,
      }}>
        <div style={{ color: mtConfig.color, background: 'var(--color-bg)', padding: 16, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          {verdict.safe_to_drink ? <ShieldCheck size={36} /> : <AlertTriangle size={36} />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '1.3rem', color: mtConfig.color, marginBottom: 6 }}>
            {mtConfig.headline}
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            {verdict.safe_to_drink
              ? 'This water is currently within classification thresholds for drinking.'
              : `Primary contaminant: ${verdict.primary_contaminant || 'See parameter table below'}`
            }
          </div>
        </div>
        {/* Safe-to-drink badge */}
        <div style={{
          background:   verdict.safe_to_drink ? 'var(--color-bg)' : 'var(--color-bg)',
          border:       `1px solid ${verdict.safe_to_drink ? 'var(--color-safe)' : 'var(--color-danger)'}`,
          borderRadius: 8,
          padding:      '12px 24px',
          textAlign:    'center',
          minWidth:     140,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <div style={{ color: verdict.safe_to_drink ? 'var(--color-safe)' : 'var(--color-danger)', marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
            {verdict.safe_to_drink ? <CheckCircle2 size={32} /> : <Ban size={32} />}
          </div>
          <div style={{
            fontSize:   '0.75rem',
            fontWeight: 700,
            color:      verdict.safe_to_drink ? 'var(--color-safe)' : 'var(--color-danger)',
          }}>
            {verdict.safe_to_drink ? 'SAFE TO DRINK' : 'NOT SAFE TO DRINK'}
          </div>
        </div>
      </div>

      {/* ── WHAT TO DO + WHAT TO AVOID — side by side ───────────────────────── */}
      {(!verdict.safe_to_drink) && (hasRecommendedActions || hasAvoidActions) && (
        <div style={{ display: 'grid', gridTemplateColumns: hasAvoidActions ? '1fr 1fr' : '1fr', gap: 24, marginBottom: 24 }}>

          {/* Recommended Actions */}
          {hasRecommendedActions && (
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16, color: 'var(--color-safe)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} /> {mtConfig.actionHeading}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {verdict.recommended_actions.map(code => {
                  const { label } = getRecommendedActionLabel(code);
                  return (
                    <div key={code} style={{
                      display:      'flex',
                      alignItems:   'center',
                      gap:          12,
                      padding:      '12px 16px',
                      background:   '#E6F6EF',
                      border:       '1px solid rgba(22,138,91,0.2)',
                      borderRadius: 8,
                    }}>
                      <Info size={18} color="var(--color-safe)" />
                      <span style={{ fontSize: '0.9rem', color: 'var(--color-text)', fontWeight: 500 }}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Avoid Actions */}
          {hasAvoidActions && (
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16, color: 'var(--color-danger)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Ban size={16} /> {mtConfig.avoidHeading || 'Important restriction'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {verdict.avoid_actions.map(code => {
                  const { label } = getAvoidActionLabel(code);
                  return (
                    <div key={code} style={{
                      display:      'flex',
                      alignItems:   'center',
                      gap:          12,
                      padding:      '12px 16px',
                      background:   '#FCE8E8',
                      border:       '1px solid rgba(214,69,69,0.3)',
                      borderRadius: 8,
                    }}>
                      <AlertOctagon size={18} color="var(--color-danger)" />
                      <span style={{ fontSize: '0.9rem', color: 'var(--color-danger)', fontWeight: 600 }}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Info Row: Location + Classification ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>

        {/* Location */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16, color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={16} /> Location Details
          </h3>
          {[
            ['State / UT',   sample.state_ut],
            ['District',     sample.district],
            ['Village',      sample.village || '—'],
            ['Source Type',  sample.water_source_type || '—'],
            ['Season',       sample.season_cycle || '—'],
            ['Date',         sample.sample_date || '—'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>{k}</span>
              <span style={{ color: 'var(--color-text)', fontSize: '0.9rem', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Classification detail */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16, color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <TestTube2 size={16} /> Classification Detail
          </h3>
          {/* Category badge */}
          <div style={{ marginBottom: 16 }}>
            <span style={{ padding: '6px 14px', borderRadius: 6, fontSize: '0.85rem', fontWeight: 600, background: 'var(--color-bg-soft)', border: `1px solid ${cat.color}40`, color: cat.color }}>
              {cat.label}
            </span>
          </div>
          {/* Severity */}
          <div style={{ marginBottom: 16 }}>
            <span style={{ background: sev.bgColor === 'rgba(239,68,68,0.2)' ? '#FCE8E8' : sev.bgColor === 'rgba(249,115,22,0.2)' ? '#FDF3E1' : sev.bgColor === 'rgba(234,179,8,0.2)' ? '#FDF3E1' : '#E6F6EF', color: sev.color, padding: '4px 12px', borderRadius: 6, fontSize: '0.85rem', fontWeight: 600, border: `1px solid ${sev.color}40` }}>
              Severity: {sev.label}
            </span>
          </div>
          {/* Primary contaminant */}
          {verdict.primary_contaminant && (
            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: 12 }}>
              Primary Contaminant: <strong style={{ color: 'var(--color-text)' }}>{verdict.primary_contaminant}</strong>
            </div>
          )}
          {/* Why this classification */}
          <div style={{ marginTop: 12, padding: 16, background: 'var(--color-bg-soft)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 700, marginBottom: 8 }}>WHY THIS CLASSIFICATION:</div>
            {verdict.reasons.map((r, i) => (
              <div key={i} style={{ fontSize: '0.85rem', color: 'var(--color-text)', lineHeight: 1.5, marginBottom: 4 }}>• {r}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Parameter Table ──────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 32, marginBottom: 24 }}>
        <h3 style={{ fontWeight: 600, marginBottom: 24, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart3 size={20} color="var(--color-primary)" />
          Measured Parameters vs. IS 10500:2012 Standards
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
                const statusColor = status === 'OK' ? 'var(--color-safe)' : status === 'ACCEPTABLE_EXCEEDED' ? '#F59E0B' : status === 'PERMISSIBLE_EXCEEDED' ? 'var(--color-danger)' : 'var(--color-text-secondary)';
                
                let StatusIcon = null;
                if (status === 'OK') StatusIcon = <CheckCircle2 size={14} />;
                if (status === 'ACCEPTABLE_EXCEEDED') StatusIcon = <AlertTriangle size={14} />;
                if (status === 'PERMISSIBLE_EXCEEDED') StatusIcon = <AlertOctagon size={14} />;

                const statusLabel = { OK: 'OK', ACCEPTABLE_EXCEEDED: 'Elevated', PERMISSIBLE_EXCEEDED: 'Exceeded', NO_DATA: 'No Data' }[status] || status;
                
                return (
                  <tr key={p.key} style={{ background: status === 'PERMISSIBLE_EXCEEDED' ? '#FCE8E8' : undefined }}>
                    <td style={{ fontWeight: 600, color: p.chemical ? 'var(--color-text)' : 'var(--color-text)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {p.chemical && <FlaskConical size={14} color="var(--color-danger)" />}{p.label}
                    </td>
                    <td style={{ fontWeight: 700, color: statusColor, fontSize: '0.95rem' }}>
                      {val !== undefined && val !== null ? formatValue(val, p.key === 'arsenic_mg_l' ? 4 : 2) : '—'}
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>{p.unit}</td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>{p.acceptable}</td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>{p.permissible}</td>
                    <td>
                      <span style={{ color: statusColor, fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {StatusIcon} {statusLabel}
                      </span>
                    </td>
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
