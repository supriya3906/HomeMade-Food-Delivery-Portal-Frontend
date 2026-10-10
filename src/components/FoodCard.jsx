import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Plus, Minus, Star } from 'lucide-react';
import FoodImage from './FoodImage';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useCatalog, useLocalize } from '../context/CatalogContext';
import { useT } from '../i18n/useT';

const dietDot = { veg: '#16a34a', vegan: '#16a34a', 'non-veg': '#dc2626' };

const FoodCard = ({ food }) => {
  const { getQuantity, addItem, increment, decrement } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { getChefById } = useCatalog();
  const { foodName, chefName } = useLocalize();
  const { t } = useT();
  const quantity = getQuantity(food.id);
  const favorite = isFavorite(food.id);
  const chef = getChefById(food.chefId);
  const favLabel = favorite ? t('fav.remove') : t('fav.add');

  return (
    <div className="food-card">
      <Link to={`/food/${food.id}`} className="food-card-media">
        <FoodImage food={food} variant="card" />
        {food.offer && (
          <span
            className="food-card-offer-tag"
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              background: 'linear-gradient(135deg, #ef4444, #f97316)',
              color: '#ffffff',
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '6px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              zIndex: 2,
              pointerEvents: 'none'
            }}
          >
            🔥 {food.offer.discountPct}% OFF
          </span>
        )}
        <button
          type="button"
          className={`icon-btn fav-btn ${favorite ? 'is-active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite(food.id);
          }}
          aria-pressed={favorite}
          aria-label={favLabel}
          title={favLabel}
        >
          <Heart size={16} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      </Link>

      <div className="food-card-body">
        <div className="food-card-top">
          <span
            className="diet-dot"
            style={{ background: dietDot[food.diet] || '#16a34a' }}
            title={t(`diet.${food.diet}`)}
          />
          <div className="food-card-rating">
            <Star size={13} fill="currentColor" />
            <span>{food.rating}</span>
          </div>
        </div>

        <Link to={`/food/${food.id}`} className="food-card-name">
          {foodName(food)}
        </Link>
        {chef && (
          <Link to={`/chefs/${chef.id}`} className="food-card-chef">
            <span className="chef-dot" style={{ background: chef.color }}>{chefName(chef)[0]}</span>
            {chefName(chef)}
          </Link>
        )}
        <p className="food-card-meta">{t('common.min', { n: food.prepMinutes })} &middot; {t(`spice.${food.spice}`)}</p>

        <div className="food-card-bottom">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            {food.offer ? (
              <>
                <span className="food-card-price" style={{ color: '#ea580c', fontWeight: 800 }}>
                  ₹{food.offer.discountedPrice}
                </span>
                <span style={{ fontSize: '0.8rem', textDecoration: 'line-through', color: '#94a3b8' }}>
                  ₹{food.offer.originalPrice || food.price}
                </span>
              </>
            ) : (
              <span className="food-card-price">₹{food.price}</span>
            )}
          </div>

          {quantity === 0 ? (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => addItem(food)}
            >
              <Plus size={14} /> {t('common.add')}
            </button>
          ) : (
            <div className="qty-stepper">
              <button type="button" onClick={() => decrement(food.id)} aria-label={t('qty.dec')}>
                <Minus size={14} />
              </button>
              <span>{quantity}</span>
              <button type="button" onClick={() => increment(food.id)} aria-label={t('qty.inc')}>
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodCard;
