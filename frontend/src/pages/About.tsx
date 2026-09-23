import { 
  Droplets, Bot, Target, Globe, 
  Settings, Ban, Map, Smartphone, 
  Volume2, LayoutDashboard, Database, TestTube, FileText, Lock
} from 'lucide-react';

export default function About() {
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--color-primary-very-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
            <Droplets size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1 }}>JalRakshak</h1>
            <div style={{ color: 'var(--color-primary)', fontSize: '1rem', marginTop: 8, fontWeight: 500 }}>Water Guardian</div>
          </div>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', lineHeight: 1.7, maxWidth: 700 }}>
          Professional Water Quality Monitoring & Vernacular Alert System for rural India.
          Built for a public-health engineering initiative, demonstrating explainable AI safety and vernacular communication.
        </p>
      </div>

      {/* Core Principle */}
      <div style={{ padding: '32px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 16, marginBottom: 32, boxShadow: '0 4px 12px rgba(22, 50, 79, 0.05)' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--color-text)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lock size={20} color="var(--color-primary)" />
          Core Safety Principle
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          <div style={{ padding: 24, background: '#FCE8E8', border: '1px solid rgba(214,69,69,0.3)', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <Settings size={36} color="var(--color-danger)" />
            </div>
            <div style={{ fontWeight: 800, color: 'var(--color-danger)', fontSize: '1.1rem' }}>DETERMINISTIC RULE ENGINE</div>
            <div style={{ color: 'var(--color-danger)', fontSize: '0.9rem', marginTop: 4, fontWeight: 600 }}>SAFETY AUTHORITY</div>
            <div style={{ color: '#9C3535', fontSize: '0.85rem', marginTop: 12 }}>IS 10500:2012 · Deterministic · Auditable · Tested</div>
          </div>
          <div style={{ padding: 24, background: '#E6F6EF', border: '1px solid rgba(22,138,91,0.3)', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <Bot size={36} color="var(--color-safe)" />
            </div>
            <div style={{ fontWeight: 800, color: 'var(--color-safe)', fontSize: '1.1rem' }}>GEMINI AI</div>
            <div style={{ color: 'var(--color-safe)', fontSize: '0.9rem', marginTop: 4, fontWeight: 600 }}>LANGUAGE LAYER ONLY</div>
            <div style={{ color: '#107B53', fontSize: '0.85rem', marginTop: 12 }}>Hindi translation · Never overrides verdict · Validated output</div>
          </div>
        </div>
      </div>

      {/* Problem Statement */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24, marginBottom: 32 }}>
        <div className="card" style={{ padding: 32 }}>
          <h3 style={{ fontWeight: 700, color: 'var(--color-text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={20} color="var(--color-primary)" />
            Problem Being Solved
          </h3>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: 1.7 }}>
            A citizen receives a water quality test result showing "Fluoride: 2.45 mg/L" and intuitively boils the water.
            <br /><br />
            <strong style={{ color: 'var(--color-danger)' }}>This is deadly wrong.</strong>
            <br /><br />
            Boiling concentrates fluoride (and arsenic, nitrate) — it does NOT remove them. Chemical contamination requires an alternative source, not heat treatment.
            <br /><br />
            JalRakshak explicitly communicates this distinction in plain Hindi with a prominent DO NOT BOIL guardrail.
          </div>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <h3 style={{ fontWeight: 700, color: 'var(--color-text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={20} color="var(--color-primary)" />
            Scale & Impact
          </h3>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: 1.7 }}>
            India faces significant groundwater contamination challenges:
            <ul style={{ paddingLeft: 24, marginTop: 12, lineHeight: 2 }}>
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
      <div className="card" style={{ padding: 32, marginBottom: 48 }}>
        <h3 style={{ fontWeight: 700, color: 'var(--color-text)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Settings size={20} color="var(--color-primary)" />
          Key Features
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {[
            { icon: Settings, feature: 'Deterministic Rule Engine', desc: 'IS 10500:2012 compliant classifier' },
            { icon: Ban, feature: 'Anti-Boiling Guardrail', desc: 'Chemical toxins never recommend boiling' },
            { icon: Bot, feature: 'Gemini Hindi Advisory', desc: 'Rural-friendly vernacular language generation' },
            { icon: Map, feature: 'Interactive Risk Map', desc: 'Color-coded mapping across India' },
            { icon: Smartphone, feature: 'WhatsApp Preview', desc: 'Citizen-ready Hindi message format' },
            { icon: Volume2, feature: 'Audio TTS Demo', desc: 'Hindi audio via browser TTS adapter' },
            { icon: LayoutDashboard, feature: 'Live Dashboard', desc: 'All metrics from real database queries' },
            { icon: Database, feature: 'CSV Pipeline', desc: 'Validated import with audit logging' },
            { icon: TestTube, feature: 'Automated Tests', desc: 'Anti-boiling invariant tested explicitly' },
            { icon: FileText, feature: 'Standards Page', desc: 'Full IS 10500:2012 reference table' },
          ].map((f, idx) => {
            const Icon = f.icon;
            return (
              <div key={idx} style={{ display: 'flex', gap: 12, padding: '16px', background: 'var(--color-bg-soft)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                <div style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: 2 }}>
                  <Icon size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.9rem' }}>{f.feature}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>{f.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
