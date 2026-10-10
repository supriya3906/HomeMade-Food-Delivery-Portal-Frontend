import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useCatalog } from '../context/CatalogContext';
import FoodCard from '../components/FoodCard';
import { useT } from '../i18n/useT';

const Favorites = () => {
  const { favoriteIds } = useFavorites();
  const { foods } = useCatalog();
  const { t } = useT();
  const favoriteFoods = foods.filter((f) => favoriteIds.includes(f.id));

  if (favoriteFoods.length === 0) {
    return (
      <div className="page-container">
        <div className="empty-state large">
          <Heart size={40} />
          <h2>{t('fav.noneTitle')}</h2>
          <p>{t('fav.noneText')}</p>
          <Link to="/menu" className="btn btn-primary">{t('cart.browse')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1>{t('fav.title')}</h1>
      <div className="food-grid">
        {favoriteFoods.map((food) => (
          <FoodCard key={food.id} food={food} />
        ))}
      </div>
    </div>
  );
};

export default Favorites;
