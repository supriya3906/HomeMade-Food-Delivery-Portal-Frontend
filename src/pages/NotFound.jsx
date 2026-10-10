import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n/useT';

const NotFound = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useT();
  return (
    <div className="page-container">
      <div className="empty-state large">
        <UtensilsCrossed size={40} />
        <h2>{t('nf.title')}</h2>
        <p>{t('nf.text')}</p>
        <Link to={isAuthenticated ? '/home' : '/signin'} className="btn btn-primary">
          {isAuthenticated ? t('nf.home') : t('nf.signin')}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
