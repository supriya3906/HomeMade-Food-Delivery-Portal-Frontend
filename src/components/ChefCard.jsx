import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin } from 'lucide-react';
import { useCatalog, useLocalize } from '../context/CatalogContext';
import { useT } from '../i18n/useT';

const ChefCard = ({ chef }) => {
  const { foods } = useCatalog();
  const { chefName, chefCity, chefCuisine, chefSpeciality } = useLocalize();
  const { t } = useT();
  const [imgError, setImgError] = useState(false);
  const dishes = foods.filter((f) => String(f.chefId) === String(chef.id));
  const name = chefName(chef) || chef.name || 'Chef';

  return (
    <Link to={`/chefs/${chef.id}`} className="chef-card">
      <div className="chef-avatar-wrap">
        {chef.photo && !imgError ? (
          <img
            src={chef.photo}
            alt={name}
            className="chef-avatar-photo"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="chef-avatar" style={{ background: chef.color || '#C1531B' }}>
            {name[0] || 'C'}
          </span>
        )}
      </div>
      <div className="chef-card-body">
        <h3>{name}</h3>
        <p className="chef-card-cuisine">{chefCuisine(chef) || chef.cuisine}</p>
        <p className="muted chef-card-spec">{chefSpeciality(chef) || chef.speciality}</p>
        <div className="chef-card-meta">
          <span><Star size={13} fill="currentColor" /> {chef.rating || 4.8}</span>
          <span><MapPin size={13} /> {chefCity(chef) || chef.city}</span>
          <span>{t('chefs.dishes', { n: dishes.length })}</span>
        </div>
      </div>
    </Link>
  );
};

export default ChefCard;
