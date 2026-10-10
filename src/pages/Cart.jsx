import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight, ArrowLeft, ClipboardList } from 'lucide-react';
import { useCart } from '../context/CartContext';
import FoodImage from '../components/FoodImage';
import { useCatalog, useLocalize } from '../context/CatalogContext';
import { useT } from '../i18n/useT';

const Cart = () => {
  const { items, subtotal, originalSubtotal, offerSavings, itemCount, increment, decrement, removeItem, clearCart } = useCart();
  const navigate = useNavigate();
  const { t } = useT();
  const { getFoodById, getChefById } = useCatalog();
  const { foodName, chefName } = useLocalize();
  const [confirmClear, setConfirmClear] = useState(false);

  if (items.length === 0) {
    return (
      <div className="page-container">
        <div className="empty-state large">
          <ShoppingBag size={40} />
          <h2>{t('cart.empty')}</h2>
          <p>{t('cart.emptyText')}</p>
          <Link to="/menu" className="btn btn-primary">{t('cart.browse')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1>{t('cart.title')}</h1>

      <div className="cart-layout">
        <section className="order-sheet" aria-label={t('cart.itemsHead')}>
          <header className="order-sheet-head">
            <div className="order-sheet-title">
              <ClipboardList size={18} />
              <strong>{t('cart.itemsHead')}</strong>
              <span className="muted">· {itemCount === 1 ? t('cart.itemCountOne') : t('cart.itemCount', { n: itemCount })}</span>
            </div>
            {confirmClear ? (
              <div className="confirm-inline">
                <span className="muted">{t('cart.clearAsk')}</span>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => { clearCart(); setConfirmClear(false); }}>{t('cart.clearYes')}</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirmClear(false)}>{t('cart.keep')}</button>
              </div>
            ) : (
              <button type="button" className="btn btn-secondary btn-sm clear-cart-btn" onClick={() => setConfirmClear(true)}>
                <Trash2 size={14} /> {t('cart.clear')}
              </button>
            )}
          </header>

          <div className="order-cols" aria-hidden="true">
            <span>#</span><span>{t('cart.colItem')}</span><span>{t('cart.colPrice')}</span><span>{t('cart.colQty')}</span><span>{t('cart.colAmount')}</span><span />
          </div>

          <ol className="order-lines">
            {items.map((item, index) => {
              const food = getFoodById(item.id);
              const chef = getChefById(item.chefId);
              return (
                <li key={item.id} className="order-line">
                  <span className="order-line-no">{index + 1}</span>
                  <div className="order-line-item">
                    <FoodImage food={food || item} variant="thumb" />
                    <div className="order-line-info">
                      <Link to={`/food/${item.id}`}>{foodName(food) || item.name}</Link>
                      {item.offer && (
                        <span style={{ fontSize: '0.72rem', color: '#ea580c', fontWeight: 700, display: 'block' }}>
                          🔥 {item.offer.discountPct}% Offer Applied
                        </span>
                      )}
                      {chef && <span className="muted">{t('cart.by', { chef: chefName(chef) })}</span>}
                    </div>
                  </div>
                  <span className="order-line-price">
                    {item.offer ? (
                      <>
                        <span style={{ color: '#ea580c', fontWeight: 700 }}>₹{item.price}</span>
                        <del style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>₹{item.originalPrice}</del>
                      </>
                    ) : (
                      `₹${item.price}`
                    )}
                  </span>
                  <div className="qty-stepper">
                    <button type="button" onClick={() => decrement(item.id)} aria-label={t('qty.dec')}><Minus size={14} /></button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => increment(item.id)} aria-label={t('qty.inc')}><Plus size={14} /></button>
                  </div>
                  <span className="order-line-amount">₹{item.price * item.quantity}</span>
                  <button type="button" className="icon-btn remove-btn" onClick={() => removeItem(item.id)} aria-label={t('cart.removeItem', { name: foodName(food) || item.name })} title={t('cart.remove')}>
                    <Trash2 size={16} />
                  </button>
                </li>
              );
            })}
          </ol>

          <footer className="order-sheet-foot">
            <Link to="/menu" className="btn btn-secondary">
              <ArrowLeft size={16} /> {t('cart.addMoreFood')}
            </Link>
          </footer>
        </section>

        <aside className="cart-summary">
          <h2>{t('cart.summary')}</h2>
          {offerSavings > 0 && (
            <div className="summary-row" style={{ color: '#ea580c', fontWeight: 600 }}>
              <span>Food Offer Savings</span>
              <span>-₹{offerSavings}</span>
            </div>
          )}
          <div className="summary-row total">
            <span>{t('cart.subtotal')}</span>
            <span>₹{subtotal}</span>
          </div>
          <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => navigate('/checkout')}>
            {t('cart.checkout')} <ArrowRight size={16} />
          </button>
        </aside>
      </div>
    </div>
  );
};

export default Cart;
