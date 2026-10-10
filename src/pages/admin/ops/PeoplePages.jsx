import React, { useState } from 'react';
import { Plus, Pencil, Eye, EyeOff, Trash2 } from 'lucide-react';
import { api } from '../../../api/client';
import { useCatalog } from '../../../context/CatalogContext';
import { BarChart } from './charts';
import { Card, Badge, PayBadge, Segmented, Drawer, KV, Empty, ErrorBox, SkeletonBlock, ConfirmDialog, usePoll, useOps, money, num, dateTime, ago, Table } from './ui';
import { UsersTab, FoodForm, ChefForm, emptyFood, emptyChef, useList } from '../legacy';

const Search = ({ value, onChange, placeholder }) => <input className="ops-input" type="search" aria-label={placeholder} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />;

// ---- Customers ---------------------------------------------------------------------
const CustomerDrawer = ({ id, onClose }) => {
  const ops = useOps();
  const { data: c, error } = usePoll(`/admin/customers/${id}`, 0);
  return (
    <Drawer wide title={c?.name || 'Customer'} subtitle={c?.email} onClose={onClose}>
      {error && <ErrorBox message={error} />}{!c && !error && <SkeletonBlock rows={8} />}
      {c && <div className="ops-drawer-grid">
        <section className="ops-block"><h4>Profile</h4><KV rows={[['Phone', c.phone], ['Location', c.location], ['Joined', dateTime(c.joinedAt)], ['Orders', c.totalOrders], ['Total spent', money(c.totalSpent)], ['Average order', money(c.avgOrder)], ['Favourite food', c.favourite], ['Status', <Badge key="s" value={c.status} />]]} /></section>
        <section className="ops-block"><h4>Order history</h4>{c.orders.length === 0 ? <p className="muted">No orders yet.</p> : <Table className="compact"><thead><tr><th>Order</th><th>Amount</th><th>Status</th></tr></thead><tbody>{c.orders.map((o) => <tr key={o.id} className="click" onClick={() => ops.openOrder(o.id)}><td>#{o.id}<br /><small className="muted">{dateTime(o.placedAt)}</small></td><td>{money(o.total)}</td><td><Badge value={o.opsStatus} /></td></tr>)}</tbody></Table>}</section>
        <section className="ops-block"><h4>Payment history</h4>{c.payments.length === 0 ? <p className="muted">No payments yet.</p> : <Table className="compact"><thead><tr><th>Payment</th><th>Amount</th><th>Method</th><th>Status</th></tr></thead><tbody>{c.payments.map((p) => <tr key={p.id} className="click" onClick={() => ops.openPayment(p.id)}><td>{p.id}</td><td>{money(p.amount)}</td><td>{p.method}</td><td><Badge value={p.status} /></td></tr>)}</tbody></Table>}</section>
        <section className="ops-block"><h4>Addresses used</h4>{c.addresses.length === 0 ? <p className="muted">None yet.</p> : <ul className="ops-plain">{c.addresses.map((a) => <li key={`${a.address}${a.pincode}`}>{a.address}, {a.city} {a.pincode}</li>)}</ul>}</section>
        <section className="ops-block"><h4>Reviews</h4>{c.reviews.length === 0 ? <p className="muted">No reviews.</p> : <ul className="ops-plain">{c.reviews.map((r) => <li key={r.id}>{'★'.repeat(r.rating)} — {r.comment || 'No comment'} <small className="muted">({r.items.join(', ')})</small></li>)}</ul>}</section>
        <section className="ops-block"><h4>Recent activity</h4>{c.activity.length === 0 ? <p className="muted">Nothing yet.</p> : <ul className="ops-feed">{c.activity.map((e) => <li key={e.id}><span>{e.text}</span><small>{ago(e.at)}</small></li>)}</ul>}</section>
      </div>}
    </Drawer>
  );
};

export const CustomersPage = ({ focusId }) => {
  const { data, error, reload } = usePoll('/admin/customers', 15000);
  const [q, setQ] = useState('');
  const [seg, setSeg] = useState('all');
  const [open, setOpen] = useState(focusId || null);
  const [tab, setTab] = useState('customers');
  const SEG = { all: () => true, new: (c) => c.isNew, active: (c) => c.status === 'active', inactive: (c) => c.status === 'inactive', high: (c) => c.highValue, frequent: (c) => c.frequent };
  const rows = (data || []).filter(SEG[seg]).filter((c) => !q || [c.name, c.email, c.phone, c.location].some((v) => String(v || '').toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="ops-page">
      <div className="ops-toolbar"><h1>Customers</h1><Segmented label="Section" options={[['customers', 'Customer insights'], ['accounts', 'Customer accounts']]} value={tab} onChange={setTab} /></div>
      {tab === 'accounts' && <Card><UsersTab /></Card>}
      {tab === 'customers' && <>
        <div className="ops-filters"><Search value={q} onChange={setQ} placeholder="Search name, email, phone, location" />
          <Segmented label="Segment" value={seg} onChange={setSeg} options={[['all', 'All'], ['new', 'New (7 d)'], ['active', 'Active (30 d)'], ['inactive', 'Inactive'], ['high', 'High value ≥ ₹2,000'], ['frequent', 'Frequent (5+ orders)']]} /></div>
        {error && !data && <ErrorBox message={error} onRetry={reload} />}{!data && !error && <SkeletonBlock rows={8} />}
        {data && (rows.length === 0 ? <Empty title={data.length ? 'No customers match' : 'No customers yet'} /> : <Card pad={false}><Table><thead><tr><th>Customer</th><th>Phone</th><th>Location</th><th>Orders</th><th>Today</th><th>Total spent</th><th>Avg order</th><th>Last order</th><th>Favourite</th><th>Status</th></tr></thead>
          <tbody>{rows.map((c) => <tr key={c.id} className="click" onClick={() => setOpen(c.id)}><td><strong>{c.name}</strong><br /><small className="muted">{c.email}</small></td><td>{c.phone || '—'}</td><td>{c.location || '—'}</td><td>{c.totalOrders}</td><td>{c.todayOrders}</td><td>{money(c.totalSpent)}</td><td>{money(c.avgOrder)}</td><td>{c.lastOrder ? ago(c.lastOrder) : '—'}</td><td>{c.favourite || '—'}</td><td><Badge value={c.status} /></td></tr>)}</tbody></Table></Card>)}
      </>}
      {open && <CustomerDrawer id={open} onClose={() => setOpen(null)} />}
    </div>
  );
};

// ---- Chefs ---------------------------------------------------------------------------
const ChefDrawer = ({ id, onClose, onEdit }) => {
  const ops = useOps();
  const { data: d, error } = usePoll(`/admin/insights/chefs/${id}`, 0);
  return (
    <Drawer wide title={d?.chef.name || 'Chef'} subtitle={d && `${d.chef.city} · ${d.chef.cuisine}`} onClose={onClose} footer={<button type="button" className="ops-btn" onClick={onEdit}><Pencil size={14} /> Edit chef</button>}>
      {error && <ErrorBox message={error} />}{!d && !error && <SkeletonBlock rows={8} />}
      {d && <div className="ops-drawer-grid">
        <section className="ops-block"><h4>Performance</h4><KV rows={[['Orders (all time)', d.performance.orders], ['Cancelled', d.performance.cancelled], ['Avg prep time', `${d.performance.avgPrepMinutes} min`], ['Rating', d.chef.rating || '—']]} />
          <h4>Revenue, last 7 days</h4><BarChart data={d.daily.map((x) => ({ key: x.date, label: x.label, value: x.revenue }))} prefix="₹" height={150} /></section>
        <section className="ops-block"><h4>Menu</h4><Table className="compact"><thead><tr><th>Dish</th><th>Price</th><th>Sold</th><th>Visible</th></tr></thead><tbody>{d.menu.map((f) => <tr key={f.id} className={f.available ? '' : 'dim'}><td>{f.name}</td><td>{money(f.price)}</td><td>{f.totalQty}</td><td>{f.available ? 'Yes' : 'Hidden'}</td></tr>)}</tbody></Table></section>
        <section className="ops-block"><h4>Today&apos;s orders</h4>{d.todayOrders.length === 0 ? <p className="muted">None today.</p> : <Table className="compact"><tbody>{d.todayOrders.map((o) => <tr key={o.id} className="click" onClick={() => ops.openOrder(o.id)}><td>#{o.id}</td><td>{o.customer}</td><td><Badge value={o.opsStatus} /></td></tr>)}</tbody></Table>}</section>
        <section className="ops-block"><h4>Reviews</h4>{d.reviews.length === 0 ? <p className="muted">No reviews yet.</p> : <ul className="ops-plain">{d.reviews.map((r) => <li key={r.id}>{'★'.repeat(r.rating)} {r.comment || 'No comment'} <small className="muted">— {r.customer}</small></li>)}</ul>}</section>
      </div>}
    </Drawer>
  );
};

export const ChefsPage = () => {
  const { reload: reloadCatalog } = useCatalog();
  const ops = useOps();
  const { data, error, reload } = usePoll('/admin/insights/chefs', 15000);
  const chefs = useList('/admin/chefs');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const [form, setForm] = useState(null);
  const [del, setDel] = useState(null);
  const rows = (data || []).filter((c) => !q || [c.name, c.city, c.cuisine].some((v) => String(v || '').toLowerCase().includes(q.toLowerCase())));
  const done = async () => { setForm(null); await Promise.all([reload(), chefs.reload()]); reloadCatalog(); };
  return (
    <div className="ops-page">
      <div className="ops-toolbar"><h1>Chefs / home cooks</h1><button type="button" className="ops-btn primary" onClick={() => setForm(emptyChef)}><Plus size={14} /> Add chef</button></div>
      <div className="ops-filters"><Search value={q} onChange={setQ} placeholder="Search chef, city or cuisine" /></div>
      {error && !data && <ErrorBox message={error} onRetry={reload} />}{!data && !error && <SkeletonBlock rows={8} />}
      {data && (rows.length === 0 ? <Empty title="No chefs found" /> : <Card pad={false}><Table><thead><tr><th>Chef</th><th>Location</th><th>Cuisine</th><th>Active dishes</th><th>Orders today</th><th>Revenue today</th><th>Rating</th><th>Prep time</th><th>Availability</th><th /></tr></thead>
        <tbody>{rows.map((c) => <tr key={c.id} className="click" onClick={() => setOpen(c.id)}><td><strong>{c.name}</strong></td><td>{c.city}</td><td>{c.cuisine}</td><td>{c.activeDishes} / {c.totalDishes}</td><td>{c.ordersToday}</td><td>{money(c.revenueToday)}</td><td>{c.rating || '—'}</td><td>{c.prepMinutes ? `${c.prepMinutes} min` : '—'}</td><td><Badge value={c.available ? 'active' : 'inactive'}>{c.available ? 'Available' : 'No dishes live'}</Badge></td>
          <td className="ops-actions" onClick={(e) => e.stopPropagation()}><button type="button" className="ops-icon" aria-label={`Edit ${c.name}`} onClick={() => setForm(chefs.rows?.find((x) => x.id === c.id))}><Pencil size={15} /></button><button type="button" className="ops-icon" aria-label={`Delete ${c.name}`} onClick={() => setDel(c)}><Trash2 size={15} /></button></td></tr>)}</tbody></Table></Card>)}
      {open && <ChefDrawer id={open} onClose={() => setOpen(null)} onEdit={() => { setForm(chefs.rows?.find((x) => x.id === open)); setOpen(null); }} />}
      {form && <ChefForm initial={form} onClose={() => setForm(null)} onSaved={done} />}
      {del && <ConfirmDialog danger title={`Delete ${del.name}?`} message="A chef who still has dishes cannot be deleted. Move or delete the dishes first." confirmLabel="Delete chef" onCancel={() => setDel(null)} onConfirm={async () => { try { await api(`/admin/chefs/${del.id}`, { method: 'DELETE' }); ops.toast('Chef deleted'); await done(); } catch (e) { ops.toast(e.message, 'bad'); } setDel(null); }} />}
    </div>
  );
};

// ---- Menu ----------------------------------------------------------------------------
export const MenuPage = () => {
  const { reload: reloadCatalog } = useCatalog();
  const ops = useOps();
  const foods = usePoll('/admin/foods', 0);
  const stats = usePoll('/admin/insights/foods', 15000);
  const chefs = usePoll('/admin/chefs', 0);
  const [f, setF] = useState({ q: '', category: '', chefId: '', avail: '', diet: '' });
  const [form, setForm] = useState(null);
  const [del, setDel] = useState(null);
  const [perf, setPerf] = useState(null);
  const st = new Map((stats.data || []).map((s) => [s.id, s]));
  const chefName = new Map((chefs.data || []).map((c) => [c.id, c.name]));
  const rows = (foods.data || []).filter((x) => (!f.q || `${x.name} ${x.nameTa}`.toLowerCase().includes(f.q.toLowerCase())) && (!f.category || x.category === f.category) && (!f.chefId || x.chefId === f.chefId)
    && (!f.avail || (f.avail === 'on') === !!x.available) && (!f.diet || (f.diet === 'veg' ? x.diet !== 'non-veg' : x.diet === 'non-veg')));
  const refresh = async () => { await foods.reload(); stats.reload(); reloadCatalog(); };
  const toggle = async (x) => { try { await api(`/admin/foods/${x.id}`, { method: 'PATCH', body: { available: !x.available } }); ops.toast(x.available ? 'Dish hidden' : 'Dish visible'); refresh(); } catch (e) { ops.toast(e.message, 'bad'); } };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="ops-page">
      <div className="ops-toolbar"><h1>Menu management</h1><button type="button" className="ops-btn primary" onClick={() => setForm({ ...emptyFood, chefId: chefs.data?.[0]?.id || '' })}><Plus size={14} /> Add dish</button></div>
      <div className="ops-filters"><Search value={f.q} onChange={(v) => setF({ ...f, q: v })} placeholder="Search dishes" />
        <select value={f.category} onChange={set('category')} aria-label="Category"><option value="">All categories</option>{['breakfast', 'lunch', 'dinner', 'snacks', 'sweets', 'drinks', 'brunch'].map((c) => <option key={c} value={c}>{c}</option>)}</select>
        <select value={f.chefId} onChange={set('chefId')} aria-label="Chef"><option value="">All chefs</option>{(chefs.data || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select value={f.avail} onChange={set('avail')} aria-label="Availability"><option value="">Any availability</option><option value="on">Available</option><option value="off">Hidden</option></select>
        <select value={f.diet} onChange={set('diet')} aria-label="Veg or non-veg"><option value="">Veg + non-veg</option><option value="veg">Veg</option><option value="nonveg">Non-veg</option></select></div>
      {foods.error && !foods.data && <ErrorBox message={foods.error} onRetry={foods.reload} />}{!foods.data && !foods.error && <SkeletonBlock rows={8} />}
      {foods.data && (rows.length === 0 ? <Empty title="No dishes match these filters" /> : <Card pad={false}><Table><thead><tr><th>Dish</th><th>Category</th><th>Chef</th><th>Price</th><th>Orders today</th><th>Rating</th><th>Prep</th><th>Status</th><th /></tr></thead>
        <tbody>{rows.map((x) => <tr key={x.id} className={x.available ? '' : 'dim'}>
          <td><div className="ops-person">{x.photo ? <img className="ops-thumb" src={x.photo} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'inline-flex'; }} /> : null}<span className="ops-thumb ph" style={x.photo ? { display: 'none' } : undefined}>{x.name[0]}</span><div><strong>{x.name}</strong><br /><small className="muted">{x.diet}</small></div></div></td>
          <td>{x.category}</td><td>{chefName.get(x.chefId) || '—'}</td><td>{money(x.price)}</td><td>{st.get(x.id)?.qtyToday ?? 0}</td><td>{x.rating || '—'}</td><td>{x.prepMinutes} min</td><td><Badge value={x.available ? 'active' : 'inactive'}>{x.available ? 'Available' : 'Hidden'}</Badge></td>
          <td className="ops-actions"><button type="button" className="ops-icon" aria-label={`Edit ${x.name}`} onClick={() => setForm({ ...x, tags: (x.tags || []).join(', '), photo: x.photo || '' })}><Pencil size={15} /></button>
            <button type="button" className="ops-icon" aria-label={x.available ? `Hide ${x.name}` : `Show ${x.name}`} onClick={() => toggle(x)}>{x.available ? <Eye size={15} /> : <EyeOff size={15} />}</button>
            <button type="button" className="ops-btn sm" onClick={() => setPerf(x)}>Performance</button>
            <button type="button" className="ops-icon" aria-label={`Delete ${x.name}`} onClick={() => setDel(x)}><Trash2 size={15} /></button></td></tr>)}</tbody></Table></Card>)}
      {form && <FoodForm initial={form} chefs={chefs.data || []} onClose={() => setForm(null)} onSaved={async () => { setForm(null); await refresh(); ops.toast('Dish saved'); }} />}
      {del && <ConfirmDialog danger title={`Delete ${del.name}?`} message="Past orders keep their own copy of the dish name and price." confirmLabel="Delete dish" onCancel={() => setDel(null)} onConfirm={async () => { try { await api(`/admin/foods/${del.id}`, { method: 'DELETE' }); ops.toast('Dish deleted'); await refresh(); } catch (e) { ops.toast(e.message, 'bad'); } setDel(null); }} />}
      {perf && <Drawer title={perf.name} subtitle="Dish performance" onClose={() => setPerf(null)}><KV rows={[['Sold today', st.get(perf.id)?.qtyToday ?? 0], ['Orders today', st.get(perf.id)?.ordersToday ?? 0], ['Sold (all time)', st.get(perf.id)?.totalQty ?? 0], ['Revenue (all time)', money(st.get(perf.id)?.revenue ?? 0)], ['Rating', perf.rating || '—'], ['Customer reviews', num(perf.reviews)]]} /></Drawer>}
    </div>
  );
};
