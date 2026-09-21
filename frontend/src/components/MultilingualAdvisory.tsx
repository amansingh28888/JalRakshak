import React, { useState, useEffect } from 'react';
import { getAdvisory, getGeminiStatus } from '../api';
import type { WaterSample, WaterQualityVerdict, AdvisoryResponse } from '../types';
import { LanguageSelector } from './LanguageSelector';
import { getSavedLanguageCode, saveLanguageCode, getCachedAdvisory, setCachedAdvisory, getLanguageByCode } from '../utils/language';

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
        language_code:      languageCode
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
    <div className="glass-card" style={{ padding: 20 }}>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
        <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, color: '#e2e8f0' }} className="text-lg">
          🌍 AI Language Advisory
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
            {loading ? '⏳ Generating...' : (advisory ? '🔄 Regenerate' : '✨ Generate')}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-900/30 border border-red-500 rounded-md text-red-200 mb-4 text-sm">
          ⚠️ {error}
        </div>
      )}

      {advisory && (
        <div dir={isRtl ? 'rtl' : 'ltr'} className={`transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
          <div style={{ marginBottom: 8, fontSize: '0.75rem', color: '#475569' }} dir="ltr" className="flex items-center justify-between">
            <span>
              Source: {advisory.source === 'gemini' 
                ? `✨ Gemini AI (${advisory.model_used})` 
                : `📋 Deterministic Fallback (${advisory.source})`}
            </span>
            <span className="font-mono bg-gray-800 px-2 py-0.5 rounded text-gray-400">
              {advisory.target_language} ({advisory.language_code})
            </span>
          </div>
          
          <div style={{ padding: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>
              {advisory.warning_title}
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>
                ⚠️ Warning
              </div>
              <div style={{ fontSize: '0.95rem', color: '#e2e8f0', lineHeight: 1.6 }}>
                {advisory.warning}
              </div>
            </div>
            
            <div style={{
              marginBottom: 16,
              padding: 12,
              background: verdict.do_not_boil ? 'rgba(239,68,68,0.1)' : 'rgba(249,115,22,0.1)',
              borderLeft: isRtl ? 'none' : `4px solid ${verdict.do_not_boil ? '#ef4444' : '#f97316'}`,
              borderRight: isRtl ? `4px solid ${verdict.do_not_boil ? '#ef4444' : '#f97316'}` : 'none',
              borderRadius: 8,
            }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>
                {verdict.do_not_boil ? '🚱 Caution (Boiling not effective)' : '🦠 Caution'}
              </div>
              <div style={{ fontSize: '0.95rem', color: verdict.do_not_boil ? '#fca5a5' : '#fdba74', lineHeight: 1.6, fontWeight: 600 }}>
                {advisory.caution}
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>
                💡 Solution
              </div>
              <div style={{ fontSize: '0.95rem', color: '#10b981', lineHeight: 1.6, fontWeight: 500 }}>
                {advisory.solution}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!advisory && !loading && !error && (
        <div className="py-10 text-center text-gray-500 border border-dashed border-gray-700 rounded-lg bg-gray-800/30">
          <GlobeAltIcon className="h-10 w-10 mx-auto text-gray-600 mb-2" />
          <p>Select a language and click Generate to see the advisory.</p>
          {!geminiConfigured && (
             <p className="text-xs text-yellow-600 mt-2">Note: Gemini is not configured. Fallback deterministic translations will be used.</p>
          )}
        </div>
      )}
    </div>
  );
};

// Extracted to avoid import issue
function GlobeAltIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  );
}
