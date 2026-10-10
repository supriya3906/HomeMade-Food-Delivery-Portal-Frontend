import React, { useEffect, useState, useCallback } from 'react';
import { Trash2, X, Check } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useT } from '../../i18n/useT';
import { formatDate } from '../../utils/format';
import { CATEGORY_IDS } from '../../data/categories';


// ---- small reusable pieces -------------------------------------------------
export const Field = ({ label, children }) => (
  <label className="form-group admin-field"><span className="form-label">{label}</span>{children}</label>
);

export const Modal = ({ title, onClose, children }) => (
  <div className="drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div className="admin-modal" role="dialog" aria-modal="true" aria-label={title}>
      <header className="drawer-head"><h2>{title}</h2><button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button></header>
      <div className="admin-modal-body">{children}</div>
    </div>
  </div>
);

export const useList = (path) => {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(() => api(path).then((r) => { setRows(r); setError(''); }).catch((e) => setError(e.message)), [path]);
  useEffect(() => { load(); }, [load]);
  return { rows, error, reload: load };
};

export const ConfirmButton = ({ onConfirm, label, ask }) => {
  const [asking, setAsking] = useState(false);
  return asking ? (
    <span className="confirm-inline">
      <span className="muted">{ask}</span>
      <button type="button" className="btn btn-danger btn-sm" onClick={() => { setAsking(false); onConfirm(); }}>{label}</button>
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAsking(false)}><X size={14} /></button>
    </span>
  ) : (
    <button type="button" className="icon-btn" onClick={() => setAsking(true)} aria-label={label} title={label}><Trash2 size={16} /></button>
  );
};

// ---- Users -----------------------------------------------------------------
export const UsersTab = () => {
  const { t, language } = useT();
  const { user: me } = useAuth();
  const { rows, error, reload } = useList('/admin/users');
  const [msg, setMsg] = useState('');
  const act = async (fn) => { setMsg(''); try { await fn(); await reload(); } catch (e) { setMsg(e.message); } };
  if (error) return <p className="form-error">{error}</p>;
  if (!rows) return <p className="muted">{t('common.loading')}</p>;
  return (
    <>
      {msg && <p className="form-error" role="alert">{msg}</p>}
      <div className="table-wrap"><table className="admin-table" data-testid="users-table">
        <thead><tr><th>{t('prof.name')}</th><th>{t('prof.email')}</th><th>{t('admin.col.signup')}</th><th>{t('admin.col.joined')}</th><th>{t('admin.col.orders')}</th><th>{t('admin.col.spent')}</th><th>{t('admin.col.role')}</th><th /></tr></thead>
        <tbody>{rows.map((u) => (
          <tr key={u.id}>
            <td>{u.name}</td><td>{u.email}</td><td>{u.provider === 'google' ? 'Google' : t('admin.password')}</td>
            <td>{formatDate(u.createdAt, language, false)}</td><td>{u.orders}</td><td>₹{u.spent}</td>
            <td>
              <span className={`badge ${u.role === 'admin' ? 'badge-primary' : 'badge-neutral'}`} style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                {u.role === 'admin' ? (t('admin.role.admin') || 'Administrator') : (t('admin.role.user') || 'Customer')}
              </span>
            </td>
            <td>{u.id !== me.id && <ConfirmButton ask={t('admin.deleteUserAsk')} label={t('common.delete')} onConfirm={() => act(() => api(`/admin/users/${u.id}`, { method: 'DELETE' }))} />}</td>
          </tr>))}</tbody>
      </table></div>
    </>
  );
};

