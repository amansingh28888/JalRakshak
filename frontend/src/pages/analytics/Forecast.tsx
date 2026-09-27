import { useState, useEffect } from 'react';
import { getAnalyticsForecast, getStates, getDistricts } from '../../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { TrendingUp, Activity, AlertTriangle, Loader2, Globe2, ChevronDown, ChevronUp } from 'lucide-react';
import { getSummaryTranslation, getSavedLanguageCode, saveLanguageCode } from '../../utils/language';
import { LanguageSelector } from '../../components/LanguageSelector';

const parameters = [
  { id: 'ph', label: 'pH' },
  { id: 'turbidity_ntu', label: 'Turbidity (NTU)' },
  { id: 'tds_mg_l', label: 'TDS (mg/L)' },
  { id: 'fluoride_mg_l', label: 'Fluoride (mg/L)' },
  { id: 'arsenic_mg_l', label: 'Arsenic (mg/L)' },
  { id: 'nitrate_mg_l', label: 'Nitrate (mg/L)' },
  { id: 'iron_mg_l', label: 'Iron (mg/L)' },
  { id: 'e_coli_mpn', label: 'E. coli (MPN)' },
];

export default function Forecast() {
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  
  const [filter, setFilter] = useState({
    state_ut: '',
    district: '',
    parameter: 'fluoride_mg_l',
    horizon: 30
  });

  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [languageCode, setLanguageCode] = useState<string>(getSavedLanguageCode());
  const [showTechDetails, setShowTechDetails] = useState(false);

  const handleLanguageChange = (code: string) => {
    setLanguageCode(code);
    saveLanguageCode(code);
  };

  useEffect(() => {
    getStates().then(setStates);
  }, []);

  useEffect(() => {
    if (filter.state_ut) {
      getDistricts(filter.state_ut).then(setDistricts);
    } else {
      setDistricts([]);
      setFilter(f => ({ ...f, district: '' }));
    }
  }, [filter.state_ut]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getAnalyticsForecast(filter).then(res => {
      if (res.error) {
        setError(res.error);
        setSummary(null);
        setData([]);
      } else {
        const hist = res.historical.map((d: any) => ({ ...d, type: 'historical', historical_value: d.value }));
        const forc = res.forecast.map((d: any) => ({ ...d, type: 'forecast', forecast_value: d.forecast_value }));
        setData([...hist, ...forc]);
        setSummary(res.summary);
      }
    }).finally(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={28} color="var(--color-primary)" />
            Future Forecasting
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 4 }}>
            Predict future water quality trends based on historical measurements.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 no-print">
          <LanguageSelector 
            value={languageCode} 
            onChange={handleLanguageChange} 
          />
          <button onClick={() => window.print()} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Print Report
          </button>
        </div>
      </div>

      <div className="card no-print" style={{ padding: 20, marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>State / UT</label>
          <select className="form-input" value={filter.state_ut} onChange={e => setFilter(f => ({ ...f, state_ut: e.target.value }))}>
            <option value="">All States</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>District</label>
          <select className="form-input" value={filter.district} onChange={e => setFilter(f => ({ ...f, district: e.target.value }))} disabled={!filter.state_ut}>
            <option value="">All Districts</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>Parameter</label>
          <select className="form-input" value={filter.parameter} onChange={e => setFilter(f => ({ ...f, parameter: e.target.value }))}>
            {parameters.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 150px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>Forecast Horizon</label>
          <select className="form-input" value={filter.horizon} onChange={e => setFilter(f => ({ ...f, horizon: Number(e.target.value) }))}>
            <option value={30}>30 Days</option>
            <option value={60}>60 Days</option>
            <option value={90}>90 Days</option>
            <option value={180}>6 Months</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <Loader2 size={32} className="animate-spin" color="var(--color-primary)" />
          <div style={{ color: 'var(--color-text-secondary)' }}>Calculating forecast...</div>
        </div>
      ) : error ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          <AlertTriangle size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <h3>{error}</h3>
          <p>Please select a more specific location or parameter with more historical samples.</p>
        </div>
      ) : summary ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 24 }}>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Current Value</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text)', marginTop: 8 }}>{summary.current_value}</div>
            </div>
            <div className="card" style={{ padding: 20, background: 'linear-gradient(to right, #F8FAFC, white)', borderLeft: '4px solid var(--color-primary)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase' }}>Forecast Value ({summary.horizon} days)</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text)', marginTop: 8 }}>{summary.forecast_value}</div>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Expected Trend</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 12, color: summary.trend === 'Increasing' ? 'var(--color-danger)' : summary.trend === 'Decreasing' ? 'var(--color-safe)' : 'var(--color-text)' }}>
                {summary.trend}
              </div>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Model</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: 12 }}>{summary.method}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>Based on {summary.historical_samples} samples</div>
            </div>
          </div>
          
          {summary.trend === 'Increasing' && (
            <div className="card" style={{ padding: 16, marginBottom: 24, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B' }}>
              <strong>EARLY WARNING:</strong> Historical measurements show an increasing trend. The projected value may approach or exceed safety thresholds during the forecast period. Note that this is a statistical prediction, not a definitive safety classification.
            </div>
          )}

          {/* Simple Summary Section - Future Outlook */}
          <div className="card" style={{ padding: 32, marginBottom: 24, borderLeft: '4px solid #F59E0B' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Globe2 size={24} color="#F59E0B" />
              {getSummaryTranslation(languageCode, 'forecast_title')}
            </h3>
            
            <div style={{ fontSize: '1.1rem', color: 'var(--color-text)', lineHeight: 1.6, fontWeight: 500 }}>
              {(() => {
                if (summary.historical_samples < 5) {
                  return getSummaryTranslation(languageCode, 'forecast_insufficient');
                }
                const paramLabel = parameters.find(p => p.id === filter.parameter)?.label?.split(' (')[0] || filter.parameter;
                
                let trendKey = 'forecast_stable';
                if (summary.trend === 'Increasing') trendKey = 'forecast_increasing';
                if (summary.trend === 'Decreasing') trendKey = 'forecast_decreasing';
                
                const p1 = getSummaryTranslation(languageCode, trendKey, { parameter: paramLabel, days: summary.horizon });
                const p2 = getSummaryTranslation(languageCode, 'forecast_estimated', { value: `${summary.forecast_value} ${parameters.find(p => p.id === filter.parameter)?.label?.split('(')[1]?.replace(')', '') || ''}`.trim() });
                const p3 = getSummaryTranslation(languageCode, 'forecast_disclaimer');
                
                return (
                  <div>
                    <p style={{ marginBottom: '0.5rem' }}>{p1}</p>
                    <p style={{ marginBottom: '0.5rem' }}>{p2}</p>
                    <p>{p3}</p>
                  </div>
                );
              })()}
            </div>
            
            <div style={{ marginTop: 24 }}>
              <button 
                onClick={() => setShowTechDetails(!showTechDetails)}
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-primary)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {getSummaryTranslation(languageCode, 'technical_details')} 
                {showTechDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              
              {showTechDetails && (
                <div style={{ marginTop: 16, padding: 16, background: 'var(--color-bg-soft)', borderRadius: 8, fontSize: '0.9rem', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                  <p><strong>Parameter:</strong> {parameters.find(p => p.id === filter.parameter)?.label}</p>
                  <p><strong>Method:</strong> {summary.method}</p>
                  <p><strong>Forecast Horizon:</strong> {summary.horizon} Days</p>
                  <p><strong>Data Points:</strong> {summary.historical_samples} historical observations</p>
                  <p><strong>Statistical Limitation:</strong> Forecasting is based on simple linear regression of historical data. True future levels may vary due to environmental, seasonal, or intervention factors.</p>
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ padding: 24, height: 500 }}>
            <h3 style={{ marginBottom: 20, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={18} />
              Forecast Projection
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} tickMargin={12} minTickGap={30} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} tickMargin={12} />
                <Tooltip 
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}
                />
                <Legend verticalAlign="top" height={36}/>
                
                {/* Find the transition point to add a reference line */}
                {data.find(d => d.type === 'forecast') && (
                  <ReferenceLine x={data.find(d => d.type === 'forecast').date} stroke="var(--color-text-secondary)" strokeDasharray="3 3" label="Forecast Start" />
                )}

                <Line 
                  name="Historical Data"
                  type="monotone" 
                  dataKey="historical_value" 
                  stroke="var(--color-primary)" 
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'var(--color-primary)', strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Line 
                  name="Forecast Model"
                  type="monotone" 
                  dataKey="forecast_value" 
                  stroke="#F59E0B" 
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={{ r: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : null}
    </div>
  );
}
