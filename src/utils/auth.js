// Single source of truth for where the JWT lives in the browser.
// LoginPage writes it, AdminDashboard reads it, App.jsx clears it on logout.
export const TOKEN_KEY = 'syncdesk_token';

// localStorage can throw (private mode, blocked storage), so every access is guarded.
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable - the session just won't carry a token */
  }
};

export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* nothing to clear */
  }
};
