import { useEffect } from 'react';
import { getToken } from '../utils/auth';

const HEARTBEAT_MS = 60 * 1000; // every 60 seconds

// Tell the backend our status. Needs a valid JWT; without one we do nothing.
// Errors are ignored on purpose: a missed heartbeat must never break the app,
// and the backend marks us offline by itself if we go quiet.
export const sendStatus = (status, options = {}) => {
  const token = getToken();
  if (!token) return Promise.resolve(null);

  let timezone;
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; // e.g. "Asia/Dhaka"
  } catch {
    timezone = undefined;
  }

  return fetch('/api/users/me/status', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status, timezone }),
    keepalive: options.keepalive === true
  }).catch(() => null);
};

// Call once in App. Runs only while the user is logged in AND has a JWT.
export default function usePresence(isAuthenticated) {
  useEffect(() => {
    if (!isAuthenticated || !getToken()) return undefined;

    const currentStatus = () => (document.hasFocus() ? 'online' : 'away');

    sendStatus(currentStatus()); // first heartbeat right away
    const intervalId = setInterval(() => sendStatus(currentStatus()), HEARTBEAT_MS);

    const handleBlur = () => sendStatus('away');   // user switched to another window/tab
    const handleFocus = () => sendStatus('online'); // user came back
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated]);
}
