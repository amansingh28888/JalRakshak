export default function Methodology() {
  const steps = [
    {
      icon: '📥', title: '1. Data Ingestion',
      desc: 'CSV dataset loaded via preprocessing pipeline or CSV upload API. Supports the 50,000-sample India Water Quality Dataset and synthetic demo data.',
      detail: 'Column mapper normalizes 50+ CSV column name variants to canonical schema.'
    },
    {
      icon: '🔧', title: '2. Data Preprocessing',
      desc: 'Validates schema, converts numeric types, handles missing values, detects duplicates, validates suspicious ranges.',
      detail: 'Every row is logged as: accepted | transformed | rejected | duplicate | missing_critical.'
    },
    {
      icon: '📏', title: '3. Standardization',
      desc: 'State/UT and District names normalized to canonical forms. All units standardized (mg/L, NTU, MPN/100mL).',
      detail: '36 State/UT name variants mapped to official names. District names title-cased.'
    },
    {
      icon: '⚙️', title: '4. Deterministic Rule Engine',
      desc: 'The SOLE safety authority. Evaluates every sample against IS 10500:2012 parameters.',
      detail: '5 branches: Safe → Biological → Chemical → Physical → Mixed. Anti-boiling invariant enforced.',
      highlight: true,
    },
    {
      icon: '🤖', title: '5. AI Vernacular Transformation',
      desc: 'Gemini receives ONLY the pre-computed verdict. Generates Hindi text — never safety decisions.',
      detail: 'Backend validates AI response. If Gemini contradicts do_not_boil, response is rejected and fallback used.',
      aiLayer: true,
    },
    {
      icon: '🚨', title: '6. Alert Generation',
      desc: 'Action codes assigned: SAFE_TO_DRINK | BOIL_OR_CHLORINATE | DO_NOT_BOIL | FILTER_RETEST | MIXED_CHEMICAL_PRIORITY',
      detail: 'Chemical priority overrides biological treatment advice in all mixed-hazard cases.'
    },
    {
      icon: '🗺️', title: '7. Spatial Visualization',
      desc: 'Leaflet markers color-coded by risk. Samples without GPS use district/state centroid coordinates.',
      detail: 'Approximate locations clearly labeled. GPS coordinates used when available.'
    },
    {
      icon: '📱', title: '8. Public Health Action Pathway',
      desc: 'Action cascades from rule engine to: Dashboard KPI → Alert Center → WhatsApp preview → Hindi audio.',
      detail: 'Citizen-facing message prioritizes action over technical jargon.'
    },
  ];

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Outfit', fontSize: '1.75rem', fontWeight: 800, color: '#e2e8f0', marginBottom: 6 }}>
          📐 Methodology & System Architecture
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          End-to-end technical architecture of JalRakshak — from raw data to public health action.
        </p>
      </div>

      {/* Architecture Diagram */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, color: '#e2e8f0', marginBottom: 20, textAlign: 'center' }}>
          System Architecture
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap', fontSize: '0.85rem' }}>
          {[
            { label: 'Raw CSV Data', color: '#64748b', icon: '📄' },
            { label: '→', arrow: true },
            { label: 'Validation', color: '#60a5fa', icon: '✅' },
            { label: '→', arrow: true },
            { label: 'Rule Engine', color: '#ef4444', icon: '⚙️', highlight: true },
            { label: '→', arrow: true },
            { label: 'Safety Verdict', color: '#ef4444', icon: '🛡️', highlight: true },
            { label: '→', arrow: true },
            { label: 'Action Code', color: '#ef4444', icon: '🏷️', highlight: true },
            { label: '→', arrow: true },
            { label: 'Gemini (Hindi)', color: '#14b8a6', icon: '🤖', aiLayer: true },
            { label: '→', arrow: true },
            { label: 'Dashboard / WhatsApp / Audio', color: '#10b981', icon: '📊' },
          ].map((item, i) => (
            item.arrow
              ? <span key={i} style={{ color: '#475569', fontSize: '1rem' }}>→</span>
              : (
                <div key={i} style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: `2px solid ${item.highlight ? 'rgba(239,68,68,0.5)' : item.aiLayer ? 'rgba(20,184,166,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  background: item.highlight ? 'rgba(239,68,68,0.1)' : item.aiLayer ? 'rgba(20,184,166,0.1)' : 'rgba(255,255,255,0.03)',
                  color: item.color,
                  fontWeight: item.highlight ? 700 : 500,
                  textAlign: 'center',
                  fontSize: '0.8rem',
                }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{item.icon}</div>
                  {item.label}
                </div>
              )
          ))}
        </div>

        {/* Trust Boundary */}
        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ padding: '16px', background: 'rgba(239,68,68,0.08)', border: '2px solid rgba(239,68,68,0.3)', borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>⚙️</div>
            <div style={{ fontFamily: 'Outfit', fontWeight: 800, color: '#f87171', marginBottom: 4 }}>RULE ENGINE</div>
            <div style={{ fontSize: '0.8rem', color: '#fca5a5' }}>= SAFETY DECISION AUTHORITY</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 6 }}>IS 10500:2012 thresholds · Deterministic · Testable · Auditable</div>
          </div>
          <div style={{ padding: '16px', background: 'rgba(20,184,166,0.08)', border: '2px solid rgba(20,184,166,0.3)', borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>🤖</div>
            <div style={{ fontFamily: 'Outfit', fontWeight: 800, color: '#2dd4bf', marginBottom: 4 }}>GEMINI AI</div>
            <div style={{ fontSize: '0.8rem', color: '#5eead4' }}>= LANGUAGE GENERATION ONLY</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 6 }}>Hindi translation · Never overrides verdict · Validated output · Fallback if unavailable</div>
          </div>
        </div>
      </div>

      {/* Pipeline Steps */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {steps.map((step, i) => (
          <div key={i} className="glass-card" style={{
            padding: 20,
            borderLeft: step.highlight ? '3px solid #ef4444' : step.aiLayer ? '3px solid #14b8a6' : '3px solid rgba(59,130,246,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
              <span style={{ fontSize: '1.5rem' }}>{step.icon}</span>
              <div>
                <div style={{ fontFamily: 'Outfit', fontWeight: 700, color: step.highlight ? '#f87171' : step.aiLayer ? '#2dd4bf' : '#e2e8f0', fontSize: '1rem' }}>
                  {step.title}
                </div>
                {step.highlight && <div style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 600 }}>SAFETY AUTHORITY</div>}
                {step.aiLayer && <div style={{ fontSize: '0.7rem', color: '#14b8a6', fontWeight: 600 }}>LANGUAGE LAYER ONLY</div>}
              </div>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 8 }}>{step.desc}</p>
            <p style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: 1.5 }}>{step.detail}</p>
          </div>
        ))}
      </div>

      {/* Tech stack */}
      <div className="glass-card" style={{ padding: 24, marginTop: 20 }}>
        <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, color: '#e2e8f0', marginBottom: 16 }}>Technology Stack</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { layer: 'Backend', tech: 'FastAPI + Python', icon: '🐍' },
            { layer: 'Database', tech: 'SQLite + SQLAlchemy', icon: '🗃️' },
            { layer: 'AI SDK', tech: 'google-genai (Gemini 2.5 Flash)', icon: '🤖' },
            { layer: 'Frontend', tech: 'React + Vite + TypeScript', icon: '⚛️' },
            { layer: 'Styling', tech: 'Tailwind CSS v4', icon: '🎨' },
            { layer: 'Maps', tech: 'React Leaflet', icon: '🗺️' },
            { layer: 'Charts', tech: 'Recharts', icon: '📊' },
            { layer: 'Standards', tech: 'IS 10500:2012 (BIS)', icon: '📋' },
          ].map(t => (
            <div key={t.layer} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: '1.2rem' }}>{t.icon}</span>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>{t.layer}</div>
                <div style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 500 }}>{t.tech}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
