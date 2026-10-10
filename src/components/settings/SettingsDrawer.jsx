import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import AppearanceSection from './AppearanceSection';
import { useT } from '../../i18n/useT';

// Settings panel that slides over the Sign In page (no navigation away).
const SettingsDrawer = ({ open, onClose }) => {
  const { t } = useT();
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={t('set.title')}>
        <header className="drawer-head">
          <h2>{t('set.title')}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('set.closeAria')}><X size={18} /></button>
        </header>
        <div className="drawer-body">
          <AppearanceSection />
        </div>
      </aside>
    </div>
  );
};

export default SettingsDrawer;
