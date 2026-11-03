import React, { useEffect, useState } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { getToken } from '../utils/auth';

const REFRESH_INTERVAL_MS = 30_000;

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
  empty: 'You have no notifications.',
  readError: 'Could not update this notification.'
};

const NotificationsPanel = ({
  isOpen,
  onClose,
  onUnreadCountChange
}) => {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState(() => getToken() ? 'loading' : 'signin');
  const [updatingId, setUpdatingId] = useState(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      onUnreadCountChange(0);
      return undefined;
    }

    const controller = new AbortController();

    const loadNotifications = async () => {
      try {
        const response = await fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        });
        if (!response.ok) throw new Error('Notification request failed');

        const data = await response.json();
        if (!controller.signal.aborted) {
          const notifications = Array.isArray(data) ? data : [];
          setItems(notifications);
          onUnreadCountChange(notifications.filter((item) => !item.is_read).length);
          setStatus('ready');
        }
      } catch {
        if (!controller.signal.aborted) setStatus('error');
      }
    };

    loadNotifications();
    const intervalId = window.setInterval(loadNotifications, REFRESH_INTERVAL_MS);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [isOpen, onUnreadCountChange]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const markAsRead = async (notificationId) => {
    const token = getToken();
    if (!token) {
      setActionError(MESSAGES.signin);
      return;
    }

    setUpdatingId(notificationId);
    setActionError('');
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Notification update failed');

      const wasUnread = items.some((item) => item.id === notificationId && !item.is_read);
      setItems((currentItems) => {
        return currentItems.map((item) =>
          item.id === notificationId ? { ...item, is_read: true } : item
        );
      });
      if (wasUnread) onUnreadCountChange((count) => Math.max(0, count - 1));
    } catch {
      setActionError(MESSAGES.readError);
    } finally {
      setUpdatingId(null);
    }
  };

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
      {actionError && (
        <p role="alert" style={{ fontSize: '12px', color: 'var(--danger-red)', marginBottom: '10px' }}>
          {actionError}
        </p>
      )}

      {status === 'ready' && items.map((item) => (
        <div key={item.id} style={{ display: 'flex', gap: '10px', padding: '10px 0', borderTop: '1px solid var(--border-color)' }}>
          <span aria-hidden="true" style={{ width: '8px', height: '8px', marginTop: '5px', flexShrink: 0, borderRadius: '50%', backgroundColor: item.is_read ? 'transparent' : 'var(--neon-cyan)', boxShadow: item.is_read ? 'none' : '0 0 8px var(--neon-cyan)' }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: item.is_read ? '400' : '700' }}>{item.message}</p>
            <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>{formatTime(item.created_at)}</p>
          </div>
          {!item.is_read && (
            <button
              type="button"
              onClick={() => markAsRead(item.id)}
              disabled={updatingId === item.id}
              aria-label="Mark notification as read"
              title="Mark as read"
              style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', color: 'var(--text-muted)', padding: '4px 6px', cursor: updatingId === item.id ? 'wait' : 'pointer', fontSize: '10px', flexShrink: 0 }}
            >
              <Check size={12} />
              Read
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default NotificationsPanel;
