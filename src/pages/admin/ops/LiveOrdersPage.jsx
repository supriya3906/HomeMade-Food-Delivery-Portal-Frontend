import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Card, Badge, PayBadge, Empty, ErrorBox, SkeletonBlock, Segmented, usePoll, useOps, money, clock, Table } from './ui';

const COLS = [['NEW', 'New'], ['PREPARING', 'Preparing'], ['READY_FOR_PICKUP', 'Ready for pickup'], ['OUT_FOR_DELIVERY', 'Out for delivery'], ['DELIVERED', 'Delivered today'], ['CANCELLED', 'Cancelled today']];

const PartnerIndicator = ({ o }) => {
  if (o.partner) {
    return <span>Partner: <strong>{o.partner.name}</strong></span>;
  }
  if (!o.needsPartner) return <span />;

  const [now, setNow] = useState(Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const deadline = new Date(o.placedAt).getTime() + 120000;
  const remaining = Math.max(0, Math.floor((deadline - now) / 1000));
  if (remaining > 0) {
    const mins = Math.floor(remaining / 60);
    const secs = String(remaining % 60).padStart(2, '0');
    return <Badge tone="warn">⏱️ Assign ({mins}:{secs})</Badge>;
  }
  return <Badge tone="info">🤖 Auto-dispatching...</Badge>;
};

const OrderCard = ({ o, onOpen }) => (
  <button type="button" className={`ops-ocard ${o.delayed ? 'late' : ''}`} onClick={() => onOpen(o.id)}>
    <div className="top"><strong>#{o.id}</strong><span>{clock(o.placedAt)}</span></div>
    <div className="who">{o.customer} <small>{o.phone}</small></div>
    <div className="loc">{o.zone || o.city || '—'}</div>
    <div className="items">{o.items.join(', ')}</div>
    <div className="meta"><span>{money(o.total)}</span><span>{o.paymentMethod} · <PayBadge status={o.paymentStatus} /></span></div>
    <div className="chef">Chef: {o.chefs.join(', ')}</div>
    <div className="foot">
      <PartnerIndicator o={o} />
      {o.etaMinutes !== null && <span className={o.delayed ? 'bad' : ''}>{o.delayed ? 'Late · ' : 'ETA '}{o.etaMinutes} min</span>}
    </div>
  </button>
);

export const LiveOrdersPage = () => {
  const ops = useOps();
  const { data, error, reload } = usePoll('/admin/orders/live', 5000);
  const [view, setView] = useState('board');
  if (error && !data) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return <SkeletonBlock rows={8} />;
  const all = Object.values(data.board).flat();
  return (
    <div className="ops-page">
      <div className="ops-toolbar"><h1>Live orders</h1>
        <div className="ops-toolbar-right"><span className="ops-live"><i /> Refreshes every 5 s</span><Segmented label="View" options={[['board', 'Board'], ['table', 'Table']]} value={view} onChange={setView} /></div></div>
      {all.length === 0 && <Empty title="No orders today" hint="Orders appear here the moment a customer checks out." />}
      {all.length > 0 && view === 'board' && (
        <div className="ops-board">{COLS.map(([key, label]) => (
          <section key={key} className="ops-col"><header><span>{label}</span><b>{data.counts[key]}</b></header>
            <div className="ops-col-body">{data.board[key].length === 0 ? <p className="muted small">None</p> : data.board[key].map((o) => <OrderCard key={o.id} o={o} onOpen={ops.openOrder} />)}</div></section>))}</div>)}
      {all.length > 0 && view === 'table' && <Card pad={false}><OrdersTable rows={all} /></Card>}
      {!data.autoAssign && <p className="muted small">Auto-assign is off: orders that are ready wait here until you assign a delivery partner.</p>}
    </div>
  );
};

export const OrdersTable = ({ rows }) => {
  const ops = useOps();
  return (
    <Table className="orders">
      <thead><tr><th>Order</th><th>Customer</th><th>Location</th><th>Chef / food</th><th>Amount</th><th>Payment</th><th>Status</th><th>Partner</th><th>Placed</th><th>ETA</th></tr></thead>
      <tbody>{rows.map((o) => (
        <tr key={o.id} className="click" onClick={() => ops.openOrder(o.id)}>
          <td><strong>#{o.id}</strong></td><td>{o.customer}<br /><small className="muted">{o.phone}</small></td><td>{o.zone || o.city || '—'}</td>
          <td>{o.chefs.join(', ')}<br /><small className="muted">{o.items.join(', ')}</small></td><td>{money(o.total)}</td><td>{o.paymentMethod}<br /><PayBadge status={o.paymentStatus} /></td>
          <td><Badge value={o.opsStatus} />{o.delayed && <Badge tone="bad">Late</Badge>}</td><td>{o.partner?.name || (o.needsPartner ? <Badge tone="warn">Unassigned</Badge> : '—')}</td><td>{clock(o.placedAt)}</td><td>{o.etaMinutes === null ? '—' : `${o.etaMinutes} min`}</td>
        </tr>))}</tbody>
    </Table>
  );
};

export const OrderManagementPage = () => {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [payment, setPayment] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const qs = new URLSearchParams({ ...(q && { q }), ...(status && { status }), ...(payment && { payment }), ...(from && to && { from, to }) }).toString();
  const { data, error, reload } = usePoll(`/admin/orders/list?${qs}`, 10000);
  return (
    <div className="ops-page">
      <div className="ops-toolbar"><h1>Order management</h1></div>
      <div className="ops-filters">
        <label className="ops-search"><Search size={15} /><input placeholder="Search order, customer, phone, chef, partner" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="">All statuses</option>{['NEW', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ').toLowerCase()}</option>)}</select>
        <select value={payment} onChange={(e) => setPayment(e.target.value)} aria-label="Payment status"><option value="">All payments</option><option value="paid">Paid</option><option value="pay_on_delivery">Pay on delivery</option><option value="refund_initiated">Refund initiated</option><option value="refunded">Refunded</option><option value="cancelled">Cancelled</option></select>
        <input type="date" aria-label="From date" value={from} onChange={(e) => setFrom(e.target.value)} /><input type="date" aria-label="To date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      {error && !data && <ErrorBox message={error} onRetry={reload} />}
      {!data && !error && <SkeletonBlock rows={8} />}
      {data && (data.orders.length === 0 ? <Empty title="No orders match these filters" /> : <Card pad={false}><OrdersTable rows={data.orders} /><p className="ops-foot-note">{data.orders.length} of {data.total} orders</p></Card>)}
    </div>
  );
};
