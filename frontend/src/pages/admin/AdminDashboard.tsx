import { Droplets, AlertTriangle, Activity, Map as MapIcon, ArrowRight, Wifi, Waves, Wind, LineChart as LineChartIcon, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts';

const mockTrendData = [
  { day: 'Apr 20', ganga: 6.8, yamuna: 6.5, saraswati: 5.5 },
  { day: 'Apr 21', ganga: 6.6, yamuna: 6.1, saraswati: 5.8 },
  { day: 'Apr 22', ganga: 7.2, yamuna: 7.0, saraswati: 6.2 },
  { day: 'Apr 23', ganga: 7.5, yamuna: 6.6, saraswati: 6.0 },
  { day: 'Apr 24', ganga: 7.2, yamuna: 6.3, saraswati: 5.5 },
  { day: 'Apr 25', ganga: 7.3, yamuna: 6.5, saraswati: 5.6 },
  { day: 'Apr 26', ganga: 7.5, yamuna: 6.7, saraswati: 5.7 },
];

export default function AdminDashboard() {

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 40 }}>
      {/* Hero Banner */}
      <div className="card" style={{ 
        position: 'relative', 
        height: 240, 
        overflow: 'hidden', 
        marginBottom: 24, 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0 40px',
        borderRadius: 16
      }}>
        <div style={{ 
          position: 'absolute', 
          top: 0, left: 0, right: 0, bottom: 0, 
          backgroundImage: 'url("https://images.unsplash.com/photo-1437482078695-73f5ca6c96e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")', 
          backgroundSize: 'cover', 
          backgroundPosition: 'center 60%' 
        }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, rgba(11,46,89,0.9) 0%, rgba(11,46,89,0.5) 60%, transparent 100%)' }} />
        
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 600 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', marginBottom: 12, letterSpacing: '-0.02em' }}>
            JalRakshak
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.2rem', marginBottom: 24, lineHeight: 1.4 }}>
            Real-time monitoring for a safer and healthier water ecosystem.
          </p>
          <Link to="/citizen/map" className="btn-primary" style={{ background: '#0EA5E9', border: 'none', padding: '10px 24px', fontSize: '1rem', borderRadius: 99 }}>
            Explore Map <ArrowRight size={18} />
          </Link>
        </div>
        
        <div style={{ position: 'absolute', right: 40, bottom: 40, zIndex: 10, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', padding: '12px 20px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(255,255,255,0.2)' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={24} color="white" />
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>Monitoring 24/7 <div style={{ width: 8, height: 8, background: '#4ADE80', borderRadius: '50%' }} /></div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem' }}>Rivers • Lakes • Water Quality</div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 24 }}>
        <div className="card" style={{ padding: 24, display: 'flex', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 50, background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Droplets size={24} color="#0284C7" />
          </div>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 500, marginBottom: 4 }}>Total Water Sources</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>48</div>
            <div style={{ fontSize: '0.8rem', color: '#10B981', marginTop: 8, fontWeight: 600 }}>↑ +2 new this week</div>
            <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: 4 }}>Rivers, Lakes, Reservoirs</div>
          </div>
        </div>

        <div className="card" style={{ padding: 24, display: 'flex', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 50, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Wifi size={24} color="#16A34A" />
          </div>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 500, marginBottom: 4 }}>Active Sensors</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>42</div>
            <div style={{ fontSize: '0.8rem', color: '#16A34A', marginTop: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 6, height: 6, background: '#16A34A', borderRadius: 3 }}/> 87% online</div>
            <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: 4 }}>Out of 48 installed</div>
          </div>
        </div>

        <div className="card" style={{ padding: 24, display: 'flex', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 50, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={24} color="#DC2626" />
          </div>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 500, marginBottom: 4 }}>Active Alerts</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#DC2626', lineHeight: 1 }}>3</div>
            <div style={{ fontSize: '0.8rem', color: '#DC2626', marginTop: 8, fontWeight: 600 }}>• 2 high / 1 medium</div>
            <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: 4 }}>Needs immediate attention</div>
          </div>
        </div>

        <div className="card" style={{ padding: 24, display: 'flex', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 50, background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Waves size={24} color="#0284C7" />
          </div>
          <div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 500, marginBottom: 4 }}>Water Quality (Avg.)</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0369A1', lineHeight: 1 }}>Good</div>
            <div style={{ fontSize: '0.8rem', color: '#10B981', marginTop: 8, fontWeight: 600 }}>↑ +5% vs last week</div>
            <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: 4 }}>Based on key parameters</div>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24, marginBottom: 24 }}>
        
        {/* Left Col - Map */}
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><MapIcon size={20} color="var(--color-primary)"/> Live Monitoring Map</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Real-time status of water quality and river levels</p>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 4, background: '#10B981' }}/> Normal</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 4, background: '#F59E0B' }}/> Warning</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 4, background: '#EF4444' }}/> Critical</span>
            </div>
          </div>
          
          <div style={{ 
            flex: 1, 
            borderRadius: 12, 
            background: 'url("https://www.google.com/maps/vt/pb=!1m4!1m3!1i10!2i736!3i428!2m3!1e0!2sm!3i420120444!3m7!2sen!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m1!1e0!23i1301875")', 
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            border: '1px solid var(--color-border)',
            minHeight: 400
          }}>
            {/* Map Overlay for softness */}
            <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.4)'}}/>
            
            {/* Mock Map Markers and Path */}
            <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
              {/* Rivers */}
              <path d="M -50 150 Q 150 100, 250 200 T 450 300 T 700 250" fill="none" stroke="#60A5FA" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M -50 450 Q 200 400, 350 350 T 550 300" fill="none" stroke="#38BDF8" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Markers */}
              <circle cx="150" cy="185" r="8" fill="#EF4444" stroke="white" strokeWidth="3" />
              <circle cx="220" cy="165" r="8" fill="#10B981" stroke="white" strokeWidth="3" />
              <circle cx="280" cy="220" r="8" fill="#0EA5E9" stroke="white" strokeWidth="3" />
              <circle cx="380" cy="270" r="8" fill="#10B981" stroke="white" strokeWidth="3" />
              <circle cx="480" cy="265" r="14" fill="#EF4444" fillOpacity="0.4" />
              <circle cx="480" cy="265" r="7" fill="#EF4444" stroke="white" strokeWidth="2" />
              
              <circle cx="150" cy="390" r="8" fill="#10B981" stroke="white" strokeWidth="3" />
              <circle cx="280" cy="370" r="8" fill="#F59E0B" stroke="white" strokeWidth="3" />
              <circle cx="520" cy="300" r="8" fill="#10B981" stroke="white" strokeWidth="3" />
              
              <text x="180" y="240" fill="#1E40AF" fontSize="13" fontWeight="700">Ganga River</text>
              <text x="180" y="420" fill="#1E40AF" fontSize="13" fontWeight="700">Saraswati River</text>
              <text x="500" y="340" fill="#1E40AF" fontSize="13" fontWeight="700">Yamuna River</text>
            </svg>
            
            {/* Map Popover */}
            <div className="card" style={{ position: 'absolute', top: 120, left: 300, width: 220, padding: 16, zIndex: 10, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 4 }}>Ganga River <span style={{fontWeight: 400, color: 'var(--color-text-secondary)'}}>(Site-12)</span></div>
              <div style={{ fontSize: '0.8rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}><div style={{ width: 8, height: 8, borderRadius: 4, background: '#10B981' }}/> Normal</div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4, borderBottom: '1px solid var(--color-border)', paddingBottom: 4 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>pH</span> <span style={{fontWeight: 600}}>7.2</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4, borderBottom: '1px solid var(--color-border)', paddingBottom: 4 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>DO</span> <span style={{fontWeight: 600}}>6.8 mg/L</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 12 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Water Level</span> <span style={{fontWeight: 600}}>2.4 m</span>
              </div>
              <Link to="/citizen/explorer" style={{ fontSize: '0.8rem', color: '#0EA5E9', fontWeight: 600, textDecoration: 'none' }}>View Details →</Link>
            </div>
          </div>
        </div>

        {/* Right Col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Chart */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}><LineChartIcon size={18} color="var(--color-primary)"/> Water Quality Trend</h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 16 }}>pH level (last 7 days)</div>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockTrendData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} domain={[3, 9]} ticks={[3, 5, 7, 9]}/>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: '0.8rem', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}/>
                  <Line type="monotone" dataKey="ganga" stroke="#0EA5E9" strokeWidth={3} dot={{r:3}} activeDot={{r:5}} />
                  <Line type="monotone" dataKey="yamuna" stroke="#10B981" strokeWidth={3} dot={{r:3}} />
                  <Line type="monotone" dataKey="saraswati" stroke="#F59E0B" strokeWidth={3} dot={{r:3}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12, fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 4, background: '#0EA5E9' }}/> Ganga</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 4, background: '#10B981' }}/> Yamuna</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 4, background: '#F59E0B' }}/> Saraswati</span>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><Activity size={18} color="var(--color-primary)"/> Quick Stats</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}><Activity size={16}/></div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>pH (avg)</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>7.1</div>
                  <div style={{ fontSize: '0.65rem', color: '#10B981', background: '#DCFCE7', padding: '2px 6px', borderRadius: 4, display: 'inline-block', marginTop: 4, fontWeight: 600 }}>Normal</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}><Droplets size={16}/></div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>DO (avg)</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>6.5 <span style={{fontSize:'0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)'}}>mg/L</span></div>
                  <div style={{ fontSize: '0.65rem', color: '#10B981', background: '#DCFCE7', padding: '2px 6px', borderRadius: 4, display: 'inline-block', marginTop: 4, fontWeight: 600 }}>Normal</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}><Wind size={16}/></div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Turbidity (avg)</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>4.2 <span style={{fontSize:'0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)'}}>NTU</span></div>
                  <div style={{ fontSize: '0.65rem', color: '#10B981', background: '#DCFCE7', padding: '2px 6px', borderRadius: 4, display: 'inline-block', marginTop: 4, fontWeight: 600 }}>Normal</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}><Waves size={16}/></div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Water Level (avg)</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>2.8 <span style={{fontSize:'0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)'}}>m</span></div>
                  <div style={{ fontSize: '0.65rem', color: '#10B981', background: '#DCFCE7', padding: '2px 6px', borderRadius: 4, display: 'inline-block', marginTop: 4, fontWeight: 600 }}>Normal</div>
                </div>
              </div>

            </div>
          </div>

          {/* Protect Promo */}
          <div className="card" style={{ padding: 24, background: 'url("https://images.unsplash.com/photo-1437482078695-73f5ca6c96e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80")', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', overflow: 'hidden', height: 160 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, rgba(11,46,89,0.95) 0%, rgba(11,46,89,0.5) 100%)' }} />
            <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
              <Droplets size={24} color="#38BDF8" style={{ marginBottom: 8 }}/>
              <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 800, marginBottom: 4 }}>Protect Our Water</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', marginBottom: 12 }}>Better monitoring. Healthier rivers. A safer tomorrow.</p>
              <div>
                <button className="btn-primary" style={{ background: '#0EA5E9', border: 'none', padding: '6px 16px', fontSize: '0.85rem', borderRadius: 99 }}>Learn More →</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Bell size={20} color="#EF4444"/> Recent Alerts</h3>
          <Link to="/admin/alerts" style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>View All →</Link>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Location</th>
                <th>Parameter</th>
                <th>Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Apr 26, 2025 10:24 AM</td>
                <td style={{ fontWeight: 500, fontSize: '0.85rem' }}>Yamuna River (Site-07)</td>
                <td style={{ fontSize: '0.85rem' }}>Turbidity</td>
                <td style={{ fontSize: '0.85rem' }}>32 NTU</td>
                <td><span style={{ background: '#EF4444', color: 'white', padding: '4px 12px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600 }}>High</span></td>
              </tr>
              <tr>
                <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Apr 26, 2025 09:12 AM</td>
                <td style={{ fontWeight: 500, fontSize: '0.85rem' }}>Ganga River (Site-12)</td>
                <td style={{ fontSize: '0.85rem' }}>pH</td>
                <td style={{ fontSize: '0.85rem' }}>5.8</td>
                <td><span style={{ background: '#F59E0B', color: 'white', padding: '4px 12px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600 }}>Medium</span></td>
              </tr>
              <tr>
                <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Apr 25, 2025 06:45 PM</td>
                <td style={{ fontWeight: 500, fontSize: '0.85rem' }}>Saraswati River (Site-03)</td>
                <td style={{ fontSize: '0.85rem' }}>DO</td>
                <td style={{ fontSize: '0.85rem' }}>3.2 mg/L</td>
                <td><span style={{ background: '#EF4444', color: 'white', padding: '4px 12px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600 }}>High</span></td>
              </tr>
              <tr>
                <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Apr 25, 2025 02:18 PM</td>
                <td style={{ fontWeight: 500, fontSize: '0.85rem' }}>Ganga River (Site-11)</td>
                <td style={{ fontSize: '0.85rem' }}>Water Level</td>
                <td style={{ fontSize: '0.85rem' }}>4.6 m</td>
                <td><span style={{ background: '#10B981', color: 'white', padding: '4px 12px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600 }}>Normal</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
