export default function About() {
  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #2563eb, #14b8a6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>💧</div>
          <div>
            <h1 style={{ fontFamily: 'Outfit', fontSize: '2rem', fontWeight: 800, color: '#e2e8f0', lineHeight: 1 }}>JalRakshak</h1>
            <div style={{ color: '#14b8a6', fontSize: '1rem', marginTop: 4 }}>जल रक्षक — Water Guardian</div>
          </div>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: 1.7, maxWidth: 700 }}>
          AI-Based Water Quality Monitoring & Vernacular Alert System for rural India.
          Built for a university project expo demonstrating public-health engineering, explainable AI safety, and vernacular communication.
        </p>
      </div>

      {/* Core Principle */}
      <div style={{ padding: '28px 32px', background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(20,184,166,0.1))', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 16, marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.3rem', color: '#e2e8f0', marginBottom: 12 }}>
          🔐 Core Safety Principle
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ padding: 20, background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>⚙️</div>
            <div style={{ fontFamily: 'Outfit', fontWeight: 800, color: '#f87171', fontSize: '1.1rem' }}>DETERMINISTIC RULE ENGINE</div>
            <div style={{ color: '#fca5a5', fontSize: '0.9rem', marginTop: 4 }}>= SAFETY AUTHORITY</div>
            <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 8 }}>IS 10500:2012 · Deterministic · Auditable · Tested</div>
          </div>
          <div style={{ padding: 20, background: 'rgba(20,184,166,0.1)', border: '2px solid rgba(20,184,166,0.3)', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🤖</div>
            <div style={{ fontFamily: 'Outfit', fontWeight: 800, color: '#2dd4bf', fontSize: '1.1rem' }}>GEMINI AI</div>
            <div style={{ color: '#5eead4', fontSize: '0.9rem', marginTop: 4 }}>= LANGUAGE LAYER ONLY</div>
            <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 8 }}>Hindi translation · Never overrides verdict · Validated output</div>
          </div>
        </div>
      </div>

      {/* Problem Statement */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>🎯 Problem Being Solved</h3>
          <div style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.7 }}>
            A citizen receives a water quality test result showing "Fluoride: 2.45 mg/L" and intuitively boils the water.
            <br /><br />
            <strong style={{ color: '#f87171' }}>This is deadly wrong.</strong>
            <br /><br />
            Boiling concentrates fluoride (and arsenic, nitrate) — it does NOT remove them. Chemical contamination requires an alternative source, not heat treatment.
            <br /><br />
            JalRakshak explicitly communicates this distinction in plain Hindi with a prominent DO NOT BOIL guardrail.
          </div>
        </div>

        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>🌍 Scale & Impact</h3>
          <div style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.7 }}>
            India faces significant groundwater contamination challenges:
            <ul style={{ paddingLeft: 18, marginTop: 8, lineHeight: 2 }}>
              <li>~6 crore people exposed to excess fluoride</li>
              <li>~1.5 crore people in arsenic-affected areas</li>
              <li>~3 crore people drink E. coli contaminated water</li>
              <li>531+ districts monitored in this dataset</li>
              <li>36 States/UTs covered</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, color: '#e2e8f0', marginBottom: 16 }}>✨ Key Features</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {[
            { icon: '⚙️', feature: 'Deterministic Rule Engine', desc: '5-branch IS 10500:2012 compliant classifier' },
            { icon: '🚫', feature: 'Anti-Boiling Guardrail', desc: 'Chemical toxins never recommend boiling' },
            { icon: '🤖', feature: 'Gemini Hindi Advisory', desc: 'Rural-friendly vernacular language generation' },
            { icon: '🗺️', feature: 'Interactive Risk Map', desc: 'Color-coded Leaflet markers across India' },
            { icon: '📱', feature: 'WhatsApp Preview', desc: 'Citizen-ready Hindi message format' },
            { icon: '🔊', feature: 'Audio TTS Demo', desc: 'Hindi audio via browser TTS adapter' },
            { icon: '📊', feature: 'Live Dashboard', desc: 'All metrics from real database queries' },
            { icon: '📁', feature: 'CSV Pipeline', desc: 'Validated import with audit logging' },
            { icon: '🧪', feature: 'Automated Tests', desc: 'Anti-boiling invariant tested explicitly' },
            { icon: '📋', feature: 'Standards Page', desc: 'Full IS 10500:2012 reference table' },
          ].map(f => (
            <div key={f.feature} style={{ display: 'flex', gap: 10, padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
              <span style={{ fontSize: '1.3rem' }}>{f.icon}</span>
              <div>
                <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.875rem' }}>{f.feature}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
