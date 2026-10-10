import React, { useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Star, Clock, Flame, Heart, Plus, Minus } from 'lucide-react';
import { useT } from '../i18n/useT';
import FoodImage from '../components/FoodImage';
import FoodCard from '../components/FoodCard';
import { useCatalog, useLocalize } from '../context/CatalogContext';
import { trackView } from '../api/recent';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';

const FoodDetails = () => {
  const { id } = useParams();
  const { getFoodById, getChefById, foods, status } = useCatalog();
  const { foodName, foodDesc, chefName, chefCuisine, chefCity } = useLocalize();
  const food = getFoodById(id);
  const { getQuantity, addItem, increment, decrement } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { t } = useT();

  // "Recently accessed": remember that this person opened this dish.
  useEffect(() => { if (food) trackView('food', food.id); }, [food?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'loading') return <div className="page-container"><p className="muted">{t('common.loading')}</p></div>;
  if (!food) return <Navigate to="/menu" replace />;

  const quantity = getQuantity(food.id);
  const favorite = isFavorite(food.id);
  const chef = getChefById(food.chefId);
  const categoryLabel = t(`cat.${food.category}`);
  const related = foods.filter((f) => f.category === food.category && f.id !== food.id).slice(0, 4);

  return (
    <div className="page-container">
      <nav className="breadcrumb">
        <Link to="/menu">{t('food.crumbMenu')}</Link> / <span>{foodName(food)}</span>
      </nav>

      <div className="food-detail">
        <div className="food-detail-media">
          <FoodImage food={food} variant="hero" />
          <button
            type="button"
            className={`icon-btn fav-btn large ${favorite ? 'is-active' : ''}`}
            onClick={() => toggleFavorite(food.id)}
            aria-pressed={favorite}
            aria-label={favorite ? t('fav.remove') : t('fav.add')}
          >
            <Heart size={18} fill={favorite ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="food-detail-info">
          <span className="category-tag">{categoryLabel}</span>
          <h1>{foodName(food)}</h1>

          <div className="food-detail-stats">
            <span><Star size={15} fill="currentColor" /> {food.rating} ({t('food.reviews', { n: food.reviews })})</span>
            <span><Clock size={15} /> {t('common.min', { n: food.prepMinutes })}</span>
            <span><Flame size={15} /> {t(`spice.${food.spice}`)}</span>
          </div>

          <p className="food-detail-desc">{foodDesc(food)}</p>

          {food.tags?.length > 0 && (
            <div className="tag-row">
              {food.tags.map((tag) => (
                <span key={tag} className="tag">{t(`tag.${tag}`)}</span>
              ))}
            </div>
          )}

          {chef && (
            <Link to={`/chefs/${chef.id}`} className="chef-strip">
              <div className="chef-avatar-wrap sm">
                <img
                  src={chef.photo || `/images/chefs/${chef.id}.jpg`}
                  alt={chefName(chef)}
                  className="chef-avatar-photo"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <span className="chef-avatar sm" style={{ background: chef.color || '#C1531B' }}>
                  {chefName(chef)[0] || 'C'}
                </span>
              </div>
              <span>
                <strong>{t('food.cookedBy', { name: chefName(chef) })}</strong>
                <small>{chefCuisine(chef)} &middot; {chefCity(chef)} &middot; {t('food.yrs', { n: chef.experience })}</small>
              </span>
            </Link>
          )}

          {food.photoCredit && (
            <p className="photo-credit">
              {t('food.photoBy')}: {food.photoCredit.author} &middot;{' '}
              <a href={food.photoCredit.page} target="_blank" rel="noreferrer">{food.photoCredit.license}</a> &middot; Wikimedia Commons
            </p>
          )}

          <div className="food-detail-cta">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
              {food.offer ? (
                <>
                  <span className="food-detail-price" style={{ color: '#ea580c', fontWeight: 800 }}>
                    ₹{food.offer.discountedPrice}
                  </span>
                  <span style={{ fontSize: '1.1rem', textDecoration: 'line-through', color: '#94a3b8' }}>
                    ₹{food.offer.originalPrice || food.price}
                  </span>
                  <span style={{ background: '#ea580c', color: '#fff', fontSize: '0.78rem', fontWeight: 800, padding: '3px 8px', borderRadius: '6px' }}>
                    🔥 {food.offer.discountPct}% OFF
                  </span>
                </>
              ) : (
                <span className="food-detail-price">₹{food.price}</span>
              )}
            </div>

            {quantity === 0 ? (
              <button type="button" className="btn btn-primary btn-lg" onClick={() => addItem(food)}>
                <Plus size={16} /> {t('food.addToCart')}
              </button>
            ) : (
              <div className="qty-stepper large">
                <button type="button" onClick={() => decrement(food.id)} aria-label={t('qty.dec')}>
                  <Minus size={16} />
                </button>
                <span>{quantity}</span>
                <button type="button" onClick={() => increment(food.id)} aria-label={t('qty.inc')}>
                  <Plus size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>{t('food.related')}</h2>
          </div>
          <div className="food-grid">
            {related.map((f) => (
              <FoodCard key={f.id} food={f} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default FoodDetails;
