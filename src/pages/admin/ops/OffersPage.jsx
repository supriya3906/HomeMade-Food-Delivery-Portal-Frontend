import React, { useState, useEffect } from 'react';
import { Utensils, Plus, Edit2, Trash2, Calendar, Percent, Sparkles, Tag } from 'lucide-react';
import { api } from '../../../api/client';
import { useOps, usePoll, Card, Table, Badge, Drawer, ConfirmDialog, money } from './ui';

export const OffersPage = () => {
  const { toast } = useOps();
  const { data: offers, loading, error, reload } = usePoll('/admin/offers', 15000);
  const [foods, setFoods] = useState([]);
  const [foodsLoading, setFoodsLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const initialForm = {
    foodId: '',
    title: '',
    description: '',
    discountValue: 15,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    active: true
  };

  const [formData, setFormData] = useState(initialForm);

  // Load menu foods for dropdown selection
  useEffect(() => {
    let cancelled = false;
    setFoodsLoading(true);
    api('/admin/foods')
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setFoods(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setFoodsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const openCreateModal = () => {
    setEditingOffer(null);
    const defaultFoodId = foods[0]?.id || '';
    const defaultFood = foods.find((f) => f.id === defaultFoodId);
    setFormData({
      ...initialForm,
      foodId: defaultFoodId,
      title: defaultFood ? `15% Off on ${defaultFood.name}` : '',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
    });
    setModalOpen(true);
  };

  const openEditModal = (offer) => {
    setEditingOffer(offer);
    setFormData({
      foodId: offer.foodId || '',
      title: offer.title || offer.name || '',
      description: offer.description || '',
      discountValue: offer.discountValue ?? offer.discountPct ?? 15,
      startDate: offer.startDate ? offer.startDate.slice(0, 10) : '',
      endDate: offer.endDate ? offer.endDate.slice(0, 10) : '',
      active: offer.active !== false
    });
    setModalOpen(true);
  };

  const handleFoodSelect = (foodId) => {
    const selected = foods.find((f) => f.id === foodId);
    setFormData((prev) => ({
      ...prev,
      foodId,
      title: selected ? `${prev.discountValue || 15}% Off on ${selected.name}` : prev.title
    }));
  };

  const handleDiscountChange = (val) => {
    const discount = Number(val);
    const selected = foods.find((f) => f.id === formData.foodId);
    setFormData((prev) => ({
      ...prev,
      discountValue: discount,
      title: selected ? `${discount}% Off on ${selected.name}` : prev.title
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.foodId) {
      toast('Please select a dish from the menu.', 'warn');
      return;
    }

    setSaving(true);
    try {
      if (editingOffer) {
        await api(`/admin/offers/${editingOffer.id}`, {
          method: 'PATCH',
          body: JSON.stringify(formData)
        });
        toast(`Offer for "${formData.title}" updated successfully!`, 'ok');
      } else {
        await api('/admin/offers', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        toast(`Offer for "${formData.title}" created successfully!`, 'ok');
      }
      setModalOpen(false);
      reload();
    } catch (err) {
      toast(err.message || 'Failed to save food offer', 'bad');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (offer) => {
    try {
      const nextActive = !offer.active;
      await api(`/admin/offers/${offer.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: nextActive })
      });
      toast(`Offer for ${offer.foodName || offer.title} is now ${nextActive ? 'Active' : 'Paused'}`, 'ok');
      reload();
    } catch (err) {
      toast(err.message || 'Failed to update offer status', 'bad');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api(`/admin/offers/${deleteTarget.id}`, { method: 'DELETE' });
      toast(`Offer for "${deleteTarget.foodName || deleteTarget.title}" deleted.`, 'ok');
      setDeleteTarget(null);
      reload();
    } catch (err) {
      toast(err.message || 'Failed to delete offer', 'bad');
    }
  };

  const offerList = Array.isArray(offers) ? offers : [];
  const activeCount = offerList.filter((o) => o.active).length;
  const maxDiscount = offerList.length > 0 ? Math.max(...offerList.map((o) => o.discountValue || o.discountPct || 0)) : 0;

  const currentSelectedFood = foods.find((f) => f.id === formData.foodId);
  const previewDiscountPrice = currentSelectedFood
    ? Math.round(currentSelectedFood.price * (1 - (formData.discountValue || 0) / 100))
    : null;
  const previewSavings = currentSelectedFood ? currentSelectedFood.price - previewDiscountPrice : 0;

  return (
    <div className="ops-page">
      <header className="ops-page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Food Offers & Specials</h2>
          <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
            Set promotional discounts directly on menu items (no coupon codes needed). Discounted dishes appear with offer badges on the menu, cart, and the customer notification bell.
          </p>
        </div>
        <button
          type="button"
          className="ops-btn primary"
          onClick={openCreateModal}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem' }}
        >
          <Plus size={16} /> New Food Offer
        </button>
      </header>

      {/* Metric Tiles */}
      <div className="ops-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="ops-card" style={{ padding: '1.25rem', borderLeft: '4px solid #6366f1' }}>
          <div className="muted small" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Food Offers</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--color-text, #1e293b)' }}>{offerList.length}</div>
        </div>
        <div className="ops-card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
          <div className="muted small" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Active Menu Deals</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.25rem', color: '#10b981' }}>{activeCount}</div>
        </div>
        <div className="ops-card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
          <div className="muted small" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Peak Discount</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.25rem', color: '#f59e0b' }}>{maxDiscount}% OFF</div>
        </div>
      </div>

      <Card title={`Active Food Offers (${offerList.length})`}>
        {loading && !offerList.length ? (
          <div style={{ padding: '2rem', textAlign: 'center' }} className="muted">Loading food offers...</div>
        ) : error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>{error}</div>
        ) : offerList.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
            <Utensils size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
            <h4>No food item offers active</h4>
            <p className="muted" style={{ maxWidth: '400px', margin: '0.5rem auto 1rem' }}>
              Create your first promotional discount on any menu item to display special pricing for customers.
            </p>
            <button type="button" className="ops-btn primary" onClick={openCreateModal}>
              <Plus size={15} /> Create First Food Offer
            </button>
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Food Item</th>
                <th>Offer Details</th>
                <th>Discount</th>
                <th>Pricing</th>
                <th>Validity Period</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {offerList.map((o) => {
                const isExpired = o.endDate && new Date(o.endDate) < new Date();
                const discount = o.discountValue ?? o.discountPct ?? 0;
                return (
                  <tr key={o.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {o.foodPhoto ? (
                          <img
                            src={o.foodPhoto}
                            alt={o.foodName || 'Dish'}
                            style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                          />
                        ) : (
                          <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: '#fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                            🍲
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--color-text, #1e293b)' }}>
                            {o.foodName || 'Selected Food'}
                          </div>
                          {o.foodCategory && <span className="muted small" style={{ textTransform: 'capitalize' }}>{o.foodCategory}</span>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-text, #1e293b)' }}>{o.title || o.name}</div>
                      {o.description && <div className="muted small" style={{ fontSize: '0.8rem', marginTop: '2px' }}>{o.description}</div>}
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          fontWeight: 800,
                          color: '#fff',
                          background: '#ea580c',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.82rem'
                        }}
                      >
                        {discount}% OFF
                      </span>
                    </td>
                    <td>
                      {o.discountedPrice ? (
                        <div>
                          <div style={{ fontWeight: 700, color: '#ea580c', fontSize: '0.95rem' }}>
                            {money(o.discountedPrice)}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                            {money(o.originalPrice)}
                          </div>
                        </div>
                      ) : (
                        <span className="muted">-</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        <div>{o.startDate ? new Date(o.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Immediate'}</div>
                        <div className="muted" style={{ fontSize: '0.75rem' }}>
                          to {o.endDate ? new Date(o.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No Expiry'}
                        </div>
                      </div>
                    </td>
                    <td>
                      {isExpired ? (
                        <Badge tone="bad">Expired</Badge>
                      ) : o.active ? (
                        <Badge tone="ok">Active</Badge>
                      ) : (
                        <Badge tone="neutral">Paused</Badge>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        className="ops-btn small"
                        style={{ marginRight: '6px' }}
                        onClick={() => handleToggleActive(o)}
                        title={o.active ? 'Pause offer' : 'Activate offer'}
                      >
                        {o.active ? 'Pause' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        className="ops-btn small"
                        style={{ marginRight: '6px' }}
                        onClick={() => openEditModal(o)}
                        title="Edit offer"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        className="ops-btn small danger"
                        onClick={() => setDeleteTarget(o)}
                        title="Delete offer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Create / Edit Drawer */}
      {modalOpen && (
        <Drawer
          title={editingOffer ? 'Edit Food Offer' : 'Create Food Offer'}
          subtitle="Apply promotional discounts directly to menu dishes without coupon codes"
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '4px' }}>
                Select Menu Dish *
              </label>
              <select
                className="ops-input"
                required
                value={formData.foodId}
                onChange={(e) => handleFoodSelect(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="" disabled>-- Select a food item --</option>
                {foods.map((food) => (
                  <option key={food.id} value={food.id}>
                    {food.name} (Base Price: ₹{food.price}) [{food.category}]
                  </option>
                ))}
              </select>
            </div>

            {currentSelectedFood && (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08), rgba(234, 88, 12, 0.04))',
                  border: '1px solid rgba(249, 115, 22, 0.3)',
                  borderRadius: '10px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                {currentSelectedFood.photo ? (
                  <img
                    src={currentSelectedFood.photo}
                    alt={currentSelectedFood.name}
                    style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '56px', height: '56px', borderRadius: '8px', background: '#fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                    🍽️
                  </div>
                )}
                <div>
                  <strong style={{ fontSize: '0.92rem', color: '#1e293b' }}>{currentSelectedFood.name}</strong>
                  <div style={{ fontSize: '0.82rem', marginTop: '2px', color: '#475569' }}>
                    Base Price: <strong>₹{currentSelectedFood.price}</strong>
                  </div>
                  {previewDiscountPrice && (
                    <div style={{ fontSize: '0.85rem', marginTop: '3px', color: '#ea580c', fontWeight: 700 }}>
                      Special Offer Price: ₹{previewDiscountPrice} <span style={{ color: '#16a34a', fontSize: '0.78rem' }}>(Customer saves ₹{previewSavings})</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '4px' }}>
                Offer Campaign Title *
              </label>
              <input
                type="text"
                className="ops-input"
                required
                placeholder="e.g. 20% Off on Hyderabadi Dum Biryani"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '4px' }}>
                Description
              </label>
              <textarea
                rows={2}
                className="ops-input"
                placeholder="Short customer-facing description shown on notification and food card"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '4px' }}>
                Discount (% Off) *
              </label>
              <input
                type="number"
                min="1"
                max="90"
                required
                className="ops-input"
                value={formData.discountValue}
                onChange={(e) => handleDiscountChange(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '4px' }}>
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  className="ops-input"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '4px' }}>
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  className="ops-input"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
              <input
                type="checkbox"
                id="activeOfferCheckbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
              />
              <label htmlFor="activeOfferCheckbox" style={{ fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
                Activate Offer immediately for all customers
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                className="ops-btn"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ops-btn primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : editingOffer ? 'Update Offer' : 'Create Food Offer'}
              </button>
            </div>
          </form>
        </Drawer>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Food Offer"
          message={`Are you sure you want to permanently delete the offer for "${deleteTarget.foodName || deleteTarget.title}"? The dish will revert to its regular menu price.`}
          confirmLabel="Delete Offer"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default OffersPage;
