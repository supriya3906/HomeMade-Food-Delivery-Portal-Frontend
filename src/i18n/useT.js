import { useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';
import { translations } from './translations';

// const { t } = useT();   t('menu.title')   t('menu.found', { n: 5 })
export const useT = () => {
  const { language } = useSettings();
  const t = useCallback(
    (key, vars) => {
      let text = translations[language]?.[key] ?? translations.en[key] ?? key;
      if (vars) for (const [name, value] of Object.entries(vars)) text = text.split(`{${name}}`).join(String(value));
      return text;
    },
    [language]
  );
  return { t, language };
};
