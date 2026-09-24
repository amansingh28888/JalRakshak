import { NavLink, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Search, Map as MapIcon, Bell, Database, Info, LogOut, FileText, UserCircle, PlusCircle, Users } from 'lucide-react';
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
  let portalName = "JalRakshak";
  let portalSub = "Water Quality Portal";


  if (path.startsWith('/admin')) {
    portalName = "Admin Portal";
    portalSub = "JalRakshak Management";

    navItems = [
      { to: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
      { to: '/admin/samples', label: 'All Samples', icon: Search },
      { to: '/admin/data', label: 'Data Management', icon: Database },
      { to: '/admin/workers', label: 'Field Workers', icon: Users },
      { to: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
    ];
  } else if (path.startsWith('/worker')) {
    portalName = "Worker Portal";
    portalSub = "Field Worker Portal";

    navItems = [
      { to: '/worker/dashboard', label: 'Worker Dashboard', icon: LayoutDashboard },
      { to: '/worker/collect', label: 'Collect Sample', icon: PlusCircle },
      { to: '/worker/samples', label: 'My Samples', icon: FileText },
      { to: '/worker/profile', label: 'My Profile', icon: UserCircle },
    ];
  } else {
    // Citizen Portal
    portalName = "Citizen Access";
    portalSub = "Citizen Portal";

    navItems = [
      { to: '/citizen/dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
      { to: '/citizen/explorer', label: 'Water Quality Explorer', icon: Search },
      { to: '/citizen/map', label: 'Interactive Map', icon: MapIcon },
      { to: '/citizen/alerts', label: 'Alert Center', icon: Bell },
      { to: '/citizen/about', label: 'About JalRakshak', icon: Info },
    ];
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg-soft)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 260,
        minHeight: '100vh',
        background: 'var(--color-bg)',
        borderRight: '1px solid var(--color-border)',
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
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img
                src="/logo.png"
                alt="JalRakshak Logo"
                style={{ width: 40, height: 40, objectFit: 'contain', flexShrink: 0 }}
              />
              <div>
                <div style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text)' }}>
                  {portalName}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', letterSpacing: '0.02em', fontWeight: 500 }}>
                  {portalSub}
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.05em', padding: '8px 8px 12px', textTransform: 'uppercase' }}>
            Navigation
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-nav-item ${isActive ? 'active' : ''}`
                }
                style={{ marginBottom: 4 }}
              >
                <Icon size={18} strokeWidth={2} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {user ? (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCircle size={18} />
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {profile?.full_name || user.email}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                  {profile?.role === 'admin' ? 'Administrator' : 'Field Worker'}
                </div>
              </div>
            </div>
            <button onClick={() => signOut()} className="btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px', fontSize: '0.85rem' }}>
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        ) : (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)' }}>
            <Link to="/login" className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px', fontSize: '0.85rem', textDecoration: 'none', boxSizing: 'border-box' }}>
              Sign In
            </Link>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '20px', borderTop: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-text-secondary)', background: 'var(--color-bg-soft)' }}>
          <div>National Water Quality Portal</div>
          <div style={{ marginTop: 4 }}>Version 1.0</div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 260, flex: 1, minHeight: '100vh', padding: '32px 40px', maxWidth: 'calc(100vw - 260px)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {children}
      </main>
      <JalDootChatbot />
    </div>
  );
}
