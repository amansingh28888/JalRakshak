import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Droplets,
  ShieldCheck,
  MapPin,
  BarChart3,
  ArrowRight,
  Users,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  FileText,
  LogIn
} from 'lucide-react';
import { getPublicStats, type PublicStats } from '../api';
import { SignInModal, type LoginRole } from '../components/auth/SignInModal';

export default function RootLanding() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PublicStats | null>(null);

  // Sign In Modal State
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const [signInRole, setSignInRole] = useState<LoginRole>('citizen');

  const openSignIn = (role: LoginRole = 'citizen') => {
    setSignInRole(role);
    setSignInModalOpen(true);
  };

  useEffect(() => {
    getPublicStats()
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#091428', color: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* ── Top Navigation Bar ────────────────────────────────────────── */}
      <header
        style={{
          height: '72px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(9, 20, 40, 0.92)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 clamp(16px, 4vw, 48px)',
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
            }}
          >
            <Droplets size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Jal<span style={{ color: '#38bdf8' }}>Rakshak</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
              Water Safety Platform
            </div>
          </div>
        </Link>

        {/* Quick Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            to="/citizen/dashboard"
            style={{
              padding: '8px 14px',
              fontSize: '0.9rem',
              color: '#cbd5e1',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 500,
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}
          >
            Dashboard
          </Link>
          <Link
            to="/citizen/map"
            style={{
              padding: '8px 14px',
              fontSize: '0.9rem',
              color: '#cbd5e1',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 500,
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}
          >
            Water Map
          </Link>
          <Link
            to="/citizen/alerts"
            style={{
              padding: '8px 14px',
              fontSize: '0.9rem',
              color: '#cbd5e1',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 500,
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}
          >
            Alerts
          </Link>
          <Link
            to="/citizen/explorer"
            style={{
              padding: '8px 14px',
              fontSize: '0.9rem',
              color: '#cbd5e1',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 500,
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}
          >
            Explorer
          </Link>

          {/* Sign In opens modal */}
          <button
            type="button"
            onClick={() => openSignIn('citizen')}
            style={{
              marginLeft: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(2, 132, 199, 0.35)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(2, 132, 199, 0.55)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 10px rgba(2, 132, 199, 0.35)';
            }}
          >
            <LogIn size={15} />
            <span>Sign In</span>
          </button>
        </nav>
      </header>

      {/* ── Hero Section ──────────────────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          padding: '80px 20px 60px',
          textAlign: 'center',
          maxWidth: '900px',
          margin: '0 auto',
        }}
      >
        {/* Compliance Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '9999px',
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            color: '#38bdf8',
            fontSize: '0.88rem',
            fontWeight: 600,
            marginBottom: '24px',
          }}
        >
          <ShieldCheck size={18} />
          <span>IS 10500:2012 Drinking Water Standards</span>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
            fontWeight: 800,
            lineHeight: 1.18,
            letterSpacing: '-0.03em',
            marginBottom: '22px',
            color: '#ffffff',
          }}
        >
          Clean & Safe Drinking Water <br />
          <span
            style={{
              background: 'linear-gradient(135deg, #38bdf8 0%, #60a5fa 50%, #93c5fd 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            For Every Community
          </span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
            color: '#cbd5e1',
            lineHeight: 1.65,
            maxWidth: '700px',
            margin: '0 auto 36px',
          }}
        >
          A unified national surveillance network monitoring water sources across India.
          Track laboratory samples, identify chemical contamination, and access instant safety advisories.
        </p>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '14px',
            marginBottom: '40px',
          }}
        >
          <button
            onClick={() => navigate('/citizen/dashboard')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 28px',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(2, 132, 199, 0.4)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(2, 132, 199, 0.6)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(2, 132, 199, 0.4)';
            }}
          >
            <span>Check Your Area</span>
            <ArrowRight size={18} />
          </button>

          <button
            onClick={() => navigate('/citizen/map')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 26px',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: 600,
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
              e.currentTarget.style.borderColor = '#38bdf8';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <MapPin size={18} style={{ color: '#38bdf8' }} />
            <span>Interactive Water Map</span>
          </button>
        </div>
      </section>

      {/* ── Key Stats Row ─────────────────────────────────────────────── */}
      <section style={{ maxWidth: '1100px', margin: '0 auto 60px', padding: '0 20px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
          }}
        >
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              background: '#0c1e3e',
              borderRadius: '16px',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#38bdf8', marginBottom: '4px' }}>
              {stats?.total_samples ? stats.total_samples.toLocaleString('en-IN') : '55,000+'}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 500 }}>
              Water Samples Tested
            </div>
          </div>

          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              background: '#0c1e3e',
              borderRadius: '16px',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#60a5fa', marginBottom: '4px' }}>
              {stats?.total_states ?? 36}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 500 }}>
              States & UTs Covered
            </div>
          </div>

          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              background: '#0c1e3e',
              borderRadius: '16px',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#93c5fd', marginBottom: '4px' }}>
              {stats?.total_districts ?? 533}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 500 }}>
              Districts Monitored
            </div>
          </div>

          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              background: '#0c1e3e',
              borderRadius: '16px',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#34d399', marginBottom: '4px' }}>
              {stats?.safe_percentage ? `${stats.safe_percentage}%` : '42.8%'}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 500 }}>
              Safe Drinking Index
            </div>
          </div>
        </div>
      </section>

      {/* ── Simple Role Portals ──────────────────────────────────────── */}
      <section style={{ maxWidth: '1100px', margin: '0 auto 70px', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
            Choose Your Portal
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '1rem' }}>
            Access tailored dashboards based on your role in the water safety network
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
          }}
        >
          {/* Card 1: Citizen */}
          <div
            style={{
              padding: '28px',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: '#0c1e3e',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
              transition: 'transform 0.2s, border-color 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = '#34d399';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
            }}
          >
            <div>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}
              >
                <Users size={24} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                Citizen Portal
              </h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '24px' }}>
                Look up water quality in your district, view recent lab test results, and check active contamination alerts.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link
                to="/citizen/dashboard"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#34d399',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                }}
              >
                <span>Explore Citizen Dashboard</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Card 2: Field Worker */}
          <div
            style={{
              padding: '28px',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: '#0c1e3e',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
              transition: 'transform 0.2s, border-color 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = '#38bdf8';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.25)';
            }}
          >
            <div>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}
              >
                <Briefcase size={24} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                Field Worker Portal
              </h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '24px' }}>
                Collect field samples, input field test kit (FTK) measurements, and record GPS verified water sources.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openSignIn('worker')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: '#38bdf8',
                fontWeight: 600,
                fontSize: '0.95rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <span>Worker Log In</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Card 3: Analyst & Admin */}
          <div
            style={{
              padding: '28px',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: '#0c1e3e',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
              transition: 'transform 0.2s, border-color 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = '#c084fc';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.25)';
            }}
          >
            <div>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(168, 85, 247, 0.15)',
                  color: '#c084fc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}
              >
                <BarChart3 size={24} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                Official & Analyst Portal
              </h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '24px' }}>
                State and district level analytics, chemical contamination trends, and laboratory audit management.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openSignIn('admin')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: '#c084fc',
                fontWeight: 600,
                fontSize: '0.95rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <span>Official Sign In</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Key Features / How it Works ───────────────────────────────── */}
      <section
        style={{
          maxWidth: '1100px',
          margin: '0 auto 70px',
          padding: '40px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
            Built for National Drinking Water Safety
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '1rem' }}>
            Ensuring every household receives water meeting Indian Standards
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
          }}
        >
          <div style={{ display: 'flex', gap: '16px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                IS 10500:2012 Compliance
              </h4>
              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.55 }}>
                Evaluates parameters including pH, TDS, Turbidity, Arsenic, Fluoride, and Coliform.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                Early Hazard Alerts
              </h4>
              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.55 }}>
                Instant notifications for chemical contamination and crucial 'Do Not Boil' warnings.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <MapPin size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                Geospatial Mapping
              </h4>
              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.55 }}>
                Interactive map displaying water quality safe zones and contamination hotspots.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(168, 85, 247, 0.15)',
                color: '#c084fc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FileText size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                Open Data & Reports
              </h4>
              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.55 }}>
                Transparent laboratory records accessible to citizens, researchers, and authorities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: '#060e1d',
          padding: '40px 20px',
          fontSize: '0.88rem',
          color: '#cbd5e1',
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Droplets size={20} style={{ color: '#38bdf8' }} />
            <div>
              <span style={{ fontWeight: 700, color: '#ffffff' }}>JalRakshak</span> — National Drinking Water Quality Surveillance
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link to="/citizen/dashboard" style={{ color: '#cbd5e1', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.color = '#ffffff'} onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}>
              Citizen Dashboard
            </Link>
            <Link to="/citizen/map" style={{ color: '#cbd5e1', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.color = '#ffffff'} onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}>
              Water Map
            </Link>
            <Link to="/citizen/alerts" style={{ color: '#cbd5e1', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.color = '#ffffff'} onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}>
              Alerts
            </Link>
            <button
              type="button"
              onClick={() => openSignIn('citizen')}
              style={{
                color: '#cbd5e1',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.88rem',
                padding: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
            >
              Sign In
            </button>
          </div>
        </div>

        <div
          style={{
            maxWidth: '1100px',
            margin: '20px auto 0',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            textAlign: 'center',
            fontSize: '0.8rem',
            color: '#94a3b8',
          }}
        >
          Department of Drinking Water & Sanitation · Jal Jeevan Mission · National Water Quality Monitoring
        </div>
      </footer>

      {/* ── Sign In Modal Window Box ──────────────────────────────────── */}
      <SignInModal
        isOpen={signInModalOpen}
        onClose={() => setSignInModalOpen(false)}
        defaultRole={signInRole}
      />
    </div>
  );
}
