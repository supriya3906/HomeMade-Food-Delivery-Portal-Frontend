import React, { useState } from 'react';
import { Donut } from './charts';
import { Card, Badge, Segmented, Drawer, KV, Empty, ErrorBox, SkeletonBlock, ConfirmDialog, usePoll, useOps, money, dateTime, Table } from './ui';
import { api } from '../../../api/client';

const COLORS = ['#C1531B', '#2563EB', '#1F7A4D', '#7C3AED'];
const STATUSES = ['INITIATED', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUND_INITIATED', 'REFUNDED'];

export const PaymentDrawer = ({ id, onClose, onChanged }) => {
  const ops = useOps();
  const { data: p, error, reload } = usePoll(`/admin/payments/${id}`, 4000);
  const [ask, setAsk] = useState(false);
  const refund = async () => { try { await api(`/admin/payments/${id}/refund-complete`, { method: 'POST' }); ops.toast('Refund marked as completed'); reload(); onChanged?.(); } catch (e) { ops.toast(e.message, 'bad'); } setAsk(false); };
  return (
    <Drawer title={`Payment ${id}`} subtitle={p && `${p.method} · ${money(p.amount)}`} onClose={onClose}
      footer={p?.status === 'REFUND_INITIATED' && <button type="button" className="ops-btn primary" onClick={() => setAsk(true)}>Mark refund completed</button>}>
      {error && !p && <ErrorBox message={error} />}{!p && !error && <SkeletonBlock rows={7} />}
      {p && <div className="ops-drawer-grid">
        <div className="ops-statusbar"><Badge value={p.status} />{p.refundStatus !== 'none' && <span className="muted">Refund {p.refundStatus}</span>}</div>
        <section className="ops-block"><KV rows={[['Payment ID', p.id], ['Order', p.orderId ? <button key="o" type="button" className="ops-link" onClick={() => ops.openOrder(p.orderId)}>#{p.orderId}</button> : '—'], ['Customer', `${p.customer}${p.customerEmail ? ` · ${p.customerEmail}` : ''}`], ['Amount', money(p.amount)], ['Method', p.method], p.upiId ? ['UPI ID', p.upiId] : null,
          ['Transaction ID', p.transactionId || '—'], ['Time', dateTime(p.time)], p.gateway ? ['Gateway', p.gateway.name] : null, p.reason ? ['Note', p.reason] : null]} /></section>
        <section className="ops-block"><h4>Event log</h4><ol className="ops-timeline">{p.events.map((e, i) => <li key={`${e.status}${i}`} className="done"><span>{e.note || e.status}</span><small>{dateTime(e.at)}</small></li>)}</ol></section>
      </div>}
      {ask && <ConfirmDialog title="Complete this refund?" message={`Confirms that ${money(p.amount)} has been returned to the customer.`} confirmLabel="Mark completed" onCancel={() => setAsk(false)} onConfirm={refund} />}
    </Drawer>
  );
};

const PaymentsPage = () => {
  const ops = useOps();
  const [range, setRange] = useState('7d');
  const [status, setStatus] = useState('');
  const [method, setMethod] = useState('');
  const [q, setQ] = useState('');
  const qs = new URLSearchParams({ range, ...(status && { status }), ...(method && { method }), ...(q && { q }) }).toString();
  const { data, error, reload } = usePoll(`/admin/payments?${qs}`, 6000);
  const s = data?.summary, t = data?.todaySummary;
  return (
    <div className="ops-page">
      <div className="ops-toolbar"><h1>Payments</h1><Segmented label="Range" value={range} onChange={setRange} options={[['today', 'Today'], ['yesterday', 'Yesterday'], ['7d', '7 days'], ['30d', '30 days']]} /></div>
      {error && !data && <ErrorBox message={error} onRetry={reload} />}{!data && !error && <SkeletonBlock rows={8} />}
      {data && <>
        <div className="ops-kpis small">
          {[['Successful today', t.successful], ['Failed today', t.failed], ['Pending', t.pending], ['Refunds pending', s.refundsPending], ['COD orders', s.cod], ['UPI payments', s.upi], ['Card payments', s.card], ['Success rate', s.successRate === null ? '—' : `${s.successRate}%`]].map(([k, v]) => <div className="ops-kpi" key={k}><span className="k">{k}</span><strong>{v}</strong></div>)}
        </div>
        <div className="ops-grid one-two">
          <Card title="Payment method distribution">{s.methodShare.length ? <Donut parts={s.methodShare.map((m, i) => ({ label: m.method, value: m.count, color: COLORS[i % 4] }))} /> : <Empty title="No payments in this range" />}</Card>
          <Card title="Transactions" pad={false} action={<div className="ops-filters inline"><input className="ops-input" type="search" placeholder="Search ID, order, customer" aria-label="Search payments" value={q} onChange={(e) => setQ(e.target.value)} />
            <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="">All statuses</option>{STATUSES.map((x) => <option key={x} value={x}>{x.replace('_', ' ').toLowerCase()}</option>)}</select>
            <select value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Method"><option value="">All methods</option><option value="upi">UPI</option><option value="cod">Cash on delivery</option></select></div>}>
            {data.payments.length === 0 ? <div className="ops-card-body"><Empty title="No transactions match" /></div> : <Table><thead><tr><th>Payment</th><th>Order</th><th>Customer</th><th>Amount</th><th>Method</th><th>Transaction</th><th>Status</th><th>Time</th><th>Refund</th></tr></thead>
              <tbody>{data.payments.map((p) => <tr key={p.id} className="click" onClick={() => ops.openPayment(p.id)}><td>{p.id}</td><td>{p.orderId ? `#${p.orderId}` : '—'}</td><td>{p.customer}</td><td>{money(p.amount)}</td><td>{p.method}</td><td>{p.transactionId || '—'}</td><td><Badge value={p.status} /></td><td>{dateTime(p.time)}</td><td>{p.refundStatus === 'none' ? '—' : p.refundStatus}</td></tr>)}</tbody></Table>}
          </Card>
        </div>
      </>}
    </div>
  );
};
export default PaymentsPage;
