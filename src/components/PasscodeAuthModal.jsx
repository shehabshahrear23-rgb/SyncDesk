import React, { useState } from 'react';
import { ShieldCheck, Lock, Key, X, AlertCircle, CheckCircle } from 'lucide-react';

const PasscodeAuthModal = ({ isOpen, onClose, targetRole, onAuthenticateSuccess }) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  // Default Passcodes:
  // CEO Mode: "1234" or "CEO2026"
  // Employee Mode: "5678" or "EMP2026"
  const expectedPasscode = targetRole === 'ceo' ? ['1234', 'CEO2026'] : ['5678', 'EMP2026'];
  const roleName = targetRole === 'ceo' ? 'CEO Executive Suite' : 'Staff / Employee Workspace';

  const handleVerify = (e) => {
    e.preventDefault();
    if (expectedPasscode.includes(passcode.trim())) {
      setError('');
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setPasscode('');
        onAuthenticateSuccess(targetRole);
        onClose();
      }, 700);
    } else {
      setError(`Invalid passcode! Use ${targetRole === 'ceo' ? '1234' : '5678'} to unlock ${roleName}.`);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justify: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: 'var(--bg-card)',
        color: 'var(--text-main)',
        border: `1px solid ${targetRole === 'ceo' ? 'var(--warning-amber)' : 'var(--neon-green)'}`,
        borderRadius: '16px',
        padding: '28px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
        position: 'relative',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: targetRole === 'ceo' ? 'rgba(255, 149, 0, 0.15)' : 'rgba(0, 230, 118, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              border: `1px solid ${targetRole === 'ceo' ? 'rgba(255, 149, 0, 0.3)' : 'rgba(0, 230, 118, 0.3)'}`
            }}>
              <Lock size={20} color={targetRole === 'ceo' ? 'var(--warning-amber)' : 'var(--neon-green)'} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>Access Authentication Gate</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SyncDesk Security Verification</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Info Pill */}
        <div style={{
          backgroundColor: 'rgba(0,0,0,0.35)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 14px',
          marginBottom: '20px',
          fontSize: '12px',
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: '700', color: '#fff' }}>Target Access Role:</span>
            <span style={{ color: targetRole === 'ceo' ? 'var(--warning-amber)' : 'var(--neon-green)', fontWeight: '700' }}>
              {roleName}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
            💡 Demo Security Hint: Enter passcode <strong style={{ color: '#fff' }}>{targetRole === 'ceo' ? '1234' : '5678'}</strong> to verify access.
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(255, 59, 48, 0.15)',
            border: '1px solid var(--danger-red)',
            color: 'var(--danger-red)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '16px',
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

        {/* Success message */}
        {isSuccess && (
          <div style={{
            backgroundColor: 'rgba(0, 230, 118, 0.15)',
            border: '1px solid var(--neon-green)',
            color: 'var(--neon-green)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '16px',
            fontSize: '12px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle size={16} />
            <span>Passcode Verified! Unlocking {roleName}...</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Enter Security Passcode *
            </label>
            <div style={{ position: 'relative' }}>
              <Key size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="password"
                placeholder={targetRole === 'ceo' ? 'Passcode (Hint: 1234)' : 'Passcode (Hint: 5678)'}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                autoFocus
                required
                className="input-field"
                style={{ width: '100%', paddingLeft: '36px', letterSpacing: '2px', fontSize: '14px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{
                padding: '8px 20px',
                fontSize: '12px',
                backgroundColor: targetRole === 'ceo' ? 'var(--warning-amber)' : 'var(--neon-green)',
                color: '#101216',
                fontWeight: '700'
              }}
            >
              Verify Passcode & Unlock &rarr;
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasscodeAuthModal;
