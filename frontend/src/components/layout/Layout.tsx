import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Overview Dashboard', icon: '📊', end: true },
  { to: '/explorer', label: 'Water Quality Explorer', icon: '🔍' },
  { to: '/map', label: 'Interactive Map', icon: '🗺️' },
  { to: '/alerts', label: 'Alert Center', icon: '🚨' },
  { to: '/citizen', label: 'Citizen Alert Preview', icon: '📱' },
  { to: '/data', label: 'Dataset Management', icon: '📁' },
  { to: '/methodology', label: 'Methodology & Standards', icon: '📐' },
  { to: '/standards', label: 'Standards Reference', icon: '📋' },
  { to: '/about', label: 'About JalRakshak', icon: 'ℹ️' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 260,
        minHeight: '100vh',
        background: 'rgba(10,22,40,0.95)',
        borderRight: '1px solid rgba(59,130,246,0.15)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #2563eb, #14b8a6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>💧</div>
            <div>
              <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.1rem', color: '#e2e8f0' }}>
                JalRakshak
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', letterSpacing: '0.05em' }}>
                जल रक्षक • Water Guardian
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 12px', flex: 1 }}>
          <div style={{ fontSize: '0.65rem', color: '#475569', fontWeight: 600, letterSpacing: '0.1em', padding: '8px 4px 4px', textTransform: 'uppercase' }}>
            Navigation
          </div>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'active' : ''}`
              }
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 8, fontSize: '0.835rem', fontWeight: 500, transition: 'all 0.2s', color: '#94a3b8', textDecoration: 'none', marginBottom: 2 }}
            >
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(59,130,246,0.1)', fontSize: '0.7rem', color: '#475569' }}>
          <div style={{ marginBottom: 4, fontWeight: 600, color: '#64748b' }}>Architecture Principle</div>
          <div style={{ lineHeight: 1.5 }}>
            <span style={{ color: '#3b82f6' }}>Rule Engine</span> = Safety Authority<br />
            <span style={{ color: '#14b8a6' }}>Gemini</span> = Language Layer
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 260, flex: 1, minHeight: '100vh', padding: '24px 28px', maxWidth: 'calc(100vw - 260px)' }}>
        {children}
      </main>
    </div>
  );
}
