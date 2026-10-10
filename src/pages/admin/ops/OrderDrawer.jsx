import React, { useState } from 'react';
import { Phone, User, MapPin, Check, Circle, XCircle, Navigation } from 'lucide-react';
import { api } from '../../../api/client';
import { Drawer, Badge, PayBadge, KV, SkeletonBlock, ErrorBox, ConfirmDialog, usePoll, useOps, money, dateTime, clock } from './ui';

const NEXT = [['Order accepted & preparing', 1], ['Out for delivery', 2], ['Delivered', 3]];

export const PartnerPicker = ({ rec, current, onPick, busy }) => {
  if (!rec) return null;
  const top = rec.recommended;
  return (
    <div className="ops-rec">
      <div className="ops-rec-top">
        <strong>Delivery location: {rec.zone?.name || 'Unknown area'}</strong>
        <span className="muted">{rec.customerLocation.source === 'gps' ? 'exact GPS from checkout' : rec.customerLocation.source === 'zone' ? 'area level (zone centre)' : 'could not be placed — ranking by load only'}</span>
      </div>
      {top ? (
        <div className="ops-rec-best">
          <div><span className="ops-tick"><Check size={14} /></span> <strong>Recommended: {top.name}</strong>
            <ul>{top.reason.map((r) => <li key={r}>{r}</li>)}</ul></div>
          {current?.id === top.partnerId ? <Badge tone="ok">Assigned</Badge> : <button type="button" className="ops-btn primary" disabled={busy} onClick={() => onPick(top.partnerId)}>Assign Rider ({top.name})</button>}
        </div>
      ) : <p className="ops-warn-line">No delivery partner is available right now. Bring a partner online or wait for one to finish.</p>}
      <table className="ops-table compact"><thead><tr><th>Partner</th><th>Distance</th><th>Status</th><th>Orders</th><th>Pickup</th><th /></tr></thead>
        <tbody>{rec.candidates.map((c) => (
          <tr key={c.partnerId} className={c.eligible ? '' : 'dim'}>
            <td><strong>{c.name}</strong><br /><small className="muted">{c.area || '—'}{c.sameZone ? ' · same zone' : ''}</small></td>
            <td>{c.distanceKm === null ? '—' : `${c.distanceKm} km`}</td><td><Badge value={c.status} /></td><td>{c.activeOrders}/{c.maxOrders}</td>
            <td>{c.pickupMinutes === null ? '—' : `${c.pickupMinutes} min`}</td>
            <td>{current?.id === c.partnerId ? <Badge tone="ok">Assigned</Badge> : <button type="button" className="ops-btn sm" disabled={!c.eligible || busy} onClick={() => onPick(c.partnerId)}>Assign Rider</button>}</td>
          </tr>))}</tbody></table>
    </div>
  );
};

export const AssignTimer = ({ placedAt, partner }) => {
  const [now, setNow] = useState(Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (partner) return null;
  const deadline = new Date(placedAt).getTime() + 120000;
  const remaining = Math.max(0, Math.floor((deadline - now) / 1000));
  const mins = Math.floor(remaining / 60);
  const secs = String(remaining % 60).padStart(2, '0');

  return (
    <div style={{
      background: remaining > 0 ? 'rgba(234, 179, 8, 0.12)' : 'rgba(99, 102, 241, 0.12)',
      border: `1px solid ${remaining > 0 ? '#eab308' : '#6366f1'}`,
      borderRadius: '8px',
      padding: '0.75rem 1rem',
      margin: '0.5rem 0 1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '0.75rem'
    }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: remaining > 0 ? '#854d0e' : '#4338ca' }}>
          {remaining > 0 ? `⏱️ Admin Assignment Window: ${mins}:${secs}` : '🤖 Auto-Assigning Nearest Rider...'}
        </div>
        <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '2px' }}>
          {remaining > 0
            ? 'Assign an available delivery partner within 2 minutes. Otherwise, nearest rider will be auto-assigned.'
            : 'Manual window expired (2 mins). Background dispatch is assigning the closest rider automatically.'}
        </div>
      </div>
      {remaining > 0 && (
        <span style={{
          fontFamily: 'monospace',
          fontWeight: 800,
          fontSize: '1.1rem',
          color: remaining <= 30 ? '#dc2626' : '#854d0e',
          padding: '2px 8px',
          borderRadius: '4px',
          background: 'rgba(255,255,255,0.7)'
        }}>
          {mins}:{secs}
        </span>
      )}
    </div>
  );
};