// ---- Foods -----------------------------------------------------------------
export const emptyFood = { name: '', nameTa: '', category: 'lunch', chefId: '', price: '', diet: 'veg', spice: 'Mild', prepMinutes: 20, description: '', descriptionTa: '', photo: '', tags: '' };
export const FoodForm = ({ initial, chefs, onClose, onSaved }) => {
  const { t } = useT();
  const [f, setF] = useState(initial);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    const body = { name: f.name, nameTa: f.nameTa, category: f.category, chefId: f.chefId, price: Number(f.price), diet: f.diet, spice: f.spice,
      prepMinutes: Number(f.prepMinutes), description: f.description, descriptionTa: f.descriptionTa, photo: f.photo, tags: f.tags };
    try {
      if (f.id) await api(`/admin/foods/${f.id}`, { method: 'PATCH', body }); else await api('/admin/foods', { method: 'POST', body });
      onSaved();
    } catch (e2) { setErr(e2.message); }
  };
  return (
    <Modal title={f.id ? t('admin.editDish') : t('admin.addDish')} onClose={onClose}>
      <form onSubmit={submit} className="admin-form">
        <Field label={`${t('admin.col.dish')} (English)`}><input className="form-input" required value={f.name} onChange={set('name')} /></Field>
        <Field label={`${t('admin.col.dish')} (தமிழ்)`}><input className="form-input" value={f.nameTa} onChange={set('nameTa')} /></Field>
        <div className="form-grid">
          <Field label={t('admin.col.category')}><select className="form-input" value={f.category} onChange={set('category')}>{CATEGORY_IDS.map((c) => <option key={c} value={c}>{t(`cat.${c}`)}</option>)}</select></Field>
          <Field label={t('admin.col.chef')}><select className="form-input" required value={f.chefId} onChange={set('chefId')}>{chefs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <Field label={`${t('admin.col.price')} (₹)`}><input className="form-input" type="number" min="1" required value={f.price} onChange={set('price')} /></Field>
          <Field label={t('admin.prep')}><input className="form-input" type="number" min="1" value={f.prepMinutes} onChange={set('prepMinutes')} /></Field>
          <Field label={t('admin.diet')}><select className="form-input" value={f.diet} onChange={set('diet')}>{['veg', 'vegan', 'non-veg'].map((d) => <option key={d} value={d}>{t(`diet.${d}`)}</option>)}</select></Field>
          <Field label={t('admin.spice')}><select className="form-input" value={f.spice} onChange={set('spice')}>{['None', 'Mild', 'Medium', 'Hot'].map((d) => <option key={d} value={d}>{t(`spice.${d}`)}</option>)}</select></Field>
        </div>
        <Field label={`${t('admin.desc')} (English)`}><textarea className="form-input" rows="2" value={f.description} onChange={set('description')} /></Field>
        <Field label={`${t('admin.desc')} (தமிழ்)`}><textarea className="form-input" rows="2" value={f.descriptionTa} onChange={set('descriptionTa')} /></Field>
        <Field label={t('admin.photo')}><input className="form-input" placeholder="https://… or /images/foods/f01.jpg" value={f.photo} onChange={set('photo')} /></Field>
        <Field label={t('admin.tags')}><input className="form-input" value={f.tags} onChange={set('tags')} /></Field>
        {err && <p className="form-error" role="alert">{err}</p>}
        <button type="submit" className="btn btn-primary btn-block"><Check size={16} /> {t('common.save')}</button>
      </form>
    </Modal>
  );
};

// ---- Chefs -----------------------------------------------------------------
export const emptyChef = { name: '', nameTa: '', city: '', cityTa: '', cuisine: '', cuisineTa: '', speciality: '', specialityTa: '', bio: '', bioTa: '', experience: 5, color: '#2F6B4F' };
export const ChefForm = ({ initial, onClose, onSaved }) => {
  const { t } = useT();
  const [c, setC] = useState(initial);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setC({ ...c, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    const { id, rating, orders, ...body } = c;
    body.experience = Number(body.experience);
    body.lat = body.lat === '' || body.lat == null ? '' : Number(body.lat);
    body.lng = body.lng === '' || body.lng == null ? '' : Number(body.lng);
    try { if (id) await api(`/admin/chefs/${id}`, { method: 'PATCH', body }); else await api('/admin/chefs', { method: 'POST', body }); onSaved(); } catch (e2) { setErr(e2.message); }
  };
  return (
    <Modal title={c.id ? t('admin.editChef') : t('admin.addChef')} onClose={onClose}>
      <form onSubmit={submit} className="admin-form">
        <div className="form-grid">
          <Field label="Name (English)"><input className="form-input" required value={c.name} onChange={set('name')} /></Field>
          <Field label="பெயர் (தமிழ்)"><input className="form-input" value={c.nameTa} onChange={set('nameTa')} /></Field>
          <Field label="City"><input className="form-input" value={c.city} onChange={set('city')} /></Field>
          <Field label="நகரம்"><input className="form-input" value={c.cityTa} onChange={set('cityTa')} /></Field>
          <Field label="Cuisine"><input className="form-input" value={c.cuisine} onChange={set('cuisine')} /></Field>
          <Field label="உணவு வகை"><input className="form-input" value={c.cuisineTa} onChange={set('cuisineTa')} /></Field>
        </div>
        <Field label="Speciality"><input className="form-input" value={c.speciality} onChange={set('speciality')} /></Field>
        <Field label="சிறப்பு"><input className="form-input" value={c.specialityTa} onChange={set('specialityTa')} /></Field>
        <Field label="Bio"><textarea className="form-input" rows="2" value={c.bio} onChange={set('bio')} /></Field>
        <Field label="சுயவிவரம்"><textarea className="form-input" rows="2" value={c.bioTa} onChange={set('bioTa')} /></Field>
        <div className="form-grid">
          <Field label={t('admin.years')}><input className="form-input" type="number" min="0" value={c.experience} onChange={set('experience')} /></Field>
          <Field label={t('admin.color')}><input className="form-input" value={c.color} onChange={set('color')} /></Field>
          <Field label="Kitchen latitude (for delivery distance)"><input className="form-input" inputMode="decimal" placeholder="e.g. 9.5127" value={c.lat ?? ''} onChange={set('lat')} /></Field>
          <Field label="Kitchen longitude"><input className="form-input" inputMode="decimal" placeholder="e.g. 77.6337" value={c.lng ?? ''} onChange={set('lng')} /></Field>
        </div>
        {err && <p className="form-error" role="alert">{err}</p>}
        <button type="submit" className="btn btn-primary btn-block"><Check size={16} /> {t('common.save')}</button>
      </form>
    </Modal>
  );
};

