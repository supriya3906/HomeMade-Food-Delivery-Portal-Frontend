import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Phone, Route, History, Power } from 'lucide-react';
import { api } from '../../../api/client';
import DeliveryMap from './DeliveryMap';
import { PartnerPicker } from './OrderDrawer';
import { Card, Badge, Segmented, Drawer, KV, Empty, ErrorBox, SkeletonBlock, ConfirmDialog, usePoll, useOps, money, dateTime, Table } from './ui';
import { Modal, Field } from '../legacy';

// ---- Delivery operations: dispatch queue + zones + map -------------------------------
export const DeliveryOpsPage = () => {
  const ops = useOps();
  const live = usePoll('/admin/orders/live', 5000);
  const zones = usePoll('/admin/delivery/zones', 10000);
  const dash = usePoll('/admin/dashboard?range=today', 8000);
  const [tab, setTab] = useState('dispatch');
  const [picked, setPicked] = useState(null);
  const [zoneForm, setZoneForm] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const rec = usePoll(picked ? `/admin/delivery/recommendations/${picked}` : null, 0);
  const queue = live.data
    ? [...new Map(Object.values(live.data.board).flat().filter((o) => o.needsPartner).map((o) => [o.id, o])).values()]
        .sort((a, b) => String(b.placedAt).localeCompare(String(a.placedAt)))
    : [];

  useEffect(() => {
    if (picked && queue.length > 0 && !queue.some((o) => o.id === picked)) {
      setPicked(null);
    }
  }, [picked, queue]);

  const assign = async (partnerId) => {
    if (!picked) return;
    setAssigning(true);
    try {
      await api(`/admin/orders/${picked}/assign-partner`, { method: 'POST', body: { partnerId } });
      ops.toast('Delivery partner assigned successfully');
      setPicked(null);
      await live.reload();
      ops.refresh();
    } catch (e) {
      ops.toast(e.message, 'bad');
    } finally {
      setAssigning(false);
    }
  };
  return (
    <div className="ops-page">
      <div className="ops-toolbar"><h1>Delivery operations</h1><Segmented label="Section" options={[['dispatch', 'Dispatch queue'], ['zones', 'Zones']]} value={tab} onChange={setTab} /></div>
      {tab === 'dispatch' && (
        <div className="ops-grid two">
          <Card title={`Orders waiting for a delivery partner (${queue.length})`} pad={false}>
            {live.error && !live.data && <ErrorBox message={live.error} onRetry={live.reload} />}
            {live.data && queue.length === 0 && <div className="ops-card-body"><Empty title="Every open order has a partner" /></div>}
            {queue.length > 0 && <Table><thead><tr><th>Order</th><th>Delivery location</th><th>Status</th><th /></tr></thead><tbody>{queue.map((o) => (
              <tr key={o.id} className={picked === o.id ? 'sel' : ''}><td>#{o.id}<br /><small className="muted">{o.customer}</small></td><td>{o.zone || o.city || 'Unknown'}</td><td><Badge value={o.opsStatus} /></td>
                <td><button type="button" className="ops-btn sm primary" onClick={() => setPicked(o.id)}>Find Partner</button> <button type="button" className="ops-btn sm" onClick={() => ops.openOrder(o.id)}>Details</button></td></tr>))}</tbody></Table>}
          </Card>
          <Card title={picked ? `Recommendation for #${picked}` : 'Recommendation'}>
            {!picked && <Empty title="Choose an order" hint="Partners are ranked by distance to the customer, availability, current load and zone." />}
            {picked && !rec.data && <SkeletonBlock rows={5} />}
            {picked && rec.data && <PartnerPicker rec={rec.data} current={null} onPick={assign} busy={assigning} />}
          </Card>
        </div>
      )}
      {tab === 'zones' && <>
        <Card title="Zones" action={<button type="button" className="ops-btn primary sm" onClick={() => setZoneForm({ name: '', lat: '', lng: '', radiusKm: 8, keywords: '' })}><Plus size={14} /> Add zone</button>} pad={false}>
          {zones.error && !zones.data && <ErrorBox message={zones.error} onRetry={zones.reload} />}
          {!zones.data && !zones.error && <SkeletonBlock rows={5} />}
          {zones.data && <Table><thead><tr><th>Zone</th><th>Active partners</th><th>Orders today</th><th>Open orders</th><th>Pending (no partner)</th><th>Avg delivery time</th><th /></tr></thead>
            <tbody>{zones.data.map((z) => <tr key={z.id} className={z.active ? '' : 'dim'}><td><strong>{z.name}</strong><br /><small className="muted">{z.lat.toFixed(3)}, {z.lng.toFixed(3)} · {z.radiusKm} km</small></td><td>{z.activePartners} / {z.partners}</td><td>{z.ordersToday}</td><td>{z.openOrders}</td><td>{z.pendingOrders ? <Badge tone="warn">{z.pendingOrders}</Badge> : 0}</td><td>{z.avgDeliveryMin ? `${z.avgDeliveryMin} min` : '—'}</td>
              <td><button type="button" className="ops-icon" aria-label={`Edit ${z.name}`} onClick={() => setZoneForm({ ...z, keywords: (z.keywords || []).join(', ') })}><Pencil size={15} /></button></td></tr>)}</tbody></Table>}
        </Card>
        <Card title="Zones and partners on the map">{dash.data ? <DeliveryMap zones={dash.data.zones} partners={dash.data.partners} orders={dash.data.mapOrders} height={320} /> : <SkeletonBlock rows={5} />}</Card>
      </>}
      {zoneForm && <ZoneForm initial={zoneForm} onClose={() => setZoneForm(null)} onSaved={() => { setZoneForm(null); zones.reload(); }} />}
    </div>
  );
};

