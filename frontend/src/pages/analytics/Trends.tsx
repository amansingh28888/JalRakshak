import { useState, useEffect } from 'react';
import { getAnalyticsTrends, getStates, getDistricts } from '../../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LineChart as LineChartIcon, Activity, AlertTriangle, ArrowUpRight, ArrowDownRight, Minus, Loader2, Globe2, ChevronDown, ChevronUp } from 'lucide-react';
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

export default function Trends() {
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  
  const [filter, setFilter] = useState({
    state_ut: '',
    district: '',
    parameter: 'fluoride_mg_l',
    days: 365
  });

  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
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
    getAnalyticsTrends(filter).then(res => {
      setData(res.data || []);
      setSummary(res.summary || null);
    }).finally(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <LineChartIcon size={28} color="var(--color-primary)" />
            Historical Trend Analysis
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 4 }}>
            Track water quality parameters over time using historical data.
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
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>Time Range</label>
          <select className="form-input" value={filter.days} onChange={e => setFilter(f => ({ ...f, days: Number(e.target.value) }))}>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
            <option value={180}>Last 6 Months</option>
            <option value={365}>Last 1 Year</option>
            <option value={3650}>All Time</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <Loader2 size={32} className="animate-spin" color="var(--color-primary)" />
          <div style={{ color: 'var(--color-text-secondary)' }}>Analyzing trends...</div>
        </div>
      ) : summary?.status ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          <AlertTriangle size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <h3>{summary.status}</h3>
          <p>Please select a different location, parameter, or time range.</p>
        </div>
      ) : summary ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 24 }}>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Latest Value</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text)', marginTop: 8 }}>{summary.latest_value}</div>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Average</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text)', marginTop: 8 }}>{summary.average}</div>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Min / Max</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', marginTop: 12 }}>
                {summary.minimum} <span style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', fontWeight: 400 }}>to</span> {summary.maximum}
              </div>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Trend</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, color: summary.trend === 'Increasing' ? 'var(--color-danger)' : summary.trend === 'Decreasing' ? 'var(--color-safe)' : 'var(--color-text)' }}>
                {summary.trend === 'Increasing' ? <ArrowUpRight size={24} /> : summary.trend === 'Decreasing' ? <ArrowDownRight size={24} /> : <Minus size={24} />}
                {summary.trend}
                <span style={{ fontSize: '1rem', marginLeft: 'auto' }}>
                  {summary.percentage_change > 0 ? '+' : ''}{summary.percentage_change}%
                </span>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 24, height: 500 }}>
            <h3 style={{ marginBottom: 20, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={18} />
              Trend Over Time
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
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="var(--color-primary)" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'var(--color-primary)', strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div style={{ textAlign: 'right', marginTop: 12, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            Based on {summary.sample_count} historical observations
          </div>

          {/* Simple Summary Section */}
          <div className="card" style={{ padding: 32, marginTop: 24, borderLeft: '4px solid var(--color-primary)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Globe2 size={24} color="var(--color-primary)" />
              {getSummaryTranslation(languageCode, 'trend_title')}
            </h3>
            
            <div style={{ fontSize: '1.1rem', color: 'var(--color-text)', lineHeight: 1.6, fontWeight: 500 }}>
              {(() => {
                if (summary.sample_count < 2 || summary.status) {
                  return getSummaryTranslation(languageCode, 'trend_insufficient');
                }
                const paramLabel = parameters.find(p => p.id === filter.parameter)?.label?.split(' (')[0] || filter.parameter;
                
                let trendKey = 'trend_stable';
                if (summary.trend === 'Increasing') trendKey = 'trend_increasing';
                if (summary.trend === 'Decreasing') trendKey = 'trend_decreasing';
                
                const p1 = getSummaryTranslation(languageCode, trendKey, { parameter: paramLabel });
                const p2 = getSummaryTranslation(languageCode, 'trend_latest', { value: `${summary.latest_value} ${parameters.find(p => p.id === filter.parameter)?.label?.split('(')[1]?.replace(')', '') || ''}`.trim() });
                const p3 = getSummaryTranslation(languageCode, 'trend_attention');
                
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
                  <p><strong>Method:</strong> Linear Regression on Time Series Data</p>
                  <p><strong>Analysis Period:</strong> Last {filter.days === 3650 ? 'All Time' : `${filter.days} Days`}</p>
                  <p><strong>Data Points:</strong> {summary.sample_count} observations</p>
                  <p><strong>Percentage Change:</strong> {summary.percentage_change > 0 ? '+' : ''}{summary.percentage_change}% over period</p>
                  <p><strong>Statistical Limitation:</strong> Trends are descriptive based on historical readings and do not imply causation or guarantee future conditions.</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
