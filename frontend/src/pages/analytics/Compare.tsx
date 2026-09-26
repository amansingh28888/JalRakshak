import { useState, useEffect } from 'react';
import { getAnalyticsCompare, getStates, getDistricts } from '../../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart2, Loader2 } from 'lucide-react';

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

export default function Compare() {
  const [states, setStates] = useState<string[]>([]);
  const [districts1, setDistricts1] = useState<string[]>([]);
  const [districts2, setDistricts2] = useState<string[]>([]);
  
  const [loc1, setLoc1] = useState({ state: '', district: '' });
  const [loc2, setLoc2] = useState({ state: '', district: '' });
  const [parameter, setParameter] = useState('fluoride_mg_l');

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getStates().then(setStates);
  }, []);

  useEffect(() => {
    if (loc1.state) getDistricts(loc1.state).then(setDistricts1);
    else { setDistricts1([]); setLoc1(l => ({ ...l, district: '' })); }
  }, [loc1.state]);

  useEffect(() => {
    if (loc2.state) getDistricts(loc2.state).then(setDistricts2);
    else { setDistricts2([]); setLoc2(l => ({ ...l, district: '' })); }
  }, [loc2.state]);

  const handleCompare = () => {
    if (!loc1.state || !loc1.district || !loc2.state || !loc2.district) return;
    setLoading(true);
    getAnalyticsCompare({
      location1_state: loc1.state,
      location1_district: loc1.district,
      location2_state: loc2.state,
      location2_district: loc2.district,
      parameter
    }).then(res => {
      // Map data for recharts
      const mapped = res.comparison.map((c: any) => ({
        name: c.district,
        Average: c.avg,
        Max: c.max,
        Min: c.min,
        Count: c.count
      }));
      setData(mapped);
    }).finally(() => setLoading(false));
  };

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={28} color="var(--color-primary)" />
            Location Comparison
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 4 }}>
            Compare water quality parameters across different districts.
          </p>
        </div>
        <button onClick={() => window.print()} className="btn-secondary no-print" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          Print Report
        </button>
      </div>

      <div className="card no-print" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          
          <div style={{ flex: '1 1 250px', background: 'var(--color-bg-soft)', padding: 16, borderRadius: 8 }}>
            <h4 style={{ marginBottom: 12, color: 'var(--color-text)', fontSize: '0.9rem' }}>Location 1</h4>
            <div style={{ display: 'flex', gap: 12 }}>
              <select className="form-input" style={{ flex: 1 }} value={loc1.state} onChange={e => setLoc1(l => ({ ...l, state: e.target.value }))}>
                <option value="">State</option>
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select className="form-input" style={{ flex: 1 }} value={loc1.district} onChange={e => setLoc1(l => ({ ...l, district: e.target.value }))} disabled={!loc1.state}>
                <option value="">District</option>
                {districts1.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div style={{ flex: '1 1 250px', background: 'var(--color-bg-soft)', padding: 16, borderRadius: 8 }}>
            <h4 style={{ marginBottom: 12, color: 'var(--color-text)', fontSize: '0.9rem' }}>Location 2</h4>
            <div style={{ display: 'flex', gap: 12 }}>
              <select className="form-input" style={{ flex: 1 }} value={loc2.state} onChange={e => setLoc2(l => ({ ...l, state: e.target.value }))}>
                <option value="">State</option>
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select className="form-input" style={{ flex: 1 }} value={loc2.district} onChange={e => setLoc2(l => ({ ...l, district: e.target.value }))} disabled={!loc2.state}>
                <option value="">District</option>
                {districts2.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>Parameter</label>
            <select className="form-input" value={parameter} onChange={e => setParameter(e.target.value)}>
              {parameters.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>

          <button className="btn-primary" onClick={handleCompare} disabled={!loc1.district || !loc2.district || loading} style={{ height: 42 }}>
            Compare
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <Loader2 size={32} className="animate-spin" color="var(--color-primary)" />
        </div>
      ) : data.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
          <div className="card" style={{ padding: 24, height: 400 }}>
            <h3 style={{ marginBottom: 20 }}>Comparison Chart</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend />
                <Bar dataKey="Average" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Max" fill="var(--color-danger)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Comparison Table</h3>
            <div className="table-responsive">
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Average</th>
                    <th>Minimum</th>
                    <th>Maximum</th>
                    <th>Samples Count</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{row.name}</td>
                      <td>{row.Average}</td>
                      <td>{row.Min}</td>
                      <td>{row.Max}</td>
                      <td>{row.Count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          <BarChart2 size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p>Select locations and click Compare to view analysis.</p>
        </div>
      )}
    </div>
  );
}
