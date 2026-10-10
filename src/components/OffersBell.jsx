import React, { useState, useEffect, useRef } from 'react';
import { Bell, Sparkles, Plus, Check, ShoppingBag, Flame } from 'lucide-react';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import FoodImage from './FoodImage';

export const OffersBell = ({ user }) => {
  const [offers, setOffers] = useState([]);
  const [open, setOpen] = useState(false);
  const [addedMap, setAddedMap] = useState({});
  const { addItem } = useCart();
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`rasoi_read_offers_${user?.id}`) || '[]');
    } catch {
      return [];
    }
  });
  const bellRef = useRef(null);

  const storageKey = `rasoi_read_offers_${user?.id}`;

  const loadOffers = async () => {
    try {
      const data = await api('/offers');
      setOffers(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadOffers();
    const interval = setInterval(loadOffers, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const unreadCount = offers.filter((o) => !readIds.includes(o.id)).length;

  const markAllRead = () => {
    const allIds = offers.map((o) => o.id);
    setReadIds(allIds);
    try {
      localStorage.setItem(storageKey, JSON.stringify(allIds));
    } catch {
      // ignore
    }
  };

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      markAllRead();
    }
  };

  const handleAddToCart = (offer) => {
    if (!offer.foodId) return;
    addItem({
      id: offer.foodId,
      name: offer.foodName || offer.title,
      price: offer.discountedPrice || offer.originalPrice,
      photo: offer.foodPhoto
    });
    setAddedMap((prev) => ({ ...prev, [offer.id]: true }));
    setTimeout(() => {
      setAddedMap((prev) => ({ ...prev, [offer.id]: false }));
    }, 1500);
  };

  return (
    <div className="offers-bell-container" ref={bellRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="icon-btn nav-bell-btn"
        onClick={toggleOpen}
        aria-label={`Offers notifications (${unreadCount} unread)`}
        title="Exclusive Food Offers & Deals"
        style={{ position: 'relative' }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            className="badge offers-badge"
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#e11d48',
              color: '#fff',
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '2px 5px',
              borderRadius: '999px',
              lineHeight: 1,
              boxShadow: '0 0 0 2px var(--color-surface, #fff)'
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="offers-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '350px',
            maxWidth: '92vw',
            background: 'var(--color-surface, #ffffff)',
            color: 'var(--color-text, #1e293b)',
            borderRadius: '14px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.2)',
            border: '1px solid var(--color-border, #e2e8f0)',
            zIndex: 1000,
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={18} />
              <strong style={{ fontSize: '0.96rem' }}>Dish Offers & Deals</strong>
            </div>
            {offers.length > 0 && (
              <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                {offers.length} active on menu
              </span>
            )}
          </div>

          <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '12px' }}>
            {offers.length === 0 ? (
              <div style={{ padding: '28px 12px', textAlign: 'center', color: '#64748b' }}>
                <ShoppingBag size={30} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>No food offers today.</p>
                <small style={{ color: '#94a3b8' }}>Check back soon for upcoming dish specials!</small>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {offers.map((offer) => {
                  const isAdded = !!addedMap[offer.id];
                  return (
                    <div
                      key={offer.id}
                      style={{
                        border: '1px solid var(--color-border, #e2e8f0)',
                        borderRadius: '12px',
                        padding: '10px 12px',
                        background: 'var(--color-surface-subtle, #f8fafc)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {offer.foodPhoto ? (
                          <img
                            src={offer.foodPhoto}
                            alt={offer.foodName}
                            style={{
                              width: '52px',
                              height: '52px',
                              borderRadius: '8px',
                              objectFit: 'cover',
                              flexShrink: 0,
                              border: '1px solid #e2e8f0'
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '52px',
                              height: '52px',
                              borderRadius: '8px',
                              background: '#fed7aa',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.4rem',
                              flexShrink: 0
                            }}
                          >
                            🍲
                          </div>
                        )}

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4px' }}>
                            <strong style={{ fontSize: '0.88rem', color: 'var(--color-text, #0f172a)', lineHeight: 1.25 }}>
                              {offer.foodName || offer.title}
                            </strong>
                            <span
                              style={{
                                background: '#ea580c',
                                color: '#fff',
                                fontWeight: 800,
                                fontSize: '0.68rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                              }}
                            >
                              {offer.discountPct}% OFF
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '3px' }}>
                            {offer.discountedPrice && (
                              <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#ea580c' }}>
                                ₹{offer.discountedPrice}
                              </span>
                            )}
                            {offer.originalPrice && (
                              <span style={{ fontSize: '0.78rem', textDecoration: 'line-through', color: '#94a3b8' }}>
                                ₹{offer.originalPrice}
                              </span>
                            )}
                            {offer.savings && (
                              <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600 }}>
                                (Save ₹{offer.savings})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {offer.description && (
                        <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--color-text-muted, #475569)', lineHeight: 1.35 }}>
                          {offer.description}
                        </p>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                        <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                          {offer.endDate ? `Valid till ${new Date(offer.endDate).toLocaleDateString()}` : 'Limited time offer'}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleAddToCart(offer)}
                          style={{
                            background: isAdded ? '#10b981' : '#f97316',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '5px 12px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'background 0.2s ease'
                          }}
                        >
                          {isAdded ? (
                            <>
                              <Check size={13} /> Added to Cart!
                            </>
                          ) : (
                            <>
                              <Plus size={13} /> Add to Cart
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OffersBell;
