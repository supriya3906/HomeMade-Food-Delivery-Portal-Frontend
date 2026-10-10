import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useT } from '../../i18n/useT';
import { LANGUAGES } from '../../i18n/translations';

// Theme, language, font size, font style. Shared by the Settings page and the
// Settings drawer on the sign-in page, so both stay in sync.
const FONT_OPTIONS = [
  { id: 'sm', key: 'set.small', size: '0.8rem' },
  { id: 'md', key: 'set.medium', size: '0.95rem' },
  { id: 'lg', key: 'set.large', size: '1.1rem' },
  { id: 'xl', key: 'set.xl', size: '1.25rem' }
];

const FONT_STYLES = [
  { id: 'default', key: 'set.fontDefault', family: "'Plus Jakarta Sans', 'Noto Sans Tamil', sans-serif" },
  { id: 'rounded', key: 'set.fontRounded', family: "'Nunito', 'Noto Sans Tamil', sans-serif" },
  { id: 'classic', key: 'set.fontClassic', family: "'Merriweather', 'Noto Serif Tamil', Georgia, serif" },
  { id: 'clean', key: 'set.fontClean', family: "'Poppins', 'Noto Sans Tamil', sans-serif" }
];

const AppearanceSection = () => {
  const { theme, setTheme, language, setLanguage, fontSize, setFontSize, fontStyle, setFontStyle } = useSettings();
  const { t } = useT();
  return (
    <section className="settings-section">
      <h2>{t('set.appearance')}</h2>

      <div className="settings-row">
        <div>
          <p className="settings-row-title">{t('set.theme')}</p>
          <p className="muted">{t('set.themeDesc')}</p>
        </div>
        <div className="segmented">
          <button type="button" className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}>
            <Sun size={14} /> {t('set.light')}
          </button>
          <button type="button" className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}>
            <Moon size={14} /> {t('set.dark')}
          </button>
        </div>
      </div>

      <div className="settings-row">
        <div>
          <p className="settings-row-title">{t('set.language')}</p>
          <p className="muted">{t('set.languageDesc')}</p>
        </div>
        <div className="segmented" role="radiogroup" aria-label={t('set.language')}>
          {LANGUAGES.map((l) => (
            <button key={l.code} type="button" role="radio" aria-checked={language === l.code} className={language === l.code ? 'active' : ''} onClick={() => setLanguage(l.code)}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-row">
        <div>
          <p className="settings-row-title">{t('set.fontSize')}</p>
          <p className="muted">{t('set.fontDesc')}</p>
        </div>
        <div className="segmented font-size-picker" role="radiogroup" aria-label={t('set.fontSize')}>
          {FONT_OPTIONS.map((o) => (
            <button key={o.id} type="button" role="radio" aria-checked={fontSize === o.id} className={fontSize === o.id ? 'active' : ''} onClick={() => setFontSize(o.id)} title={t(o.key)} aria-label={t(o.key)}>
              <span style={{ fontSize: o.size }}>A</span>
            </button>
          ))}
        </div>
      </div>

      <div className="settings-row">
        <div>
          <p className="settings-row-title">{t('set.fontStyle')}</p>
          <p className="muted">{t('set.fontStyleDesc')}</p>
        </div>
        <div className="segmented font-style-picker" role="radiogroup" aria-label={t('set.fontStyle')}>
          {FONT_STYLES.map((f) => (
            <button key={f.id} type="button" role="radio" aria-checked={fontStyle === f.id} className={fontStyle === f.id ? 'active' : ''} onClick={() => setFontStyle(f.id)}>
              <span style={{ fontFamily: f.family }}>{t(f.key)}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AppearanceSection;