const ZoneForm = ({ initial, onClose, onSaved }) => {
  const ops = useOps();
  const [z, setZ] = useState(initial);
  const [err, setErr] = useState('');
  const [del, setDel] = useState(false);
  const set = (k) => (e) => setZ({ ...z, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault(); setErr('');
    const body = { name: z.name, lat: Number(z.lat), lng: Number(z.lng), radiusKm: Number(z.radiusKm), keywords: z.keywords, ...(z.id ? { active: z.active } : {}) };
    try { await (z.id ? api(`/admin/delivery/zones/${z.id}`, { method: 'PATCH', body }) : api('/admin/delivery/zones', { method: 'POST', body })); ops.toast('Zone saved'); onSaved(); } catch (e2) { setErr(e2.message); }
  };
  return (
    <Modal title={z.id ? `Edit zone: ${initial.name}` : 'Add delivery zone'} onClose={onClose}>
      <form onSubmit={save} className="admin-form">
        <Field label="Zone name"><input className="form-input" required value={z.name} onChange={set('name')} /></Field>
        <div className="form-grid">
          <Field label="Centre latitude"><input className="form-input" required inputMode="decimal" value={z.lat} onChange={set('lat')} /></Field>
          <Field label="Centre longitude"><input className="form-input" required inputMode="decimal" value={z.lng} onChange={set('lng')} /></Field>
          <Field label="Radius (km)"><input className="form-input" type="number" min="1" step="0.5" value={z.radiusKm} onChange={set('radiusKm')} /></Field>
        </div>
        <Field label="Matching words (town names, PIN codes — comma separated)"><input className="form-input" value={z.keywords} onChange={set('keywords')} placeholder="srivilliputhur, 626125" /></Field>
        <p className="muted small">A customer&apos;s address city / PIN code containing one of these words is placed in this zone. Customers who share their location at checkout are placed by GPS.</p>
        {z.id && <label className="ops-check"><input type="checkbox" checked={z.active !== false} onChange={(e) => setZ({ ...z, active: e.target.checked })} /> Zone is active</label>}
        {err && <p className="form-error" role="alert">{err}</p>}
        <div className="ops-dialog-actions">{z.id && <button type="button" className="ops-btn danger" onClick={() => setDel(true)}>Delete zone</button>}<button type="submit" className="ops-btn primary">Save zone</button></div>
      </form>
      {del && <ConfirmDialog danger title="Delete this zone?" message="Partners must be moved out of the zone first." confirmLabel="Delete zone" onCancel={() => setDel(false)} onConfirm={async () => { try { await api(`/admin/delivery/zones/${z.id}`, { method: 'DELETE' }); ops.toast('Zone deleted'); onSaved(); } catch (e) { setErr(e.message); setDel(false); } }} />}
    </Modal>
  );
};

// ---- Delivery partners ---------------------------------------------------------------
const PartnerForm = ({ initial, zones, onClose, onSaved }) => {
  const ops = useOps();
  const [p, setP] = useState(initial);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setP({ ...p, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault(); setErr('');
    const body = { name: p.name, phone: p.phone, vehicle: p.vehicle, vehicleNo: p.vehicleNo, zoneId: p.zoneId || '', maxOrders: Number(p.maxOrders) || 2, lat: p.lat === '' || p.lat == null ? '' : Number(p.lat), lng: p.lng === '' || p.lng == null ? '' : Number(p.lng) };
    try { await (p.id ? api(`/admin/partners/${p.id}`, { method: 'PATCH', body }) : api('/admin/partners', { method: 'POST', body })); ops.toast(p.id ? 'Partner updated' : 'Partner added'); onSaved(); } catch (e2) { setErr(e2.message); }
  };
  return (
    <Modal title={p.id ? `Edit ${initial.name}` : 'Add delivery partner'} onClose={onClose}>
      <form onSubmit={save} className="admin-form">
        <div className="form-grid">
          <Field label="Name"><input className="form-input" required value={p.name} onChange={set('name')} /></Field>
          <Field label="Phone"><input className="form-input" value={p.phone} onChange={set('phone')} /></Field>
          <Field label="Vehicle"><input className="form-input" placeholder="Bike, scooter, cycle" value={p.vehicle} onChange={set('vehicle')} /></Field>
          <Field label="Vehicle number"><input className="form-input" value={p.vehicleNo} onChange={set('vehicleNo')} /></Field>
          <Field label="Assigned zone"><select className="form-input" value={p.zoneId || ''} onChange={set('zoneId')}><option value="">No zone</option>{zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}</select></Field>
          <Field label="Max active orders"><input className="form-input" type="number" min="1" max="10" value={p.maxOrders} onChange={set('maxOrders')} /></Field>
          <Field label="Base latitude"><input className="form-input" inputMode="decimal" value={p.lat ?? ''} onChange={set('lat')} /></Field>
          <Field label="Base longitude"><input className="form-input" inputMode="decimal" value={p.lng ?? ''} onChange={set('lng')} /></Field>
        </div>
        <p className="muted small">The base position is where the partner usually waits. Live GPS, when a partner app reports it, replaces it automatically. Leave blank to use the zone centre.</p>
        {err && <p className="form-error" role="alert">{err}</p>}
        <button type="submit" className="ops-btn primary">Save partner</button>
      </form>
    </Modal>
  );
};

export const PartnersPage = () => {
  const ops = useOps();
  const { data, error, reload } = usePoll('/admin/delivery/partners', 6000);
  const zones = usePoll('/admin/delivery/zones', 0);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState(null);
  const [detail, setDetail] = useState(null);
  const [assignFor, setAssignFor] = useState(null);
  const patch = async (p, body, msg) => { try { await api(`/admin/partners/${p.id}`, { method: 'PATCH', body }); ops.toast(msg); reload(); } catch (e) { ops.toast(e.message, 'bad'); } };
  const rows = data ? data.partners.filter((p) => filter === 'all' || p.status === filter) : [];
  const counts = data?.counts || {};
  return (
    <div className="ops-page">
      <div className="ops-toolbar"><h1>Delivery partners</h1>
        <div className="ops-toolbar-right"><Segmented label="Filter" value={filter} onChange={setFilter} options={[['all', `All (${counts.all ?? 0})`], ['available', `Available (${counts.available ?? 0})`], ['on_delivery', `On delivery (${counts.on_delivery ?? 0})`], ['offline', `Offline (${counts.offline ?? 0})`]]} />
          <button type="button" className="ops-btn primary" onClick={() => setForm({ name: '', phone: '', vehicle: '', vehicleNo: '', zoneId: '', maxOrders: 2, lat: '', lng: '' })}><Plus size={14} /> Add partner</button></div></div>
      {error && !data && <ErrorBox message={error} onRetry={reload} />}
      {!data && !error && <SkeletonBlock rows={6} />}
      {data && rows.length === 0 && <Empty title={data.partners.length ? 'No partners in this status' : 'No delivery partners yet'} hint={data.partners.length ? '' : 'Add partners with a zone and position so orders can be matched by location.'} />}
      {rows.length > 0 && <Card pad={false}><Table className="partners"><thead><tr><th>Partner</th><th>Vehicle</th><th>Zone / location</th><th>Status</th><th>Current order</th><th>Today</th><th>Completed</th><th>Avg time</th><th>Rating</th><th /></tr></thead>
        <tbody>{rows.map((p) => (
          <tr key={p.id} className={p.active ? '' : 'dim'}>
            <td><div className="ops-person"><span className="ops-avatar">{p.initials}</span><div><strong>{p.name}</strong><br /><small className="muted">{p.phone || 'no phone'}</small></div></div></td>
            <td>{p.vehicle || '—'}<br /><small className="muted">{p.vehicleNo}</small></td>
            <td>{p.zone || 'No zone'}<br /><small className="muted">{p.lat !== null ? `${p.lat.toFixed(3)}, ${p.lng.toFixed(3)} · ${p.positionSource === 'gps' ? 'live GPS' : p.positionSource === 'zone' ? 'zone centre' : 'last known'}` : 'unknown'}</small></td>
            <td><Badge value={p.active ? p.status : 'offline'} />{!p.active && <small className="muted"> disabled</small>}</td>
            <td>{p.currentOrder ? <button type="button" className="ops-link" onClick={() => ops.openOrder(p.currentOrder.id)}>#{p.currentOrder.id}</button> : '—'}{p.activeOrders > 1 && <small className="muted"> +{p.activeOrders - 1}</small>}</td>
            <td>{p.deliveriesToday}</td><td>{p.completed}</td><td>{p.avgDeliveryMin ? `${p.avgDeliveryMin} min` : '—'}</td><td>{p.rating ?? '—'}{p.ratings ? <small className="muted"> ({p.ratings})</small> : ''}</td>
            <td className="ops-actions">
              <button type="button" className="ops-btn sm" onClick={() => setDetail(p)}>View details</button>
              <button type="button" className="ops-btn sm" disabled={p.status !== 'available'} onClick={() => setAssignFor(p)}>Assign order</button>
              <button type="button" className="ops-icon" title={p.active ? 'Disable partner' : 'Enable partner'} aria-label={p.active ? `Disable ${p.name}` : `Enable ${p.name}`} onClick={() => patch(p, { active: !p.active }, p.active ? 'Partner disabled' : 'Partner enabled')}><Power size={15} /></button>
              <button type="button" className="ops-icon" title={p.online ? 'Set offline' : 'Set online'} aria-label={p.online ? `Set ${p.name} offline` : `Set ${p.name} online`} onClick={() => patch(p, { online: !p.online }, p.online ? `${p.name} is offline` : `${p.name} is online`)}>{p.online ? '●' : '○'}</button>
            </td></tr>))}</tbody></Table></Card>}
      {form && <PartnerForm initial={form} zones={zones.data || []} onClose={() => setForm(null)} onSaved={() => { setForm(null); reload(); }} />}
      {detail && <PartnerDrawer p={detail} onClose={() => setDetail(null)} onEdit={() => { setForm({ ...detail }); setDetail(null); }} />}
      {assignFor && <AssignOrder partner={assignFor} onClose={() => setAssignFor(null)} onDone={() => { setAssignFor(null); reload(); }} />}
    </div>
  );
};

const PartnerDrawer = ({ p, onClose, onEdit }) => {
  const ops = useOps();
  const hist = usePoll(`/admin/delivery/partners/${p.id}/history`, 0);
  const route = usePoll(`/admin/delivery/partners/${p.id}/route`, 5000);
  const tr = route.data?.tracking;
  return (
    <Drawer title={p.name} subtitle={`${p.vehicle || 'Vehicle not set'} ${p.vehicleNo || ''}`} onClose={onClose} footer={<><button type="button" className="ops-btn" onClick={onEdit}><Pencil size={14} /> Edit partner</button>{p.phone && <a className="ops-btn" href={`tel:${p.phone}`}><Phone size={14} /> Call</a>}</>}>
      <div className="ops-statusbar"><Badge value={p.active ? p.status : 'offline'} /><span className="muted">{p.zone || 'No zone'} · {p.completed} deliveries · rating {p.rating ?? 'not rated yet'}</span></div>
      <section className="ops-block"><h4><Route size={14} /> Current route</h4>
        {!route.data ? <SkeletonBlock rows={2} /> : !route.data.order ? <p className="muted">No active delivery.</p> : (
          <KV rows={[['Order', <button key="o" type="button" className="ops-link" onClick={() => ops.openOrder(route.data.order.id)}>#{route.data.order.id}</button>], ['To', route.data.order.location], ['Status', <Badge key="s" value={route.data.order.opsStatus} />],
            tr?.distanceKm !== null && tr?.distanceKm !== undefined ? ['Distance remaining', `${tr.distanceKm} km`] : null, tr?.etaMinutes !== null && tr?.etaMinutes !== undefined ? ['ETA', `${tr.etaMinutes} min`] : null, tr?.partner ? ['Position source', tr.partner.source === 'gps' ? 'Live GPS' : 'Estimated'] : null]} />)}</section>
      <section className="ops-block"><h4><History size={14} /> Delivery history</h4>
        {!hist.data ? <SkeletonBlock rows={3} /> : hist.data.length === 0 ? <p className="muted">No deliveries yet.</p> : <Table className="compact"><thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Time</th><th>Status</th></tr></thead><tbody>{hist.data.map((o) => <tr key={o.id} className="click" onClick={() => ops.openOrder(o.id)}><td>#{o.id}</td><td>{o.customer}</td><td>{money(o.total)}</td><td>{o.minutes ? `${o.minutes} min` : '—'}</td><td><Badge value={o.opsStatus} /></td></tr>)}</tbody></Table>}</section>
    </Drawer>
  );
};

const AssignOrder = ({ partner, onClose, onDone }) => {
  const ops = useOps();
  const live = usePoll('/admin/orders/live', 0);
  const queue = live.data ? Object.values(live.data.board).flat().filter((o) => o.needsPartner) : null;
  const go = async (id) => { try { await api(`/admin/orders/${id}/assign-partner`, { method: 'POST', body: { partnerId: partner.id } }); ops.toast(`Order #${id} assigned to ${partner.name}`); onDone(); } catch (e) { ops.toast(e.message, 'bad'); } };
  return (
    <Modal title={`Assign an order to ${partner.name}`} onClose={onClose}>
      {!queue ? <SkeletonBlock rows={3} /> : queue.length === 0 ? <Empty title="No orders are waiting for a partner" /> : <Table className="compact"><thead><tr><th>Order</th><th>Location</th><th>Status</th><th /></tr></thead><tbody>{queue.map((o) => <tr key={o.id}><td>#{o.id}<br /><small className="muted">{o.customer}</small></td><td>{o.zone || o.city}</td><td><Badge value={o.opsStatus} /></td><td><button type="button" className="ops-btn sm primary" onClick={() => go(o.id)}>Assign</button></td></tr>)}</tbody></Table>}
    </Modal>
  );
};
