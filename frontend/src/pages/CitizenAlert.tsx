import { useState } from 'react';
import { getDemoScenario, getAdvisory } from '../api';
import { LanguageSelector } from '../components/LanguageSelector';
import type { DemoScenario, AdvisoryResponse, WaterQualityVerdict } from '../types';
import { getCategoryConfig, getMessageTypeConfig, getRecommendedActionLabel, getAvoidActionLabel } from '../utils/display';

const SCENARIOS = [
  { key: 'safe',       label: 'Safe Water',              icon: '✅', color: '#10b981', description: 'All parameters within limits — water is safe to drink.' },
  { key: 'biological', label: 'Biological Contamination', icon: '🦠', color: '#f97316', description: 'E. coli detected. Disinfection required before drinking.' },
  { key: 'chemical',   label: 'Chemical Contamination',  icon: '⚗️', color: '#ef4444', description: 'Fluoride/Arsenic exceeds limit. Boiling is NOT effective — use appropriate treatment or alternative source.' },
  { key: 'mixed',      label: 'Mixed Hazard',             icon: '☣️', color: '#dc2626', description: 'Chemical + biological. Chemical takes priority. Boiling is NOT sufficient.' },
  { key: 'physical',   label: 'Physical Parameter',       icon: '🌊', color: '#eab308', description: 'Turbidity or TDS exceeds threshold. Filter and retest.' },
];

