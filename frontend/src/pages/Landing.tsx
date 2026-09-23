import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ShieldCheck, Globe2, Activity, ArrowRight, Droplets } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg)',
      color: 'var(--color-text)',
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle Background Elements */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '800px',
        background: 'linear-gradient(180deg, var(--color-primary-very-light) 0%, rgba(245, 251, 254, 0) 100%)',
        zIndex: 0
      }} />

      {/* Navigation */}
      <nav style={{
        padding: '24px 6vw',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 10,
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--color-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8,
            background: 'var(--color-primary-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-primary)'
          }}>
            <Droplets size={24} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.02em', color: 'var(--color-text)' }}>JalRakshak</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', letterSpacing: '0.05em', fontWeight: 500 }}>WATER GUARDIAN</div>
          </div>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => navigate('/dashboard')}
          style={{ padding: '10px 24px', fontSize: '0.95rem' }}
        >
          Launch Dashboard
          <ArrowRight size={18} />
        </button>
      </nav>

      {/* Hero Section */}
      <main style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '120px 20px',
        position: 'relative',
        zIndex: 10,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 16px',
          background: 'var(--color-primary-very-light)',
          border: '1px solid var(--color-primary-light)',
          borderRadius: 20,
          color: 'var(--color-primary)',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: 32,
          letterSpacing: '0.02em'
        }}>
          <ShieldCheck size={16} />
          IS 10500:2012 COMPLIANT
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
          fontWeight: 800,
          lineHeight: 1.15,
          marginBottom: 24,
          maxWidth: 900,
          color: 'var(--color-text)',
          letterSpacing: '-0.02em'
        }}>
          Professional Water Quality <br />
          <span style={{ color: 'var(--color-primary)' }}>
            Monitoring Platform
          </span>
        </h1>

        <p style={{
          fontSize: '1.15rem',
          color: 'var(--color-text-secondary)',
          maxWidth: 700,
          lineHeight: 1.6,
          marginBottom: 48,
          fontWeight: 400
        }}>
          JalRakshak accurately analyzes real-time water quality data against strict Indian Standards, 
          translating vital safety decisions into 14 local languages.
        </p>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn-primary"
            style={{ padding: '14px 32px', fontSize: '1rem' }}
          >
            Explore Dashboard
            <ArrowRight size={18} />
          </button>
          
          <button 
            onClick={() => window.open('https://github.com', '_blank')}
            className="btn-secondary"
            style={{ padding: '14px 32px', fontSize: '1rem' }}
          >
            View Architecture
          </button>
        </div>
      </main>

      {/* Features Section */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 32,
        padding: '40px 6vw 120px',
        maxWidth: 1400,
        margin: '0 auto',
        position: 'relative',
        zIndex: 10
      }}>
        {[
          {
            icon: ShieldCheck,
            title: 'Deterministic Rule Engine',
            desc: 'Critical safety classifications are made deterministically against scientific thresholds, ensuring absolute accuracy and zero hallucinations.'
          },
          {
            icon: Globe2,
            title: '14-Language Translation',
            desc: 'Complex technical data is dynamically translated into natural, easy-to-understand localized alerts for rural citizens.'
          },
          {
            icon: Activity,
            title: 'Verified Datasets',
            desc: 'Explore real-world water quality data spanning multiple states, districts, and water sources across India.'
          }
        ].map((feature, i) => {
          const Icon = feature.icon;
          return (
            <div key={i} className="card card-hover" style={{
              padding: 40,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              textAlign: 'left'
            }}>
              <div style={{ 
                padding: 12, 
                background: 'var(--color-primary-very-light)', 
                color: 'var(--color-primary)', 
                borderRadius: 12, 
                marginBottom: 24 
              }}>
                <Icon size={32} strokeWidth={1.5} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 16, color: 'var(--color-text)' }}>
                {feature.title}
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
                {feature.desc}
              </p>
            </div>
          );
        })}
      </section>
    </div>
  );
}