const OrderDrawer = ({ orderId, onClose }) => {
  const ops = useOps();
  const { data: o, error, reload } = usePoll(`/admin/orders/${orderId}/detail`, 5000);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [changing, setChanging] = useState(false);

  const run = async (fn, ok) => {
    setBusy(true);
    try { await fn(); await reload(); ops.refresh(); ops.toast(ok); } catch (e) { ops.toast(e.message, 'bad'); } finally { setBusy(false); setConfirm(null); }
  };
  const assign = (partnerId) => run(async () => { await api(`/admin/orders/${orderId}/assign-partner`, { method: 'POST', body: { partnerId } }); setChanging(false); }, 'Delivery partner assigned');
  const advance = (stage) => run(() => api(`/admin/orders/${orderId}`, { method: 'PATCH', body: { stage } }), 'Order status updated');

  const open = o && !o.cancelled && o.stage < 3;
  const nextStep = o && open ? NEXT.find(([, s]) => s > o.stage) : null;
  const tr = o?.delivery?.tracking;

  return (
    <Drawer wide title={`Order #${orderId}`} subtitle={o ? `Placed ${dateTime(o.placedAt)} · ${o.invoiceNo || ''}` : ''} onClose={onClose}
      footer={o && (
        <>
          {open && nextStep && <button type="button" className="ops-btn" disabled={busy} onClick={() => advance(nextStep[1])}>Mark: {nextStep[0]}</button>}
          {open && <button type="button" className="ops-btn" disabled={busy} onClick={() => setChanging((v) => !v)}>{o.partner ? 'Change partner' : 'Assign delivery partner'}</button>}
          {o.partner?.phone && <a className="ops-btn" href={`tel:${o.partner.phone}`}><Phone size={14} /> Contact partner</a>}
          <button type="button" className="ops-btn" onClick={() => { ops.go('customers', o.customerDetail.id); onClose(); }}><User size={14} /> View customer</button>
          <a className="ops-btn" href={`/orders/${orderId}/track`} target="_blank" rel="noreferrer"><Navigation size={14} /> View tracking</a>
          {open && <button type="button" className="ops-btn danger" disabled={busy} onClick={() => setConfirm('cancel')}><XCircle size={14} /> Cancel order</button>}
        </>
      )}>
      {error && !o && <ErrorBox message={error} onRetry={reload} />}
      {!o && !error && <SkeletonBlock rows={9} />}
      {o && (
        <div className="ops-drawer-grid">
          <div className="ops-statusbar"><Badge value={o.opsStatus} />{o.delayed && <Badge tone="bad">Delayed</Badge>}<PayBadge status={o.paymentStatus} />{o.etaMinutes !== null && <span className="muted">ETA {o.etaMinutes} min</span>}</div>

          {open && !o.partner && <AssignTimer placedAt={o.placedAt} partner={o.partner} />}

          {changing && open && <section className="ops-block"><h4>{o.partner ? 'Change delivery partner' : 'Assign delivery partner'}</h4><PartnerPicker rec={o.recommendation} current={o.partner} onPick={assign} busy={busy} /></section>}
          {!changing && open && !o.partner && o.recommendation && <section className="ops-block"><h4>Delivery partner needed</h4><PartnerPicker rec={o.recommendation} current={null} onPick={assign} busy={busy} /></section>}

          <section className="ops-block"><h4>Customer</h4>
            <KV rows={[['Name', o.customerDetail.name], ['Phone', o.customerDetail.phone], ['Email', o.customerDetail.email],
              ['Delivery address', [o.customerDetail.address?.address, o.customerDetail.address?.city, o.customerDetail.address?.pincode].filter(Boolean).join(', ')],
              ['Location', <span key="l"><MapPin size={12} /> {o.zone || 'Unknown zone'}{o.locationSource === 'gps' ? ' · GPS' : o.locationSource === 'zone' ? ' · area level' : ''}</span>],
              o.customerDetail.address?.notes ? ['Notes', o.customerDetail.address.notes] : null]} /></section>

          <section className="ops-block"><h4>Items</h4>
            <table className="ops-table compact"><thead><tr><th>Food</th><th>Qty</th><th>Price</th><th>Chef</th></tr></thead>
              <tbody>{o.items.map((i) => <tr key={i.name}><td>{i.name}</td><td>{i.quantity}</td><td>{money(i.price * i.quantity)}</td><td>{i.chef}</td></tr>)}</tbody></table>
            <KV rows={[['Subtotal', money(o.bill.subtotal)], o.bill.deliveryFee ? ['Delivery fee', money(o.bill.deliveryFee)] : null, o.bill.discount ? ['Discount', `−${money(o.bill.discount)}`] : null, ['GST', money(o.bill.tax)], ['Total', <strong key="t">{money(o.bill.total)}</strong>]]} /></section>

          <section className="ops-block"><h4>Payment</h4>
            <KV rows={[['Method', o.payment.method], ['Amount', money(o.payment.amount)], ['Transaction ID', o.payment.transactionId || (o.paymentMethodId === 'cod' ? 'Cash on delivery' : '—')], o.payment.upiId ? ['UPI ID', o.payment.upiId] : null,
              ['Status', <PayBadge key="s" status={o.payment.status} />], o.payment.paidAt ? ['Paid at', dateTime(o.payment.paidAt)] : null]} />
            {o.payment.paymentId && <button type="button" className="ops-link" onClick={() => ops.openPayment(o.payment.paymentId)}>Open payment {o.payment.paymentId}</button>}</section>

          <section className="ops-block"><h4>Delivery</h4>
            {o.partner ? <KV rows={[['Partner', o.partner.name], ['Vehicle', [o.delivery.partner?.vehicle, o.delivery.partner?.vehicleNo].filter(Boolean).join(' · ')], ['Partner phone', o.partner.phone],
              ['Assigned by', o.delivery.partner?.assignedBy === 'system' ? 'System (auto-assigned)' : String(o.delivery.partner?.assignedBy || '').replace('admin:', 'Admin · ')],
              tr?.partner ? ['Current location', `${tr.partner.lat.toFixed(4)}, ${tr.partner.lng.toFixed(4)} · ${tr.partner.source === 'gps' ? 'live GPS' : 'estimated'}`] : null,
              tr?.distanceKm !== null && tr?.distanceKm !== undefined ? ['Distance remaining', `${tr.distanceKm} km`] : null, tr?.etaMinutes !== null && tr?.etaMinutes !== undefined ? ['ETA', `${tr.etaMinutes} min`] : null]} />
              : <p className="muted">No delivery partner assigned yet.</p>}</section>

          <section className="ops-block"><h4>Order timeline</h4>
            <ol className="ops-timeline">{o.timeline.map((s) => <li key={s.key} className={s.done ? 'done' : ''}>{s.done ? <Check size={13} /> : <Circle size={11} />}<span>{s.label}</span><small>{s.at ? clock(s.at) : ''}</small></li>)}</ol>
            {o.cancelled && <p className="ops-warn-line">Cancelled {dateTime(o.cancelledAt)}.</p>}</section>
        </div>
      )}
      {confirm === 'cancel' && <ConfirmDialog danger title={`Cancel order #${orderId}?`} message={o.paymentStatus === 'paid' ? 'The customer has paid online, so a refund will be started automatically.' : 'The customer will see this order as cancelled.'} confirmLabel="Cancel order" onCancel={() => setConfirm(null)} onConfirm={() => run(() => api(`/admin/orders/${orderId}`, { method: 'PATCH', body: { status: 'cancelled' } }), 'Order cancelled')} />}
    </Drawer>
  );
};
export default OrderDrawer;
