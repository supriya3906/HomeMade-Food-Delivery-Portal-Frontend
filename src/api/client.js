// Tiny fetch wrapper for the Rasoi API. Adds the login token and turns
// error responses into Error objects carrying the server's message.
import { translateServerMessage } from '../i18n/serverMessages';

const BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'hmf_token';

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* storage unavailable */ }
};

// The website language is saved by SettingsContext; read it so API errors follow it.
const currentLanguage = () => {
  try { return JSON.parse(localStorage.getItem('hmf_settings') || '{}').language || 'en'; } catch { return 'en'; }
};

export async function api(path, { method = 'GET', body } = {}) {
  const token = getToken();
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new Error(translateServerMessage('Cannot reach the server. Make sure the backend is running (cd backend && npm start).', currentLanguage()));
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(translateServerMessage(data.message || 'Something went wrong. Please try again.', currentLanguage()));
    err.status = res.status;
    throw err;
  }
  return data;
}
