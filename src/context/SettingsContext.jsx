import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { readJSON, writeJSON } from '../utils/storage';

const SettingsContext = createContext(null);
const SETTINGS_KEY = 'hmf_settings';

const defaultSettings = {
  theme: 'light', // 'light' | 'dark'
  language: 'en', // see i18n/translations.js
  fontSize: 'md', // 'sm' | 'md' | 'lg' | 'xl'
  fontStyle: 'default', // 'default' | 'rounded' | 'classic' | 'clean'
  notifications: true
};

export const FONT_SCALE = { sm: '87.5%', md: '100%', lg: '112.5%', xl: '125%' };

// The settings that are saved on the user's account (same order every time).
export const buildPrefs = (s) => ({
  theme: s.theme, language: s.language, fontSize: s.fontSize, fontStyle: s.fontStyle, notifications: !!s.notifications
});

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => ({ ...defaultSettings, ...readJSON(SETTINGS_KEY, {}) }));

  useEffect(() => {
    writeJSON(SETTINGS_KEY, settings);
    const root = document.documentElement;
    root.setAttribute('data-theme', settings.theme);
    root.setAttribute('lang', settings.language);
    root.style.fontSize = FONT_SCALE[settings.fontSize] || '100%';
    root.setAttribute('data-font', settings.fontStyle || 'default');
  }, [settings]);

  const set = (key) => (value) => setSettings((prev) => ({ ...prev, [key]: value }));
  const setTheme = useCallback(set('theme'), []);
  const setLanguage = useCallback(set('language'), []);
  const setFontSize = useCallback(set('fontSize'), []);
  const setFontStyle = useCallback(set('fontStyle'), []);
  const toggleNotifications = useCallback(() => setSettings((p) => ({ ...p, notifications: !p.notifications })), []);
  const resetSettings = useCallback(() => setSettings(defaultSettings), []);
  // Adopt the settings saved on the account after signing in.
  const applyRemote = useCallback((remote) => setSettings((prev) => ({ ...prev, ...buildPrefs({ ...prev, ...remote }) })), []);

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        prefs: buildPrefs(settings),
        setTheme, setLanguage, setFontSize, setFontStyle, toggleNotifications, resetSettings, applyRemote
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};

export default SettingsContext;
