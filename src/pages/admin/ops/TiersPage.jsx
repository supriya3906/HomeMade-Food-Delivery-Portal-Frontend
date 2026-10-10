import React, { useState, useEffect } from 'react';
import { Award, ShieldCheck, Crown, Users, Percent, Check, AlertCircle, Save, RotateCcw, Sparkles } from 'lucide-react';
import { api } from '../../../api/client';
import { useOps, Card, Table, Badge, money } from './ui';

export const TiersPage = () => {
  const { toast } = useOps();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);
  const [tiers, setTiers] = useState({
    silver: { name: 'Silver Card', badge: '🥈 Silver', color: '#94a3b8', minOrders: 0, discountPct: 5 },
    gold: { name: 'Gold Card', badge: '🥇 Gold', color: '#eab308', minOrders: 5, discountPct: 10 },
    vip: { name: 'VIP Member Card', badge: '👑 VIP', color: '#a855f7', minOrders: 10, discountPct: 15, freeDelivery: true }
  });

  const loadTiers = async () => {
    try {
      setLoading(true);
      const res = await api('/admin/tiers');
      if (res && res.settings) {
        setData(res);
        setTiers(res.settings);
      }
    } catch (err) {
      toast(err.message || 'Failed to load membership tiers', 'bad');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTiers();
  }, []);

  const handleChange = (tierKey, field, value) => {
    setTiers((prev) => ({
      ...prev,
      [tierKey]: {
        ...prev[tierKey],
        [field]: Number(value)
      }
    }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    // Validation
    if (tiers.gold.minOrders <= tiers.silver.minOrders) {
      toast('Gold tier minimum orders must be higher than Silver (0).', 'warn');
      return;
    }
    if (tiers.vip.minOrders <= tiers.gold.minOrders) {
      toast('VIP tier minimum orders must be higher than Gold tier.', 'warn');
      return;
    }

    setSaving(true);
    try {
      const res = await api('/admin/tiers', {
        method: 'POST',
        body: JSON.stringify(tiers)
      });
      if (res && res.settings) {
        setTiers(res.settings);
      }
      toast('Membership tiers and discount policies saved successfully!', 'ok');
      await loadTiers();
    } catch (err) {
      toast(err.message || 'Failed to update tiers', 'bad');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setTiers({
      silver: { name: 'Silver Card', badge: '🥈 Silver', color: '#94a3b8', minOrders: 0, discountPct: 5 },
      gold: { name: 'Gold Card', badge: '🥇 Gold', color: '#eab308', minOrders: 5, discountPct: 10 },
      vip: { name: 'VIP Member Card', badge: '👑 VIP', color: '#a855f7', minOrders: 10, discountPct: 15, freeDelivery: true }
    });
    toast('Reset to default tier settings. Click "Save Changes" to apply.', 'info');
  };

  const counts = data?.counts || { silver: 0, gold: 0, vip: 0 };
  const totalUsers = data?.totalUsers || 0;

  const TIER_META = {
    silver: { icon: ShieldCheck, border: '#94a3b8', bg: 'rgba(148, 163, 184, 0.08)' },
    gold: { icon: Award, border: '#eab308', bg: 'rgba(234, 179, 8, 0.08)' },
    vip: { icon: Crown, border: '#a855f7', bg: 'rgba(168, 85, 247, 0.08)' }
  };

  return (
    <div className="ops-page">
      <header className="ops-page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Membership Loyalty Tiers</h2>
          <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
            Configure order milestones and automatic discounts for Silver, Gold, and VIP. Tiers are automatically calculated and applied at checkout.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="ops-btn"
            onClick={handleResetDefaults}
            disabled={saving || loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RotateCcw size={15} /> Reset Defaults
          </button>
          <button
            type="button"
            className="ops-btn primary"
            onClick={handleSave}
            disabled={saving || loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </header>

      {/* Customer Distribution Overview */}
      <div className="ops-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="ops-card" style={{ padding: '1.25rem', borderLeft: '4px solid #94a3b8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="muted small" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Silver Members</span>
            <span style={{ fontSize: '1.1rem' }}>🥈</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.25rem' }}>{counts.silver}</div>
          <div className="muted small" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
            {totalUsers > 0 ? Math.round((counts.silver / totalUsers) * 100) : 0}% of customer base
          </div>
        </div>

        <div className="ops-card" style={{ padding: '1.25rem', borderLeft: '4px solid #eab308' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="muted small" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Gold Members</span>
            <span style={{ fontSize: '1.1rem' }}>🥇</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.25rem', color: '#ca8a04' }}>{counts.gold}</div>
          <div className="muted small" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
            {totalUsers > 0 ? Math.round((counts.gold / totalUsers) * 100) : 0}% of customer base
          </div>
        </div>

        <div className="ops-card" style={{ padding: '1.25rem', borderLeft: '4px solid #a855f7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="muted small" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>VIP Members</span>
            <span style={{ fontSize: '1.1rem' }}>👑</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.25rem', color: '#9333ea' }}>{counts.vip}</div>
          <div className="muted small" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
            {totalUsers > 0 ? Math.round((counts.vip / totalUsers) * 100) : 0}% of customer base
          </div>
        </div>
      </div>

      {/* Tier Configuration Cards */}
      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {['silver', 'gold', 'vip'].map((tierKey) => {
            const conf = tiers[tierKey] || {};
            const meta = TIER_META[tierKey];
            const Icon = meta.icon;

            return (
              <div
                key={tierKey}
                className="ops-card"
                style={{
                  border: `2px solid ${meta.border}`,
                  borderRadius: '12px',
                  padding: '1.5rem',
                  background: 'var(--color-surface, #ffffff)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        background: meta.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: meta.border
                      }}
                    >
                      <Icon size={22} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>{conf.name}</h3>
                      <span className="muted small" style={{ textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em' }}>
                        {conf.badge}
                      </span>
                    </div>
                  </div>
                  <span
                    style={{
                      background: meta.bg,
                      color: meta.border,
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '0.85rem',
                      fontWeight: 700
                    }}
                  >
                    {conf.discountPct}% OFF
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-muted, #475569)' }}>
                      Completed Orders Required
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      disabled={tierKey === 'silver'} // Silver is base level for all users
                      value={conf.minOrders ?? 0}
                      onChange={(e) => handleChange(tierKey, 'minOrders', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: tierKey === 'silver' ? '#f8fafc' : '#ffffff',
                        cursor: tierKey === 'silver' ? 'not-allowed' : 'auto'
                      }}
                    />
                    <small className="muted" style={{ fontSize: '0.75rem', display: 'block', marginTop: '2px' }}>
                      {tierKey === 'silver' ? 'Default tier for all new & registered customers' : `Requires ${conf.minOrders} completed orders`}
                    </small>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-muted, #475569)' }}>
                      Checkout Discount (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={conf.discountPct ?? 0}
                      onChange={(e) => handleChange(tierKey, 'discountPct', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1'
                      }}
                    />
                    <small className="muted" style={{ fontSize: '0.75rem', display: 'block', marginTop: '2px' }}>
                      Auto-applied at checkout without coupon codes
                    </small>
                  </div>

                  {tierKey === 'vip' && (
                    <div style={{ background: 'rgba(168, 85, 247, 0.08)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.82rem', color: '#7e22ce' }}>
                      ✨ <strong>VIP Perk:</strong> Free doorstep delivery waived automatically on every order.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="submit"
            className="ops-btn primary"
            disabled={saving || loading}
            style={{ padding: '0.65rem 1.5rem', fontSize: '0.95rem' }}
          >
            {saving ? 'Saving...' : 'Save & Enforce Tier Policies'}
          </button>
        </div>
      </form>

      {/* Rules Notice */}
      <div style={{ marginTop: '2rem', padding: '1.25rem', borderRadius: '8px', background: 'var(--color-surface, #f8fafc)', border: '1px solid #e2e8f0' }}>
        <h4 style={{ margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} style={{ color: '#6366f1' }} /> Automatic Tier Promotion System
        </h4>
        <p className="muted small" style={{ margin: 0, lineHeight: 1.6 }}>
          Customers are automatically promoted as soon as their completed orders reach the required thresholds.
          Manual tier switching has been removed from customer accounts. Discounts are strictly validated and applied by the server during checkout and payment capture.
        </p>
      </div>
    </div>
  );
};

export default TiersPage;
