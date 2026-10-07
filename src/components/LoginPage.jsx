import React, { useState } from 'react';
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ArrowRight,
  AlertCircle,
  Terminal,
  Activity,
  KeyRound,
  Cpu
} from 'lucide-react';
import { authenticateUser, userDatabase } from '../data/userDatabase';
import { setToken, clearToken } from '../utils/auth';

// Display details for accounts that come from the backend (admin / hr / employee)
const BACKEND_ROLE_DETAILS = {
  admin: { roleLabel: 'Web Administrator', dashboardTitle: 'Web Administrator Console & Company Directory' },
  hr: { roleLabel: 'HR Manager', dashboardTitle: 'HR & People Operations Dashboard' },
  employee: { roleLabel: 'Employee', dashboardTitle: 'My Workspace Dashboard' }
};

// Letter avatar as an inline SVG, so anything rendering <img src={user.avatar}> still works
const buildInitialAvatar = (name) => {
  const initial = (Array.from((name || '').trim())[0] || '?').toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#007aff"/><text x="48" y="50" font-family="Arial, sans-serif" font-size="44" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${initial}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

// Give a backend user the same shape the rest of the app expects from userDatabase.
// If the same email is also a demo account, its photo, name and title are kept,
// while id, email and role always come from the backend.
const buildSessionUser = (apiUser) => {
  const demoProfile = userDatabase.find(
    (demo) => String(demo?.email ?? '').toLowerCase() === String(apiUser.email ?? '').toLowerCase()
  );
  return {
    ...apiUser,
    ...(BACKEND_ROLE_DETAILS[apiUser.role] || { roleLabel: apiUser.role }),
    avatar: buildInitialAvatar(apiUser.name || apiUser.email),
    ...(demoProfile
      ? {
          name: demoProfile.name || apiUser.name,
          roleLabel: demoProfile.roleLabel || BACKEND_ROLE_DETAILS[apiUser.role]?.roleLabel || apiUser.role,
          avatar: demoProfile.avatar || buildInitialAvatar(apiUser.name || apiUser.email)
        }
      : {}),
    id: apiUser.id,
    email: apiUser.email,
    role: apiUser.role
  };
};

const LoginPage = ({ onLogin, theme, onToggleTheme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [clickEffect, setClickEffect] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both your email address and password.');
      return;
    }

    setClickEffect(true);
    setIsLoading(true);

    setTimeout(async () => {
      try {
        // 1. Convert credentials to URL-encoded Form Data
        const formData = new URLSearchParams();
        formData.append('username', email); // FastAPI OAuth2 strictly expects "username"
        formData.append('password', password);

        // 2. Send as application/x-www-form-urlencoded
        const response = await fetch('http://127.0.0.1:8000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData,
        });

        const data = await response.json();

        setIsLoading(false);
        setClickEffect(false);

        if (response.ok) {
          // Save the real JWT token to local storage so the session persists
          localStorage.setItem('syncdesk_token', data.access_token);
          
          // Send the real database user profile back to App.jsx
          onLogin(data.user);
        } else {
          // Read the exact error detail sent by FastAPI (e.g., 401 Unauthorized)
          setError(data.detail || 'Invalid email or password credentials.');
        }
      } catch (err) {
        setIsLoading(false);
        setClickEffect(false);
        setError('Server Connection Error: Is your FastAPI backend running on port 8000?');
      }
    }, 600);
  };

  const handleFillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('1234');
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justify: 'center',
      backgroundColor: 'var(--bg-dark)',
      color: 'var(--text-main)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'background-color 0.3s ease, color 0.3s ease'
    }}>
      {/* Futuristic Animated Cyber Grid Background */}
      <div className="cyber-grid-bg" />

      {/* Top Floating Telemetry Status Bar */}
      <div style={{
        position: 'absolute',
        top: '24px',
        left: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        zIndex: 10,
        fontSize: '11px',
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--bg-card)', padding: '6px 12px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div className="pulse-dot pulse-dot-green" />
          <span>SYS_STATUS: <strong style={{ color: 'var(--neon-green)' }}>ONLINE</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--bg-card)', padding: '6px 12px', borderRadius: '16px', border: '1px solid var(--border-color)' }} className="theme-text-hide">
          <Terminal size={12} color="var(--neon-cyan)" />
          <span>SECURITY: <strong style={{ color: 'var(--neon-cyan)' }}>AES-256 QUANTUM</strong></span>
        </div>
      </div>

      {/* Top Bar Theme Switcher */}
      <div style={{
        position: 'absolute',
        top: '24px',
        right: '24px',
        zIndex: 10
      }}>
        <button
          onClick={onToggleTheme}
          className="cyber-click-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color-highlight)',
            color: 'var(--text-main)',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-glow)',
            transition: 'var(--transition)'
          }}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={15} color="var(--warning-amber)" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon size={15} color="var(--neon-cyan)" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Centered Ultra-Executive Portal Card (Firm & Stable Layout) */}
      <div
        className="cyber-hud-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          margin: '0 auto',
          alignSelf: 'center',
          padding: '42px 36px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 5,
          boxShadow: clickEffect ? '0 0 50px rgba(0, 240, 255, 0.4)' : '0 30px 80px -15px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* HUD Tech Chassis Corner Brackets */}
        <div className="hud-corner hud-corner-tl" />
        <div className="hud-corner hud-corner-tr" />
        <div className="hud-corner hud-corner-bl" />
        <div className="hud-corner hud-corner-br" />

        {/* Brand Header & Shield Icon */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div className="glow-ring-spin" style={{ display: 'inline-block', marginBottom: '14px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #007aff 0%, #00f0ff 100%)',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              boxShadow: '0 0 25px rgba(0, 240, 255, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              <ShieldCheck size={30} color="#ffffff" />
            </div>
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', color: 'var(--text-main)' }}>
            Sync<span style={{ color: 'var(--neon-cyan)' }}>Desk</span>
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Enterprise Workspace Portal
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(255, 59, 48, 0.12)',
            border: '1px solid var(--danger-red)',
            color: 'var(--danger-red)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '20px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '6px', textAlign: 'left' }}>
              Work Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--neon-cyan)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field cyber-input"
                style={{ width: '100%', paddingLeft: '42px', height: '44px', fontSize: '13px', borderRadius: '8px' }}
                required
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)' }}>
                Password / Security Passcode
              </label>
              <a href="#forgot" onClick={(e) => e.preventDefault()} style={{ fontSize: '11px', color: 'var(--neon-cyan)', textDecoration: 'none', fontWeight: '600' }}>
                Forgot key?
              </a>
            </div>
            <div style={{ position: 'relative' }}>
              <KeyRound size={16} color="var(--neon-cyan)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field cyber-input"
                style={{ width: '100%', paddingLeft: '42px', paddingRight: '42px', height: '44px', fontSize: '13px', borderRadius: '8px' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" id="remember" defaultChecked style={{ accentColor: 'var(--neon-cyan)', cursor: 'pointer' }} />
            <label htmlFor="remember" style={{ fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}>
              Remember session for 30 days
            </label>
          </div>

          {/* High-Impact Interactive Click Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary cyber-click-btn"
            style={{
              width: '100%',
              height: '46px',
              fontSize: '14px',
              fontWeight: '700',
              justifyContent: 'center',
              borderRadius: '8px',
              letterSpacing: '0.5px'
            }}
          >
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} className="spin" color="#fff" />
                <span>AUTHENTICATING TELEMETRY...</span>
              </div>
            ) : (
              <>
                <span>Sign In to Workspace</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        {/* Demo Role Selector Grid */}
        <div style={{
          marginTop: '26px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
            <Cpu size={13} color="var(--neon-cyan)" />
            <span>QUICK DEMO ACCOUNTS:</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
            {userDatabase.map(user => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleFillDemo(user.email)}
                className="cyber-click-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'var(--transition)'
                }}
              >
                <img src={user.avatar} alt={user.name} style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--neon-cyan)' }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.roleLabel}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;