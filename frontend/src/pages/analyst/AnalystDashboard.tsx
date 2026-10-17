import { useState } from 'react';
import { 
  BarChart3, TrendingUp, LineChart, FileDown, 
  ShieldCheck, Activity, ArrowRight, Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const mockTrendData = [
  { month: 'May', ph: 7.2, turbidity: 4.1, nitrate: 32, fluoride: 0.9 },
  { month: 'Jun', ph: 7.1, turbidity: 5.8, nitrate: 38, fluoride: 1.1 },
  { month: 'Jul', ph: 6.8, turbidity: 8.2, nitrate: 47, fluoride: 1.4 },
  { month: 'Aug', ph: 6.9, turbidity: 7.5, nitrate: 44, fluoride: 1.3 },
  { month: 'Sep', ph: 7.3, turbidity: 4.6, nitrate: 36, fluoride: 1.0 },
  { month: 'Oct', ph: 7.4, turbidity: 3.8, nitrate: 31, fluoride: 0.8 },
];

export default function AnalystDashboard() {
  const [selectedParam, setSelectedParam] = useState<'ph' | 'turbidity' | 'nitrate' | 'fluoride'>('ph');

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 48 }}>
      
      {/* Top Banner */}
      <div className="card" style={{ 
        position: 'relative', 
        height: 200, 
        overflow: 'hidden', 
        marginBottom: 24, 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0 36px',
        borderRadius: 16,
        background: 'linear-gradient(135deg, #0f172a 0%, #0369a1 100%)',
      }}>
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 640 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: 99, color: '#e0f2fe', fontSize: '0.8rem', fontWeight: 700, marginBottom: 12 }}>
            <Activity size={14} /> SCIENTIFIC ANALYST PORTAL
          </div>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, color: 'white', marginBottom: 8 }}>
            Water Quality Intelligence Hub
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1rem', lineHeight: 1.4 }}>
            Predictive modeling, multi-parameter chemical analysis, and algorithmic compliance verification.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 28 }}>
        
        <div className="card" style={{ padding: 22, display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
            <BarChart3 size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>Analyzed Samples</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--color-text)' }}>55,002</div>
            <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>99.8% ML Confidence</div>
          </div>
        </div>

        <div className="card" style={{ padding: 22, display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>Active Predictions</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--color-text)' }}>14 Districts</div>
            <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>Elevated Seasonal Risk</div>
          </div>
        </div>

        <div className="card" style={{ padding: 22, display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>BIS Standards Adherence</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--color-text)' }}>IS 10500:2012</div>
            <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>Compliant Validation Rule</div>
          </div>
        </div>

        <div className="card" style={{ padding: 22, display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
            <Layers size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>Verified Sensors</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--color-text)' }}>48 Active Nodes</div>
            <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>Telemetry Operational</div>
          </div>
        </div>

      </div>

      {/* Quick Navigation Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 28 }}>
        
        <Link to="/analytics/trends" className="card" style={{ padding: 24, textDecoration: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid #0284c7', transition: 'all 0.2s' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ color: '#0284c7', fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <LineChart size={20} /> Water Quality Trends
              </div>
              <ArrowRight size={18} color="#0284c7" />
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Explore longitudinal time-series data for pH, Turbidity, TDS, and heavy metals across monitored river basins.
            </p>
          </div>
          <span style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: 600, marginTop: 16 }}>Open Trends Module →</span>
        </Link>

        <Link to="/analytics/forecast" className="card" style={{ padding: 24, textDecoration: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid #d97706', transition: 'all 0.2s' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ color: '#d97706', fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={20} /> Contamination Forecast
              </div>
              <ArrowRight size={18} color="#d97706" />
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Simulate monsoon runoff and agricultural fertilizer inflow using machine-learning forecast models.
            </p>
          </div>
          <span style={{ fontSize: '0.85rem', color: '#d97706', fontWeight: 600, marginTop: 16 }}>Open Forecast Module →</span>
        </Link>

        <Link to="/analytics/compare" className="card" style={{ padding: 24, textDecoration: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid #8b5cf6', transition: 'all 0.2s' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ color: '#8b5cf6', fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart3 size={20} /> Comparative Analysis
              </div>
              <ArrowRight size={18} color="#8b5cf6" />
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Compare water safety metrics between multiple districts, states, and water catchment sources simultaneously.
            </p>
          </div>
          <span style={{ fontSize: '0.85rem', color: '#8b5cf6', fontWeight: 600, marginTop: 16 }}>Open Comparison Tool →</span>
        </Link>

        <Link to="/reports" className="card" style={{ padding: 24, textDecoration: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid #10b981', transition: 'all 0.2s' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ color: '#10b981', fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileDown size={20} /> Scientific Reports
              </div>
              <ArrowRight size={18} color="#10b981" />
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Generate and download ISO/BIS compliant PDF and CSV scientific documentation for government review.
            </p>
          </div>
          <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600, marginTop: 16 }}>Export Reports →</span>
        </Link>

      </div>

      {/* Main Analysis Chart */}
      <div className="card" style={{ padding: 28, marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 4 }}>
              6-Month Parameter Trajectory
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
              Historical aggregate readings from Central Ground Water Board and State Labs.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {(['ph', 'turbidity', 'nitrate', 'fluoride'] as const).map(param => (
              <button
                key={param}
                onClick={() => setSelectedParam(param)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: selectedParam === param ? '#0284c7' : 'white',
                  color: selectedParam === param ? 'white' : '#475569',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                {param.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockTrendData}>
              <defs>
                <linearGradient id="analystGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ background: '#0f172a', borderRadius: 8, border: 'none', color: 'white' }}
              />
              <Area 
                type="monotone" 
                dataKey={selectedParam} 
                stroke="#0284c7" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#analystGrad)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
