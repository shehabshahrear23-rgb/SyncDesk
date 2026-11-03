import React from 'react';
import './StatusIndicator.css';

const LABELS = { online: 'Online', away: 'Away', offline: 'Offline' };

// Any status we do not know (for example the old demo value "in-meeting") shows as Away.
// Missing or empty status shows as Offline.
export const normalizeStatus = (status) => {
  if (!status) return 'offline';
  const value = String(status).toLowerCase();
  if (value === 'online' || value === 'away' || value === 'offline') return value;
  return 'away';
};

// A small glowing light. size is in pixels; showLabel adds the word next to it.
const StatusIndicator = ({ status, size = 10, showLabel = false, calm = false }) => {
  const key = normalizeStatus(status);

  return (
    <span
      role="img"
      aria-label={`Status: ${LABELS[key]}`}
      title={LABELS[key]}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
    >
      <span
        className={`presence-light presence-light--${key}${calm ? ' presence-light--calm' : ''}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      />
      {showLabel && <span className={`presence-label presence-label--${key}`}>{LABELS[key]}</span>}
    </span>
  );
};

export default StatusIndicator;
