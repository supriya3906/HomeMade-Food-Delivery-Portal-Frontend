import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, MapPin, Award, ShoppingBag, ArrowLeft } from 'lucide-react';
import FoodCard from '../components/FoodCard';
import { useCatalog, useLocalize } from '../context/CatalogContext';
import { useT } from '../i18n/useT';
import { trackView } from '../api/recent';

const ChefProfile = () => {
  const { id } = useParams();
  const { getChefById, foods, status } = useCatalog();
  const { chefName, chefCity, chefCuisine, chefSpeciality, chefBio } = useLocalize();
  const { t } = useT();
  const [imgError, setImgError] = useState(false);
  const chef = getChefById(id);

  useEffect(() => {
    if (chef) trackView('chef', chef.id);
  }, [chef?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'loading') {
    return (
      <div className="page-container">
        <p className="muted" style={{ padding: '3rem 0', textAlign: 'center' }}>{t('common.loading')}</p>
      </div>
    );
  }

  if (!chef) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>Chef not found</h2>
        <p className="muted" style={{ margin: '0.8rem 0 1.5rem' }}>The requested chef could not be found.</p>
        <Link to="/chefs" className="btn btn-primary">
          <ArrowLeft size={16} /> Back to Chefs
        </Link>
      </div>
    );
  }

  const dishes = foods.filter((f) => String(f.chefId) === String(chef.id));
  const name = chefName(chef) || chef.name || 'Chef';
  const ordersCount = Number(chef.orders || 0).toLocaleString();

  return (
    <div className="page-container">
      <nav className="breadcrumb">
        <Link to="/chefs">{t('chefs.crumb')}</Link> / <span>{name}</span>
      </nav>

      <section className="chef-hero">
        <div className="chef-avatar-wrap lg">
          {chef.photo && !imgError ? (
            <img
              src={chef.photo}
              alt={name}
              className="chef-avatar-photo lg"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="chef-avatar lg" style={{ background: chef.color || '#C1531B' }}>
              {name[0] || 'C'}
            </span>
          )}
        </div>
        <div>
          <h1>{name}</h1>
          <p className="chef-card-cuisine">{chefCuisine(chef) || chef.cuisine} &middot; {chefSpeciality(chef) || chef.speciality}</p>
          <p className="chef-bio">{chefBio(chef) || chef.bio}</p>
          <div className="chef-stats">
            <span><Star size={15} fill="currentColor" /> {t('chef.rating', { n: chef.rating || 4.8 })}</span>
            <span><MapPin size={15} /> {chefCity(chef) || chef.city}</span>
            <span><Award size={15} /> {t('chef.years', { n: chef.experience || 10 })}</span>
            <span><ShoppingBag size={15} /> {t('chef.orders', { n: ordersCount })}</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>{t('chef.cookedBy', { name: name.split(' ')[0] })} ({dishes.length})</h2>
        </div>
        {dishes.length > 0 ? (
          <div className="food-grid">
            {dishes.map((food) => (
              <FoodCard key={food.id} food={food} />
            ))}
          </div>
        ) : (
          <p className="muted" style={{ padding: '2rem 0' }}>No dishes currently available from this chef.</p>
        )}
      </section>
    </div>
  );
};

export default ChefProfile;
