import React from 'react';
import ChefCard from '../components/ChefCard';
import { useCatalog } from '../context/CatalogContext';
import { useT } from '../i18n/useT';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const Chefs = () => {
  const { chefs } = useCatalog();
  const { t } = useT();
  useDocumentTitle(t('chefs.title'));
  return (
    <div className="page-container">
      <h1>{t('chefs.title')}</h1>
      <p className="muted page-sub">{t('chefs.sub')}</p>
      <div className="chef-grid">
        {chefs.map((chef) => (
          <ChefCard key={chef.id} chef={chef} />
        ))}
      </div>
    </div>
  );
};

export default Chefs;
