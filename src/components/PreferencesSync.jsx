import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings, buildPrefs } from '../context/SettingsContext';
import { api } from '../api/client';

// Keeps language / font size / theme in step with the user's account in the database:
//  • after sign-in the saved settings are applied;
//  • when the user changes a setting while signed in, it is saved to the database.
const PreferencesSync = () => {
  const { user } = useAuth();
  const { prefs, applyRemote } = useSettings();
  const saved = useRef(null); // JSON of what the server already has
  const waiting = useRef(null); // JSON we expect after applying the server's settings
  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      saved.current = null;
      waiting.current = null;
      return;
    }
    if (user.preferences) {
      const target = JSON.stringify(buildPrefs({ ...prefs, ...user.preferences }));
      saved.current = target;
      waiting.current = target;
      applyRemote(user.preferences);
    } else {
      saved.current = ''; // nothing saved yet: the current settings are uploaded below
      waiting.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (!userId || saved.current === null) return undefined;
    const current = JSON.stringify(prefs);
    if (waiting.current) {
      if (current === waiting.current) waiting.current = null;
      return undefined;
    }
    if (current === saved.current) return undefined;
    const timer = setTimeout(() => {
      api('/auth/preferences', { method: 'PATCH', body: prefs })
        .then(() => { saved.current = current; })
        .catch(() => {}); // stays on this device if the server is unreachable
    }, 500);
    return () => clearTimeout(timer);
  }, [prefs, userId]);

  return null;
};

export default PreferencesSync;
