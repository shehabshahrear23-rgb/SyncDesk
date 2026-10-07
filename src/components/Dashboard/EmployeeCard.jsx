import React from 'react';
import { Mail, Settings } from 'lucide-react';

// One colour per role. Anything unexpected falls back to a neutral badge.
const ROLE_STYLES = {
  admin: { label: 'Admin', color: '#a855f7', background: 'rgba(168, 85, 247, 0.14)' },
  hr: { label: 'HR', color: 'var(--neon-cyan)', background: 'rgba(0, 240, 255, 0.12)' },
  employee: { label: 'Employee', color: 'var(--neon-green)', background: 'rgba(0, 230, 118, 0.12)' }
};

const FALLBACK_ROLE_STYLE = { color: 'var(--text-muted)', background: 'var(--bg-input)' };

const cleanText = (value) => (typeof value === 'string' ? value.trim() : '');

// onManage is optional: when given, the card shows a small "Manage" button.
const EmployeeCard = ({ user, onManage }) => {
  const name = cleanText(user?.name);
  const email = cleanText(user?.email);
  const roleKey = cleanText(user?.role).toLowerCase();

  const roleStyle = ROLE_STYLES[roleKey] || FALLBACK_ROLE_STYLE;
  const roleLabel = ROLE_STYLES[roleKey]?.label || roleKey || 'Unknown';

  // First letter of the name; fall back to the email, then to "?".
  // Array.from keeps non-Latin first letters (e.g. Bangla) intact.
  const initial = (Array.from(name || email)[0] || '?').toUpperCase();

  return (
    <div
      className="card-panel card-panel-hover"
      style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}
    >
      {/* Avatar */}
      <div
        aria-hidden="true"
        style={{
          width: '48px',
          height: '48px',
          flexShrink: 0,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: roleStyle.background,
          border: `1px solid ${roleStyle.color}`,
          color: roleStyle.color,
          fontSize: '18px',
          fontWeight: '800'
        }}
      >
        {initial}
      </div>

      {/* Name, email, role */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <h4
          title={name || undefined}
          style={{
            fontSize: '14px',
            fontWeight: '700',
            color: name ? 'var(--text-main)' : 'var(--text-muted)',
            fontStyle: name ? 'normal' : 'italic',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {name || 'Unnamed user'}
        </h4>

        <p
          title={email || undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginTop: '2px',
            minWidth: 0
          }}
        >
          <Mail size={12} style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {email || 'No email on file'}
          </span>
        </p>

        <span
          style={{
            display: 'inline-block',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginTop: '8px',
            padding: '3px 10px',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: '700',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            color: roleStyle.color,
            backgroundColor: roleStyle.background,
            border: `1px solid ${roleStyle.color}`
          }}
        >
          {roleLabel}
        </span>
      </div>

      {onManage && (
        <button
          type="button"
          onClick={() => onManage(user)}
          className="btn-secondary"
          aria-label={`Manage ${name || email || 'user'}`}
          style={{ fontSize: '11px', padding: '6px 10px', flexShrink: 0 }}
        >
          <Settings size={13} />
          <span>Manage</span>
        </button>
      )}
    </div>
  );
};

export default EmployeeCard;
