import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import {
  X,
  Users,
  Droplets,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export type LoginRole = 'citizen' | 'worker' | 'admin';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: LoginRole;
}

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'citizen',
}) => {
  const navigate = useNavigate();
  const [role, setRole] = useState<LoginRole>(defaultRole);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRole(defaultRole);
      setError(null);
      setShowForgotPassword(false);
    }
  }, [isOpen, defaultRole]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please provide both email address and password.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('email not confirmed')) {
          throw new Error('Please check your email and verify your account before logging in.');
        } else if (authError.message.toLowerCase().includes('invalid login credentials')) {
          throw new Error('Invalid email or password. Please verify your credentials and try again.');
        }
        throw authError;
      }

      if (!data.session) {
        throw new Error('Authentication failed. No active session established.');
      }

      // Close modal and navigate
      onClose();
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else if (role === 'worker') {
        navigate('/worker/dashboard');
      } else {
        navigate('/citizen/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Incorrect email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/citizen/setup',
        },
      });
      if (googleError) throw googleError;
    } catch (err: any) {
      setError(err.message || 'Google sign-in could not be completed. Please try again.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError(null);
    setResetSuccess(null);

    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: window.location.origin + '/login',
      });
      if (resetErr) throw resetErr;
      setResetSuccess('Password reset link sent! Please check your inbox.');
    } catch (err: any) {
      setResetError(err.message || 'Failed to send reset link. Please check the email entered.');
    } finally {
      setResetLoading(false);
    }
  };

  const roleMeta = {
    citizen: {
      name: 'Citizen',
      tagline: 'Access local water reports & safety alerts',
      icon: Users,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.15)',
      borderColor: 'rgba(16, 185, 129, 0.4)',
      placeholder: 'citizen@example.com',
      buttonBg: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    },
    worker: {
      name: 'Field Worker',
      tagline: 'Record FTK tests and upload field samples',
      icon: Droplets,
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.15)',
      borderColor: 'rgba(56, 189, 248, 0.4)',
      placeholder: 'worker@jalrakshak.gov.in',
      buttonBg: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
    },
    admin: {
      name: 'Administrator',
      tagline: 'Manage surveillance, workers & system logs',
      icon: ShieldCheck,
      color: '#a855f7',
      bg: 'rgba(168, 85, 247, 0.15)',
      borderColor: 'rgba(168, 85, 247, 0.4)',
      placeholder: 'admin@jalrakshak.gov.in',
      buttonBg: 'linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)',
    },
  };

  const currentMeta = roleMeta[role];
  const IconComponent = currentMeta.icon;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(3, 7, 18, 0.75)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal Window Box */}
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          border: '1px solid rgba(14, 165, 233, 0.25)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
          fontFamily: 'Inter, system-ui, sans-serif',
          color: '#0c2340',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid rgba(14, 165, 233, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, #e0f2fe 0%, #f0f9ff 100%)',
          }}
        >
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0c2340', letterSpacing: '-0.02em' }}>
              Sign In to JalRakshak
            </div>
            <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '2px' }}>
              Select your role to access your dedicated portal
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'rgba(14, 165, 233, 0.06)',
              border: 'none',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = '#cbd5e1';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Role Selector Tabs ────────────────────────────────────────── */}
        <div style={{ padding: '16px 24px 0' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              background: '#f0f9ff',
              padding: '4px',
              borderRadius: '12px',
              border: '1px solid rgba(14, 165, 233, 0.12)',
            }}
          >
            {/* Citizen Tab */}
            <button
              type="button"
              onClick={() => {
                setRole('citizen');
                setError(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 8px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                background: role === 'citizen' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                color: role === 'citizen' ? '#059669' : '#64748b',
                boxShadow: role === 'citizen' ? '0 2px 8px rgba(16, 185, 129, 0.2)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <Users size={16} />
              <span>Citizen</span>
            </button>

            {/* Worker Tab */}
            <button
              type="button"
              onClick={() => {
                setRole('worker');
                setError(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 8px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                background: role === 'worker' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                color: role === 'worker' ? '#0284c7' : '#64748b',
                boxShadow: role === 'worker' ? '0 2px 8px rgba(56, 189, 248, 0.2)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <Droplets size={16} />
              <span>Worker</span>
            </button>

            {/* Admin Tab */}
            <button
              type="button"
              onClick={() => {
                setRole('admin');
                setError(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 8px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                background: role === 'admin' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                color: role === 'admin' ? '#7c3aed' : '#64748b',
                boxShadow: role === 'admin' ? '0 2px 8px rgba(168, 85, 247, 0.2)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <ShieldCheck size={16} />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* ── Active Role Banner ────────────────────────────────────────── */}
        <div style={{ padding: '16px 24px 8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: currentMeta.bg,
              border: `1px solid ${currentMeta.borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: currentMeta.color,
              flexShrink: 0,
            }}
          >
            <IconComponent size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#0c2340' }}>
              {currentMeta.name} Login
            </div>
            <div style={{ fontSize: '0.78rem', color: '#475569' }}>
              {currentMeta.tagline}
            </div>
          </div>
        </div>

        {/* ── Content Form ─────────────────────────────────────── */}
        <div style={{ padding: '8px 24px 24px' }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '8px',
                color: '#b91c1c',
                fontSize: '0.85rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                lineHeight: 1.45,
              }}
            >
              <AlertTriangle size={16} style={{ marginTop: 2, flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {showForgotPassword ? (
            /* Forgot password form */
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  background: 'rgba(14, 165, 233, 0.07)',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  color: '#475569',
                  lineHeight: 1.5,
                }}
              >
                Enter your account email to receive a password reset link.
              </div>

              {resetSuccess && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    color: '#065f46',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>{resetSuccess}</span>
                </div>
              )}

              {resetError && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    color: '#b91c1c',
                    fontSize: '0.85rem',
                  }}
                >
                  {resetError}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  placeholder="name@jalrakshak.gov.in"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: '#f0f9ff',
                    color: '#0c2340',
                    fontSize: '0.92rem',
                    outline: 'none',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = currentMeta.color)}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)')}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  type="submit"
                  disabled={resetLoading}
                  style={{
                    flex: 1,
                    padding: '11px',
                    background: currentMeta.buttonBg,
                    color: '#0c2340',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    cursor: resetLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {resetLoading ? <Loader2 size={16} className="animate-spin" /> : 'Send Reset Link'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  style={{
                    padding: '11px 16px',
                    background: 'rgba(14, 165, 233, 0.06)',
                    color: '#475569',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            /* Standard Login Form */
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={currentMeta.placeholder}
                  required
                  autoComplete="email"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: '#f0f9ff',
                    color: '#0c2340',
                    fontSize: '0.92rem',
                    outline: 'none',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = currentMeta.color)}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)')}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: currentMeta.color,
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    style={{
                      width: '100%',
                      padding: '10px 42px 10px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: '#f0f9ff',
                      color: '#0c2340',
                      fontSize: '0.92rem',
                      outline: 'none',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = currentMeta.color)}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: currentMeta.buttonBg,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: '4px',
                  boxShadow: `0 4px 16px ${currentMeta.bg}`,
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In as {currentMeta.name}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {/* ── Continue with Google ── */}
              <div style={{ display: 'flex', alignItems: 'center', margin: '6px 0 2px' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(14, 165, 233, 0.2)' }}></div>
                <span style={{ padding: '0 12px', color: '#64748b', fontSize: '0.78rem', fontWeight: 600 }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(14, 165, 233, 0.2)' }}></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  background: '#ffffff',
                  color: '#0f172a',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                  transition: 'background 0.15s, transform 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </button>
            </form>
          )}

          {/* Bottom helper */}
          <div
            style={{
              marginTop: '18px',
              paddingTop: '14px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              textAlign: 'center',
              fontSize: '0.82rem',
              color: '#475569',
            }}
          >
            {role === 'citizen' ? (
              <div>
                <span>New citizen? </span>
                <Link
                  to="/citizen/register"
                  onClick={onClose}
                  style={{ color: '#34d399', fontWeight: 600, textDecoration: 'none' }}
                >
                  Create Citizen Account
                </Link>
              </div>
            ) : (
              <span style={{ color: '#64748b', fontSize: '0.78rem' }}>
                Authorized JalRakshak personnel only. Contact administrative nodal officer for account provisioning.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
