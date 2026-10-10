import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n/useT';

const GoogleG = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const loadGoogleScript = () =>
  new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
    const existing = document.getElementById('gsi-client');
    if (existing) {
      existing.addEventListener('load', resolve);
      existing.addEventListener('error', reject);
      return undefined;
    }
    const script = document.createElement('script');
    script.id = 'gsi-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
    return undefined;
  });

// "Continue with Google" — real Google OAuth 2.0.
// Clicking opens Google's own account chooser (prompt=select_account). Google returns an access token,
// the server checks it with Google (audience = our GOOGLE_CLIENT_ID, e-mail verified) and issues our JWT.
const GoogleButton = ({ onSuccess, onError }) => {
  const { googleLogin } = useAuth();
  const { t } = useT();
  const fallbackClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '369585855746-sho1sgjj03ugilk9huj51up30upajtqm.apps.googleusercontent.com';
  const [clientId, setClientId] = useState(fallbackClientId);
  const [busy, setBusy] = useState(false);
  const clientRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    api('/auth/google-config')
      .then((c) => !cancelled && setClientId(c.clientId || fallbackClientId))
      .catch(() => !cancelled && setClientId(fallbackClientId));
    return () => { cancelled = true; };
  }, [fallbackClientId]);

  // Prepare Google's token client in advance so the click opens the popup instantly (browsers block late popups).
  useEffect(() => {
    if (!clientId) return undefined;
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled) return;
        clientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile',
          prompt: 'select_account',
          callback: async (response) => {
            if (response.error || !response.access_token) {
              setBusy(false);
              if (response.error && response.error !== 'popup_closed') onError(t('auth.googleFailed'));
              return;
            }
            try {
              await googleLogin(response.access_token);
              onSuccess();
            } catch (err) {
              onError(err.message);
            } finally {
              setBusy(false);
            }
          },
          error_callback: () => setBusy(false)
        });
      })
      .catch(() => onError(t('auth.googleLoad')));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  if (clientId === undefined) return null;

  const click = () => {
    if (!clientId) return onError(t('auth.googleNotSet'));
    if (!clientRef.current) return onError(t('auth.googleLoad'));
    setBusy(true);
    clientRef.current.requestAccessToken({ prompt: 'select_account' });
    return undefined;
  };

  return (
    <button type="button" className="btn-google" onClick={click} disabled={busy} data-testid="google-signin">
      <GoogleG /> {busy ? t('auth.wait') : t('auth.google')}
    </button>
  );
};

export default GoogleButton;
