import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { getToken } from '../utils/auth';

// The server sends UTC times without a "Z", so add it before turning the text into a Date.
const formatTime = (text) => {
  const date = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(text) ? text : `${text}Z`);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const MESSAGES = {
  loading: 'Loading...',
  signin: 'Sign in with a backend account to see your notifications.',
  error: 'Could not load notifications.',
  empty: 'You have no notifications.'
};

// Dropdown opened by the bell in the header. Shows GET /api/notifications for the logged-in user.
const NotificationsPanel = ({ isOpen, onClose }) => {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | signin | error | ready

  useEffect(() => {
    if (!isOpen) return undefined;
    const token = getToken();
    if (!token) {
      setStatus('signin');
      return undefined;
    }
    let cancelled = false;
    setStatus('loading');
    fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error('request failed');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setItems(Array.isArray(data) ? data : []);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const note = status === 'ready' ? (items.length === 0 ? MESSAGES.empty : null) : MESSAGES[status];

  return (
    <div
      role="dialog"
      aria-label="Notifications"
      className="card-panel glass-panel"
      style={{ position: 'fixed', top: '72px', right: '24px', width: '340px', maxHeight: '70vh', overflowY: 'auto', zIndex: 60, padding: '16px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>
          <Bell size={15} color="var(--primary-accent)" /> Notifications
        </span>
        <button type="button" onClick={onClose} aria-label="Close notifications" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={16} />
        </button>
      </div>

      {note && <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{note}</p>}

      {status === 'ready' && items.map((item) => (
        <div key={item.id} style={{ display: 'flex', gap: '10px', padding: '10px 0', borderTop: '1px solid var(--border-color)' }}>
          <span style={{ width: '8px', height: '8px', marginTop: '5px', flexShrink: 0, borderRadius: '50%', backgroundColor: item.is_read ? 'transparent' : 'var(--neon-cyan)', boxShadow: item.is_read ? 'none' : '0 0 8px var(--neon-cyan)' }} />
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: item.is_read ? '400' : '700' }}>{item.message}</p>
            <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>{formatTime(item.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationsPanel;
