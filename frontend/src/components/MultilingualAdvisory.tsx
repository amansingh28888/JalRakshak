import React, { useState, useEffect } from 'react';
import { getAdvisory, getGeminiStatus } from '../api';
import type { WaterSample, WaterQualityVerdict, AdvisoryResponse } from '../types';
import { LanguageSelector } from './LanguageSelector';
import { getSavedLanguageCode, saveLanguageCode, getCachedAdvisory, setCachedAdvisory, getLanguageByCode } from '../utils/language';
import { Globe2, Loader2, RefreshCw, Sparkles, AlertTriangle, Cpu, ListChecks, Ban, Bug, Lightbulb } from 'lucide-react';

interface MultilingualAdvisoryProps {
  sample: WaterSample;
  verdict: WaterQualityVerdict;
}

export const MultilingualAdvisory: React.FC<MultilingualAdvisoryProps> = ({ sample, verdict }) => {
  const [advisory, setAdvisory] = useState<AdvisoryResponse | null>(null);
  const [languageCode, setLanguageCode] = useState<string>(getSavedLanguageCode());
  const [languageName, setLanguageName] = useState<string>(getLanguageByCode(getSavedLanguageCode()).name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geminiConfigured, setGeminiConfigured] = useState(false);

  useEffect(() => {
    getGeminiStatus().then(s => setGeminiConfigured(s.gemini_configured)).catch(() => {});
  }, []);

  // Try to load cached advisory on mount or language change
  useEffect(() => {
    if (!sample.id) return;
    const cached = getCachedAdvisory(sample.id, languageCode);
    if (cached) {
      setAdvisory(cached);
    } else {
      setAdvisory(null);
    }
  }, [languageCode, sample.id]);

  const handleGenerate = async () => {
    if (!sample || !verdict) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getAdvisory({
        state:              sample.state_ut,
        district:           sample.district,
        parameter:          verdict.primary_contaminant || 'Multiple parameters',
        measured_value:     sample.fluoride_mg_l ?? sample.arsenic_mg_l ?? sample.e_coli_mpn,
        unit:               'mg/L',
        rule_category:      verdict.category,
        severity:           verdict.severity,
        action_code:        verdict.action_code,
        do_not_boil:        verdict.do_not_boil,
        safe_to_drink:      verdict.safe_to_drink,
        recommended_actions:verdict.recommended_actions,
        avoid_actions:      verdict.avoid_actions,
        message_type:       verdict.message_type,
        reason:             verdict.reasons[0] || '',
        target_language:    languageName,
        language_code:      languageCode,
        parameter_results:  verdict.parameter_results
      });
      setAdvisory(result);
      if (sample.id) {
        setCachedAdvisory(sample.id, languageCode, result);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Advisory generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (code: string, name: string) => {
    setLanguageCode(code);
    setLanguageName(name);
    saveLanguageCode(code);
  };

  const langInfo = getLanguageByCode(languageCode);
  const isRtl = langInfo.isRtl;

  return (
    <div className="card" style={{ padding: 32, marginBottom: 24 }}>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h3 style={{ fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 8 }} className="text-xl">
          <Globe2 size={24} color="var(--color-primary)" />
          AI Language Advisory
        </h3>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <LanguageSelector 
            value={languageCode} 
            onChange={handleLanguageChange} 
            disabled={loading} 
          />
          <button 
            className="btn-primary whitespace-nowrap" 
            onClick={handleGenerate} 
            disabled={loading}
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Generating...</>
            ) : advisory ? (
              <><RefreshCw size={16} /> Regenerate</>
            ) : (
              <><Sparkles size={16} /> Generate</>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#FCE8E8', border: '1px solid rgba(214,69,69,0.3)', borderRadius: 8, color: 'var(--color-danger)', marginBottom: 16, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {advisory && (
        <div dir={isRtl ? 'rtl' : 'ltr'} className={`transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
          <div style={{ marginBottom: 12, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }} dir="ltr" className="flex items-center justify-between">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {advisory.source === 'gemini' 
                ? <><Cpu size={14} color="var(--color-primary)" /> Gemini AI ({advisory.model_used})</>
                : <><ListChecks size={14} /> Deterministic Fallback ({advisory.source})</>}
            </span>
            <span style={{ fontFamily: 'monospace', background: 'var(--color-bg-soft)', padding: '2px 8px', borderRadius: 4, color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
              {advisory.target_language} ({advisory.language_code})
            </span>
          </div>
          
          <div style={{ padding: 24, background: 'var(--color-bg-soft)', borderRadius: 12, border: '1px solid var(--color-border)' }}>
            {advisory.detailed_advisory ? (
              // Detailed AI layout
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>
                    {advisory.detailed_advisory.status}
                  </div>
                </div>
                
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: '1rem', color: 'var(--color-text)', lineHeight: 1.6, fontWeight: 500 }}>
                    {advisory.detailed_advisory.conclusion}
                  </div>
                  {advisory.detailed_advisory.sample_date && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                      Date: {advisory.detailed_advisory.sample_date} | Location: {advisory.detailed_advisory.location}
                    </div>
                  )}
                </div>

                {advisory.detailed_advisory.detected_parameters.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>
                      Parameters Detected
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                      {advisory.detailed_advisory.detected_parameters.map((p, idx) => (
                        <div key={idx} style={{ background: '#fff', padding: 12, borderRadius: 8, border: `1px solid ${p.is_above ? 'var(--color-danger)' : 'var(--color-border)'}` }}>
                          <div style={{ fontWeight: 600, color: p.is_above ? 'var(--color-danger)' : 'var(--color-text)' }}>{p.parameter_name}</div>
                          <div style={{ fontSize: '0.9rem', marginTop: 4 }}>Value: <b>{p.measured_value}</b> (Limit: {p.standard_limit})</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>{p.explanation}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: 24, padding: 16, background: '#fff', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--color-text)', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={16} /> Understanding the Problem
                  </div>
                  <div style={{ fontSize: '0.95rem', color: 'var(--color-text)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                    {advisory.detailed_advisory.problem_explanation}
                  </div>
                  <div style={{ fontSize: '0.95rem', color: 'var(--color-text)', lineHeight: 1.6, marginTop: 12 }}>
                    <b>Health Concerns:</b> {advisory.detailed_advisory.health_concerns}
                  </div>
                </div>

                <div style={{
                  marginBottom: 24,
                  padding: 16,
                  background: advisory.detailed_advisory.boiling_useful ? '#F0F9F0' : '#FCE8E8',
                  borderLeft: isRtl ? 'none' : `4px solid ${advisory.detailed_advisory.boiling_useful ? 'var(--color-safe)' : 'var(--color-danger)'}`,
                  borderRight: isRtl ? `4px solid ${advisory.detailed_advisory.boiling_useful ? 'var(--color-safe)' : 'var(--color-danger)'}` : 'none',
                  borderRadius: '0 8px 8px 0',
                }}>
                  <div style={{ fontSize: '0.9rem', color: advisory.detailed_advisory.boiling_useful ? 'var(--color-safe)' : 'var(--color-danger)', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {advisory.detailed_advisory.boiling_useful ? <><Lightbulb size={16} /> Boiling is Effective</> : <><Ban size={16} /> Do Not Rely on Boiling</>}
                  </div>
                  <div style={{ fontSize: '0.95rem', color: advisory.detailed_advisory.boiling_useful ? '#166534' : '#B91C1C', lineHeight: 1.6, fontWeight: 500 }}>
                    {advisory.detailed_advisory.boiling_explanation}
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>
                    Action Plan
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                    <div style={{ background: '#fff', padding: 16, borderRadius: 8, border: '1px solid var(--color-border)' }}>
                      <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--color-primary)' }}>For Citizens</div>
                      <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.95rem', color: 'var(--color-text)', lineHeight: 1.6 }}>
                        {advisory.detailed_advisory.citizen_actions.map((act, i) => <li key={i}>{act}</li>)}
                      </ul>
                    </div>
                    {advisory.detailed_advisory.authority_actions.length > 0 && (
                      <div style={{ background: '#fff', padding: 16, borderRadius: 8, border: '1px solid var(--color-border)' }}>
                        <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--color-primary)' }}>For Authorities / Technical Team</div>
                        <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.95rem', color: 'var(--color-text)', lineHeight: 1.6 }}>
                          {advisory.detailed_advisory.authority_actions.map((act, i) => <li key={i}>{act}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontStyle: 'italic', background: 'rgba(0,0,0,0.02)', padding: 12, borderRadius: 6 }}>
                  {advisory.detailed_advisory.confidence_note}
                </div>
              </>
            ) : (
              // Old Fallback Layout
              <>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: 16 }}>
                  {advisory.warning_title}
                </div>
                
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={14} /> Warning
                  </div>
                  <div style={{ fontSize: '1rem', color: 'var(--color-text)', lineHeight: 1.6 }}>
                    {advisory.warning}
                  </div>
                </div>
                
                <div style={{
                  marginBottom: 20,
                  padding: 16,
                  background: verdict.do_not_boil ? '#FCE8E8' : '#FDF3E1',
                  borderLeft: isRtl ? 'none' : `4px solid ${verdict.do_not_boil ? 'var(--color-danger)' : 'var(--color-warning)'}`,
                  borderRight: isRtl ? `4px solid ${verdict.do_not_boil ? 'var(--color-danger)' : 'var(--color-warning)'}` : 'none',
                  borderRadius: '0 8px 8px 0',
                }}>
                  <div style={{ fontSize: '0.8rem', color: verdict.do_not_boil ? 'var(--color-danger)' : '#9C6500', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {verdict.do_not_boil ? <><Ban size={14} /> Caution (Boiling not effective)</> : <><Bug size={14} /> Caution</>}
                  </div>
                  <div style={{ fontSize: '1rem', color: verdict.do_not_boil ? '#B91C1C' : '#9C6500', lineHeight: 1.6, fontWeight: 600 }}>
                    {advisory.caution}
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-safe)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Lightbulb size={14} /> Solution
                  </div>
                  <div style={{ fontSize: '1rem', color: 'var(--color-safe)', lineHeight: 1.6, fontWeight: 600 }}>
                    {advisory.solution}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {!advisory && !loading && !error && (
        <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-secondary)', background: 'var(--color-bg-soft)', borderRadius: 12, border: '1px dashed var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Globe2 size={40} color="var(--color-primary)" style={{ opacity: 0.5, marginBottom: 16 }} />
          <p style={{ fontWeight: 500, fontSize: '0.95rem' }}>Select a language and click Generate to see the advisory.</p>
          {!geminiConfigured && (
             <p style={{ fontSize: '0.8rem', color: '#9C6500', marginTop: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
               <AlertTriangle size={14} /> Note: Gemini is not configured. Fallback deterministic translations will be used.
             </p>
          )}
        </div>
      )}
    </div>
  );
};
