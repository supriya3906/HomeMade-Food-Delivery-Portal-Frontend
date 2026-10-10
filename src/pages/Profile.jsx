import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Save, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrdersContext';
import { useT } from '../i18n/useT';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { orders } = useOrders();
  const { t } = useT();

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    pincode: user?.pincode || ''
  });
  const [saved, setSaved] = useState(false);

  const update = (field) => (e) => {
    setSaved(false);
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const [saveError, setSaveError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError('');
    try {
      await updateProfile(form);
      setSaved(true);
    } catch (err) {
      setSaveError(err.message);
    }
  };

  const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const completedOrdersCount = orders.filter((o) => o.status !== 'cancelled' && (o.stage === 3 || o.paymentStatus === 'paid')).length;

  const userTier = user?.tier || {
    tier: completedOrdersCount >= 10 ? 'vip' : completedOrdersCount >= 5 ? 'gold' : 'silver',
    name: completedOrdersCount >= 10 ? 'VIP Member Card' : completedOrdersCount >= 5 ? 'Gold Card' : 'Silver Card',
    badge: completedOrdersCount >= 10 ? '👑 VIP' : completedOrdersCount >= 5 ? '🥇 Gold' : '🥈 Silver',
    discountPct: completedOrdersCount >= 10 ? 15 : completedOrdersCount >= 5 ? 10 : 5,
    perk: completedOrdersCount >= 10 ? '15% instant discount + Unlimited free deliveries' : completedOrdersCount >= 5 ? '10% instant discount & priority kitchen slot' : '5% discount on all homemade meals',
    completedOrders: completedOrdersCount,
    nextTier: completedOrdersCount >= 10 ? null : completedOrdersCount >= 5 ? 'vip' : 'gold',
    ordersNeeded: completedOrdersCount >= 10 ? 0 : completedOrdersCount >= 5 ? Math.max(0, 10 - completedOrdersCount) : Math.max(0, 5 - completedOrdersCount),
    progressPct: completedOrdersCount >= 10 ? 100 : completedOrdersCount >= 5 ? Math.min(100, Math.round(((completedOrdersCount - 5) / 5) * 100)) : Math.min(100, Math.round((completedOrdersCount / 5) * 100))
  };

  const cardTheme = userTier.tier === 'vip' ? 'premium' : userTier.tier === 'gold' ? 'gold' : 'silver';

  return (
    <div className="page-container narrow">
      <h1>{t('prof.title')}</h1>

      <div className="profile-summary">
        <div className="profile-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
        <div>
          <h2>{user?.name}</h2>
          <p className="muted">{user?.email}</p>
        </div>
      </div>

      {/* Digital Membership Award Card */}
      <section className="membership-award-section">
        <div className="membership-section-header">
          <div>
            <h3>Rasoi Club Award Card</h3>
            <p className="muted small">Automatically earned loyalty card with instant checkout discounts</p>
          </div>
          <span className={`membership-pill ${cardTheme}`}>{userTier.badge || userTier.name}</span>
        </div>

        <div className={`digital-card ${cardTheme}`}>
          <div className="digital-card-top">
            <div className="card-brand">
              <span className="card-logo">R</span>
              <strong>Rasoi Club</strong>
            </div>
            <span className="card-tier-tag">{userTier.name}</span>
          </div>

          <div className="digital-card-chip">
            <div className="emv-chip" />
            <span className="card-contactless">)))</span>
          </div>

          <div className="digital-card-number">
            <span>4532</span>
            <span>••••</span>
            <span>••••</span>
            <span>{user?.id ? user.id.slice(-4).toUpperCase() : '8821'}</span>
          </div>

          <div className="digital-card-bottom">
            <div>
              <small>CARDHOLDER</small>
              <strong>{user?.name?.toUpperCase() || 'VALUED CUSTOMER'}</strong>
            </div>
            <div>
              <small>MEMBER PRIVILEGE</small>
              <strong className="card-perk-text">{userTier.discountPct}% INSTANT DISCOUNT</strong>
            </div>
          </div>
        </div>

        {/* Auto-tier Progress and Perks Box */}
        <div style={{
          background: 'var(--bg-elevated, #f8fafc)',
          borderRadius: '12px',
          padding: '1.25rem',
          border: '1px solid var(--border-color, #e2e8f0)',
          marginTop: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <strong style={{ fontSize: '0.92rem' }}>Loyalty Tier Status: {userTier.name}</strong>
              <div className="muted small" style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                {userTier.perk}
              </div>
            </div>
            <span style={{
              background: cardTheme === 'premium' ? 'rgba(168, 85, 247, 0.15)' : cardTheme === 'gold' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(148, 163, 184, 0.15)',
              color: cardTheme === 'premium' ? '#9333ea' : cardTheme === 'gold' ? '#ca8a04' : '#475569',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: 700
            }}>
              {userTier.completedOrders} Orders Completed
            </span>
          </div>

          {userTier.nextTier ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                <span className="muted">Progress to {userTier.nextTier === 'vip' ? '👑 VIP Member' : '🥇 Gold Card'}</span>
                <strong>{userTier.ordersNeeded} more order{userTier.ordersNeeded > 1 ? 's' : ''} needed</strong>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{
                  width: `${userTier.progressPct}%`,
                  height: '100%',
                  background: cardTheme === 'gold' ? 'linear-gradient(90deg, #eab308, #a855f7)' : 'linear-gradient(90deg, #94a3b8, #eab308)',
                  borderRadius: '999px',
                  transition: 'width 0.4s ease'
                }} />
              </div>
              <p className="muted small" style={{ fontSize: '0.76rem', marginTop: '6px', marginBottom: 0 }}>
                💡 Your discount tier upgrades automatically once required orders are delivered.
              </p>
            </div>
          ) : (
            <div style={{ color: '#9333ea', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              👑 Highest VIP tier unlocked! Enjoy max 15% discount & zero delivery fees on every single order.
            </div>
          )}
        </div>
      </section>

      <div className="stat-row">
        <div className="stat-card">
          <span className="stat-value">{orders.length}</span>
          <span className="stat-label">{t('prof.orders')}</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">₹{totalSpent}</span>
          <span className="stat-label">{t('prof.spent')}</span>
        </div>
      </div>

      <form className="form-section" onSubmit={handleSave}>
        <h2>{t('prof.edit')}</h2>
        <div className="form-group">
          <label className="form-label" htmlFor="p-name"><User size={14} /> {t('prof.name')}</label>
          <input id="p-name" className="form-input" value={form.name} onChange={update('name')} required />
        </div>
        <div className="form-group">
          <label className="form-label"><Mail size={14} /> {t('prof.email')}</label>
          <input className="form-input" value={user?.email || ''} disabled />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="p-phone"><Phone size={14} /> {t('prof.phone')}</label>
          <input id="p-phone" className="form-input" value={form.phone} onChange={update('phone')} placeholder={t('checkout.phonePh')} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="p-address"><MapPin size={14} /> {t('prof.address')}</label>
          <input id="p-address" className="form-input" value={form.address} onChange={update('address')} placeholder={t('prof.addressPh')} />
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="p-city">{t('prof.city')}</label>
            <input id="p-city" className="form-input" value={form.city} onChange={update('city')} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="p-pincode">{t('prof.pin')}</label>
            <input id="p-pincode" className="form-input" value={form.pincode} onChange={update('pincode')} />
          </div>
        </div>

        <button type="submit" className="btn btn-primary">
          <Save size={16} /> {t('common.save')}
        </button>
        {saveError && <div className="form-error" role="alert">{saveError}</div>}
        {saved && (
          <span className="save-confirm"><CheckCircle2 size={15} /> {t('prof.saved')}</span>
        )}
      </form>
    </div>
  );
};

export default Profile;
