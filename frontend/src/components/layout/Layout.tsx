import { NavLink, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Search, Map as MapIcon, Bell, Database, LogOut, FileText, UserCircle, PlusCircle, Users, TrendingUp, BarChart2, LineChart, FileDown, Settings, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { JalDootChatbot } from '../JalDootChatbot';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { signOut, user, profile } = useAuth();
  const path = location.pathname;

  // Hide sidebar on landing and login
  if (path === '/' || path === '/login') {
    return (
      <>
        {children}
        <JalDootChatbot />
      </>
    );
  }

  let navItems = [];
  let analyticsItems = [
    { to: '/analytics/trends', label: 'Trends', icon: LineChart },
    { to: '/analytics/forecast', label: 'Forecast', icon: TrendingUp },
    { to: '/analytics/compare', label: 'Compare Locations', icon: BarChart2 },
    { to: '/reports', label: 'Reports', icon: FileDown },
  ];


  if (path.startsWith('/admin') || (path.startsWith('/analytics') && profile?.role === 'admin') || (path.startsWith('/reports') && profile?.role === 'admin')) {
    navItems = [
      { to: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
      { to: '/admin/samples', label: 'All Samples', icon: Search },
      { to: '/admin/data', label: 'Data Management', icon: Database },
      { to: '/admin/workers', label: 'Field Workers', icon: Users },
      { to: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
    ];
  } else if (path.startsWith('/worker') || (path.startsWith('/analytics') && profile?.role === 'field_worker') || (path.startsWith('/reports') && profile?.role === 'field_worker')) {
    navItems = [
      { to: '/worker/dashboard', label: 'Worker Dashboard', icon: LayoutDashboard },
      { to: '/worker/collect', label: 'Collect Sample', icon: PlusCircle },
      { to: '/worker/samples', label: 'My Samples', icon: FileText },
      { to: '/worker/profile', label: 'My Profile', icon: UserCircle },
    ];
  } else {
    // Citizen Portal
    navItems = [
      { to: '/citizen/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/citizen/explorer', label: 'Water Quality', icon: Search },
      { to: '/citizen/map', label: 'Map View', icon: MapIcon },
      { to: '/citizen/alerts', label: 'Alerts', icon: Bell },
      { to: '/citizen/about', label: 'Reports', icon: FileText },
      { to: '/settings', label: 'Settings', icon: Settings },
    ];
  }

  // Ensure Admin nav matches screenshot roughly
  if (path.startsWith('/admin') || (path.startsWith('/analytics') && profile?.role === 'admin') || (path.startsWith('/reports') && profile?.role === 'admin')) {
    navItems = [
      { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/analytics/trends', label: 'Water Quality', icon: Activity },
      { to: '/admin/samples', label: 'River Levels', icon: TrendingUp },
      { to: '/citizen/map', label: 'Map View', icon: MapIcon },
      { to: '/admin/alerts', label: 'Alerts', icon: Bell, badge: 3 },
      { to: '/reports', label: 'Reports', icon: FileText },
      { to: '/settings', label: 'Settings', icon: Settings },
    ];
    analyticsItems = []; // Merge analytics into main nav for this design
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--color-bg-soft)' }}>
      {/* Top Navbar */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-main { margin: 0 !important; padding: 0 !important; max-width: 100% !important; background: white !important; }
        }
        .topbar {
          height: 72px;
          background: rgba(9, 20, 40, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          padding: 0 24px;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 101;
          justify-content: space-between;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
        }
        .search-bar {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 9999px;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          width: 400px;
          transition: all 0.3s ease;
        }
        .search-bar:focus-within {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(0, 210, 255, 0.15);
          background: rgba(12, 30, 62, 0.6);
        }
        .search-bar input {
          background: transparent;
          border: none;
          outline: none;
          width: 100%;
          font-size: 0.9rem;
          color: var(--color-text);
        }
      `}</style>
      
      <header className="topbar no-print">
        {/* Logo Left */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, width: 260 }}>
          <img src="/logo.png" alt="JalRakshak Logo" style={{ width: 44, height: 44, objectFit: 'contain' }} />
          <div>
            <div style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: '1.4rem', color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
              JalRakshak
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              Water Today · Secure Tomorrow
            </div>
          </div>
        </Link>
        
        {/* Search Middle */}
        <div className="search-bar">
          <Search size={18} color="#9CA3AF" />
          <input type="text" placeholder="Search location, river, or sensor ID..." />
        </div>
        
        {/* Profile Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <Bell size={24} color="var(--color-text-secondary)" />
            <div style={{ position: 'absolute', top: -4, right: -4, background: 'var(--color-danger)', color: 'white', fontSize: '0.65rem', fontWeight: 'bold', borderRadius: '10px', padding: '1px 5px', minWidth: 16, textAlign: 'center' }}>3</div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => { if (user) signOut(); }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0, 210, 255, 0.1)', border: '1px solid rgba(0, 210, 255, 0.3)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {user ? <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile?.full_name || 'U'}&backgroundColor=0B5D8F`} alt="Avatar" style={{ width: '100%', height: '100%' }} /> : <UserCircle size={24} />}
            </div>
            {user ? (
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text)' }}>{profile?.full_name || user.email}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{profile?.role === 'admin' ? 'Admin' : 'Field Worker'}</div>
              </div>
            ) : (
              <Link to="/login" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'none' }}>Sign In</Link>
            )}
            {user && <LogOut size={16} color="var(--color-text-secondary)" style={{ marginLeft: 8 }} />}
          </div>
        </div>
      </header>

      {/* Sidebar - Hide when printing */}
      <aside className="no-print" style={{
        width: 260,
        background: 'rgba(9, 20, 40, 0.7)',
        backdropFilter: 'blur(16px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 72,
        left: 0,
        bottom: 0,
        zIndex: 100,
      }}>
        {/* Nav */}
        <nav style={{ padding: '24px 16px', flex: 1, overflowY: 'auto' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-nav-item ${isActive ? 'active' : ''}`
                }
              >
                <Icon size={20} strokeWidth={2} style={{ marginRight: 8 }} />
                {item.label}
                {item.badge && (
                  <span style={{ marginLeft: 'auto', background: 'var(--color-danger)', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', borderRadius: '10px', padding: '1px 6px' }}>{item.badge}</span>
                )}
              </NavLink>
            );
          })}
          
          {analyticsItems.length > 0 && (
            <>
              <div style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 700, letterSpacing: '0.05em', padding: '24px 12px 12px', textTransform: 'uppercase' }}>
                Analytics
              </div>
              {analyticsItems.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `sidebar-nav-item ${isActive ? 'active' : ''}`
                    }
                  >
                    <Icon size={20} strokeWidth={2} style={{ marginRight: 8 }} />
                    {item.label}
                  </NavLink>
                );
              })}
            </>
          )}
        </nav>

        {/* Bottom Graphic */}
        <div style={{ padding: '32px 24px', textAlign: 'center', background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(0, 210, 255, 0.05) 100%)', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ color: 'var(--color-primary)', marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
            <svg width="32" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"></path></svg>
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.5 }}>
            Clean Water.<br/>Safe Communities.<br/>A Healthier Future.
          </div>
          <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 16 }}>
            © 2025 JalRakshak. All rights reserved.
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="print-main" style={{ marginLeft: 260, marginTop: 72, flex: 1, padding: '32px', minHeight: 'calc(100vh - 72px)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {children}
        </div>
      </main>
      <div className="no-print">
        <JalDootChatbot />
      </div>
    </div>
  );
}