function WhatsAppPreview({ scenario, advisory }: { scenario: DemoScenario; advisory: AdvisoryResponse | null }) {
  const cat      = getCategoryConfig(scenario.verdict.category);
  const verdict  = scenario.verdict as WaterQualityVerdict;
  const mtConfig = getMessageTypeConfig(verdict.message_type);
  const isRtl    = advisory ? ['ur', 'ar'].includes(advisory.language_code) : false;

  const speakAdvisory = () => {
    if (!advisory || !('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(
      `${advisory.warning_title}. ${advisory.warning}. ${advisory.caution}. ${advisory.solution}`
    );
    // Best effort mapping, e.g. hi-IN, en-IN
    utterance.lang = advisory.language_code === 'en' ? 'en-IN' : `${advisory.language_code}-IN`;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="whatsapp-preview" style={{ maxWidth: 360 }}>
      {/* WA Header */}
      <div className="whatsapp-header">
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#128c7e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>💧</div>
        <div>
          <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>JalRakshak Alert</div>
          <div style={{ color: '#25d366', fontSize: '0.7rem' }}>{advisory ? advisory.target_language : 'Water Quality'} Alert</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ padding: '12px 8px', minHeight: 200, background: '#0d1117' }}>
        <div className="whatsapp-bubble" dir={isRtl ? 'rtl' : 'ltr'}>
          <div style={{ fontSize: '0.75rem', color: '#8696a0', marginBottom: 6 }} dir="ltr">
            📍 {scenario.sample.district as string}, {scenario.sample.state_ut as string}
          </div>
          {Boolean(scenario.sample.village) && (
            <div style={{ fontSize: '0.75rem', color: '#8696a0', marginBottom: 8 }} dir="ltr">
              🏘️ Village: {String(scenario.sample.village)}
            </div>
          )}

          {/* Status card — uses message_type, not just do_not_boil */}
          <div style={{
            background:   `${mtConfig.color}22`,
            border:       `1px solid ${mtConfig.color}44`,
            borderRadius: 6,
            padding:      '8px 10px',
            marginBottom: 10,
          }} dir="ltr">
            <div style={{ fontWeight: 700, color: mtConfig.color, fontSize: '0.9rem', marginBottom: 2 }}>
              {mtConfig.icon} {mtConfig.label}
            </div>
            <div style={{ fontSize: '0.75rem', color: cat.color }}>
              {cat.label}
              {verdict.safe_to_drink ? ' — ✅ Safe to drink' : ' — 🚱 Not safe without treatment'}
            </div>
          </div>

          {advisory ? (
            <>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e9edef', marginBottom: 6 }}>
                {advisory.warning_title}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#e9edef', lineHeight: 1.5, marginBottom: 8 }}>
                {advisory.warning}
              </div>
              <div style={{
                background:   verdict.do_not_boil ? 'rgba(239,68,68,0.15)' : 'rgba(249,115,22,0.12)',
                border:       `1px solid ${verdict.do_not_boil ? 'rgba(239,68,68,0.3)' : 'rgba(249,115,22,0.2)'}`,
                borderRadius: 6,
                padding:      '8px 10px',
                marginBottom: 8,
              }}>
                <div style={{ fontWeight: 700, color: verdict.do_not_boil ? '#f87171' : '#fdba74', fontSize: '0.85rem' }}>
                  {verdict.do_not_boil ? '🚱 ' : '⚠️ '}{advisory.caution}
                </div>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#8696a0', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8 }}>
                💧 {advisory.solution}
              </div>
            </>
          ) : (
            <div style={{ color: '#8696a0', fontSize: '0.85rem', fontStyle: 'italic' }}>
              Generate advisory to see the message...
            </div>
          )}

          <div style={{ fontSize: '0.65rem', color: '#8696a0', textAlign: isRtl ? 'left' : 'right', marginTop: 8 }} dir="ltr">
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} ✓✓
          </div>
        </div>
      </div>

      {/* Audio Demo */}
      {advisory && 'speechSynthesis' in window && (
        <div style={{ padding: '8px 12px', background: '#1f2c34', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={speakAdvisory}
            style={{ width: '100%', background: '#25d366', color: 'white', border: 'none', padding: '8px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
            🔊 Play {advisory.target_language} Audio
          </button>
          <div style={{ fontSize: '0.65rem', color: '#8696a0', textAlign: 'center', marginTop: 4 }}>
            Demo mode — uses browser Web Speech API
          </div>
        </div>
      )}
    </div>
  );
}

export default function CitizenAlert() {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [scenario,      setScenario]      = useState<DemoScenario | null>(null);
  const [advisory,      setAdvisory]      = useState<AdvisoryResponse | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [advisoryLoading, setAdvisoryLoading] = useState(false);
  const [languageCode, setLanguageCode]       = useState<string>('en');
  const [languageName, setLanguageName]       = useState<string>('English');

  const loadScenario = async (key: string) => {
    setLoading(true);
    setAdvisory(null);
    setActiveScenario(key);
    try {
      const s = await getDemoScenario(key);
      setScenario(s);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (code: string, name: string) => {
    setLanguageCode(code);
    setLanguageName(name);
  };

  const generateAdvisory = async () => {
    if (!scenario) return;
    setAdvisoryLoading(true);
    const v = scenario.verdict as WaterQualityVerdict;
    try {
      const result = await getAdvisory({
        state:               scenario.sample.state_ut as string,
        district:            scenario.sample.district as string,
        parameter:           v.primary_contaminant || 'Multiple',
        rule_category:       v.category,
        severity:            v.severity,
        action_code:         v.action_code,
        do_not_boil:         v.do_not_boil,
        safe_to_drink:       v.safe_to_drink,
        recommended_actions: v.recommended_actions || [],
        avoid_actions:       v.avoid_actions || [],
        message_type:        v.message_type || 'SAFE',
        reason:              v.reasons[0] || '',
        unit:                'mg/L',
        target_language:     languageName,
        language_code:       languageCode,
      });
      setAdvisory(result);
    } finally {
      setAdvisoryLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Outfit', fontSize: '1.75rem', fontWeight: 800, color: '#e2e8f0', marginBottom: 6 }}>
          📱 Citizen Alert Preview
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          WhatsApp-style Hindi vernacular alerts for rural citizens. Select a demo scenario to preview.
        </p>
      </div>

      {/* Scenario Selector */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
        {SCENARIOS.map(s => (
          <button key={s.key}
            onClick={() => loadScenario(s.key)}
            style={{
              padding:    '10px 16px',
              borderRadius: 10,
              border:     `2px solid ${activeScenario === s.key ? s.color : 'rgba(255,255,255,0.1)'}`,
              background: activeScenario === s.key ? `${s.color}20` : 'rgba(255,255,255,0.03)',
              color:      activeScenario === s.key ? s.color : '#94a3b8',
              fontWeight: 600,
              fontSize:   '0.85rem',
              cursor:     'pointer',
              transition: 'all 0.2s',
            }}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', color: '#64748b', padding: 40 }}>Loading scenario...</div>}

      {scenario && !loading && (() => {
        const v = scenario.verdict as WaterQualityVerdict;
        const cat = getCategoryConfig(v.category);
        const mtConfig = getMessageTypeConfig(v.message_type);
        const hasRec = v.recommended_actions && v.recommended_actions.length > 0;
        const hasAvoid = v.avoid_actions && v.avoid_actions.length > 0;

        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>
            {/* Left: Scenario details */}
            <div>
              <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{scenario.name}</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 16 }}>{scenario.description}</p>

                {/* Problem type banner — message_type based */}
                <div style={{
                  background:   mtConfig.bgColor,
                  border:       `1px solid ${mtConfig.borderColor}60`,
                  borderRadius: 10,
                  padding:      '12px 16px',
                  marginBottom: 16,
                  display:      'flex',
                  alignItems:   'center',
                  gap:          12,
                }}>
                  <span style={{ fontSize: '1.5rem' }}>{mtConfig.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, color: mtConfig.color, fontSize: '0.9rem' }}>{mtConfig.label}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>{mtConfig.headline}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem' }}>{v.safe_to_drink ? '✅' : '🚱'}</div>
                    <div style={{ fontSize: '0.65rem', color: v.safe_to_drink ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                      {v.safe_to_drink ? 'SAFE' : 'NOT SAFE'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                  <span className={cat.badgeClass} style={{ padding: '6px 14px', borderRadius: 20, fontSize: '0.85rem' }}>
                    {cat.icon} {cat.label}
                  </span>
                  <span style={{ padding: '6px 14px', borderRadius: 20, fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
                    Severity: {v.severity}
                  </span>
                </div>

                {/* Recommended actions */}
                {hasRec && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: 8 }}>REQUIRED ACTIONS:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {v.recommended_actions.map(code => {
                        const { label, icon } = getRecommendedActionLabel(code);
                        return (
                          <div key={code} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 6, fontSize: '0.82rem', color: '#e2e8f0' }}>
                            <span>{icon}</span> {label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Avoid actions */}
                {hasAvoid && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: 8 }}>CRITICAL RESTRICTION:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {v.avoid_actions.map(code => {
                        const { label, icon } = getAvoidActionLabel(code);
                        return (
                          <div key={code} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 6, fontSize: '0.82rem', color: '#fca5a5', fontWeight: 600 }}>
                            <span>{icon}</span> {label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Key parameters */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 8, fontWeight: 600 }}>KEY PARAMETERS:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
                    {Object.entries(scenario.sample)
                      .filter(([k]) => ['fluoride_mg_l', 'arsenic_mg_l', 'nitrate_mg_l', 'e_coli_mpn', 'turbidity_ntu', 'ph'].includes(k))
                      .map(([k, val]) => (
                        <div key={k} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 12px' }}>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            {k.replace('_mg_l', '').replace('_ntu', ' (NTU)').replace('_mpn', ' MPN').toUpperCase()}
                          </div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0' }}>
                            {typeof val === 'number' ? val.toFixed(3) : String(val)}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>LANGUAGE ADVISORY:</div>
                  <LanguageSelector 
                    value={languageCode} 
                    onChange={handleLanguageChange} 
                    disabled={advisoryLoading} 
                  />
                  <button className="btn-primary" onClick={generateAdvisory} disabled={advisoryLoading}>
                    {advisoryLoading ? '⏳ Generating...' : '✨ Generate Advisory'}
                  </button>
                </div>
              </div>

              {/* Rule explanation */}
              <div className="glass-card" style={{ padding: 20 }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: 10 }}>RULE ENGINE REASONING:</div>
                {v.reasons.map((r, i) => (
                  <div key={i} style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: 6, paddingLeft: 12, borderLeft: '2px solid rgba(59,130,246,0.3)' }}>
                    {r}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: WhatsApp preview */}
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                WhatsApp Message Preview
              </div>
              <WhatsAppPreview scenario={scenario} advisory={advisory} />
            </div>
          </div>
        );
      })()}

      {!scenario && !loading && (
        <div className="glass-card" style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📱</div>
          <div>Select a demo scenario above to preview the WhatsApp alert format.</div>
        </div>
      )}
    </div>
  );
}
