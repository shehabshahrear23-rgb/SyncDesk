import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

// Returns e.g. "09:41 PM", or null if the timezone name is missing/invalid.
const formatTime = (date, timeZone) => {
  if (!timeZone) return null;
  try {
    return date.toLocaleTimeString('en-US', { timeZone, hour: '2-digit', minute: '2-digit' });
  } catch {
    return null; // RangeError for an unknown timezone
  }
};

// Shows the local time of a person, based on their stored IANA timezone (e.g. "Asia/Dhaka").
const LocalTimeDisplay = ({ timezone }) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // Update once a minute, no page refresh needed
    const timerId = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timerId); // cleanup when the card goes away
  }, []);

  const time = formatTime(now, timezone);

  return (
    <span
      title={timezone || 'Timezone not set'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        color: 'var(--text-muted)',
        fontVariantNumeric: 'tabular-nums'
      }}
    >
      <Clock size={13} color="var(--neon-cyan)" />
      <span style={{ color: time ? 'var(--text-main)' : 'var(--text-dim)', fontWeight: 600 }}>
        {time || 'Time unavailable'}
      </span>
      {time && <span style={{ color: 'var(--text-dim)' }}>{timezone}</span>}
    </span>
  );
};

export default LocalTimeDisplay;
