import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n/useT';

const Footer = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useT();
  if (!isAuthenticated) return null;

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="brand-mark small">
            <UtensilsCrossed size={16} />
          </span>
          <span>
            Ras<span className="accent">oi</span>
          </span>
        </div>
        <nav className="footer-links">
          <Link to="/home">{t('nav.home')}</Link>
          <Link to="/menu">{t('nav.menu')}</Link>
          <Link to="/orders">{t('nav.orders')}</Link>
          <Link to="/favorites">{t('nav.favorites')}</Link>
          <Link to="/settings">{t('nav.settings')}</Link>
        </nav>
        <p className="footer-copy">&copy; {new Date().getFullYear()} Rasoi &mdash; {t('footer.tagline')}</p>
      </div>
    </footer>
  );
};

export default Footer;
