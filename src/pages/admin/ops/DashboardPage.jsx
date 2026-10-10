import React, { useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, FileText } from 'lucide-react';
import { BarChart, Donut, HBars } from './charts';
import { Card, Segmented, Badge, PayBadge, SkeletonBlock, ErrorBox, Empty, usePoll, useOps, money, num, pctText, ago, clock, dayText } from './ui';
import { Skeleton } from './ui';
import ReportModal from './ReportModal';

const RANGES = [['today', 'Today'], ['yesterday', 'Yesterday'], ['7d', 'Last 7 days'], ['month', 'This month'], ['custom', 'Custom']];
const METHOD_COLOR = ['#C1531B', '#2563EB', '#1F7A4D', '#7C3AED', '#9AA0AB'];

const Kpi = ({ label, value, hint, tone, onClick }) => (
  <button type="button" className={`ops-kpi ${tone || ''}`} onClick={onClick} disabled={!onClick}>
    <span className="k">{label}</span><strong>{value}</strong>{hint && <small>{hint}</small>}
  </button>
);

const DayDetail = ({ date, onClose }) => {
  const { data: d, error } = usePoll(`/admin/revenue/day/${date}`, 0);
  const ops = useOps();
  return (
    <Card title={dayText(date)} action={<button type="button" className="ops-btn sm" onClick={onClose}>Close</button>} className="ops-daydetail">
      {error && <ErrorBox message={error} />}{!d && !error && <SkeletonBlock rows={3} />}
      {d && <>
        <div className="ops-daygrid">
          {[['Revenue (paid)', money(d.revenue)], ['Orders', d.orders], ['Delivered', d.delivered], ['Cancelled', d.cancelled], ['Pending', d.pending], ['Average order', money(d.avgOrder)]].map(([k, v]) => <div key={k}><span>{k}</span><strong>{v}</strong></div>)}
        </div>
        {Object.keys(d.byMethod).length > 0 && <p className="muted small">Collected by method: {Object.entries(d.byMethod).map(([m, v]) => `${m} ${money(v)}`).join(' · ')}</p>}
        {d.orderList.length === 0 ? <Empty title="No orders on this day" /> : (
          <div className="ops-table-wrap"><table className="ops-table compact"><thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Payment</th><th>Status</th></tr></thead>
            <tbody>{d.orderList.map((o) => <tr key={o.id} className="click" onClick={() => ops.openOrder(o.id)}><td>#{o.id}</td><td>{o.customer}</td><td>{money(o.total)}</td><td>{o.paymentMethod}</td><td><Badge value={o.opsStatus} /></td></tr>)}</tbody></table></div>)}
      </>}
    </Card>
  );
};

const DashboardPage = () => {
  const ops = useOps();
  const [range, setRange] = useState('7d');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [day, setDay] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const q = range === 'custom' ? (from && to ? `?range=custom&from=${from}&to=${to}` : '?range=7d') : `?range=${range}`;
  const { data: d, error, loading, reload } = usePoll(`/admin/dashboard${q}`, 6000);

  if (error && !d) return <ErrorBox message={error} onRetry={reload} />;
  if (!d) return <div className="ops-kpis">{Array.from({ length: 12 }, (_, i) => <div className="ops-kpi" key={i}><Skeleton h={12} w="50%" /><Skeleton h={26} w="70%" style={{ marginTop: 10 }} /></div>)}</div>;
  const k = d.kpis, up = (d.revenue.changePct ?? 0) >= 0;
  const methods = d.payments.methodShare;
  const rangeBars = d.selected.map((x) => ({ key: x.date, label: d.selected.length > 10 ? x.date.slice(8) : x.label, value: x.revenue }));
  const anyData = d.selected.some((x) => x.orders || x.revenue);

  return (
    <div className="ops-page">
      <div className="ops-toolbar">
        <h1>Operations overview</h1>
        <div className="ops-toolbar-right">
          <button type="button" className="ops-btn primary" onClick={() => setShowReport(true)}>
            <FileText size={15} /> Generate Report
          </button>
          <Segmented label="Date range" options={RANGES} value={range} onChange={setRange} />
          {range === 'custom' && <><input type="date" aria-label="From date" value={from} max={to || d.today} onChange={(e) => setFrom(e.target.value)} /><input type="date" aria-label="To date" value={to} min={from} max={d.today} onChange={(e) => setTo(e.target.value)} /></>}
        </div>
      </div>

      <section className="ops-hero" aria-label="Revenue">
        <div className="ops-hero-main"><span className="k">Today&apos;s revenue</span><strong>{money(d.revenue.today)}</strong><small>{dayText(d.today)} · paid orders only</small></div>
        <div className="ops-hero-side"><span className="k">Yesterday</span><strong>{money(d.revenue.yesterday)}</strong>
          <span className={`ops-delta ${d.revenue.changePct === null ? '' : up ? 'up' : 'down'}`}>{d.revenue.changePct === null ? 'No comparison (yesterday ₹0)' : <>{up ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {pctText(d.revenue.changePct)} vs yesterday</>}</span></div>
        <div className="ops-hero-side"><span className="k">{d.range.label}</span><strong>{money(d.revenue.selected)}</strong><small>{num(d.revenue.selectedOrders)} orders placed</small></div>
      </section>

      <div className="ops-kpis">
        <Kpi label="Orders today" value={num(k.ordersToday)} onClick={() => ops.go('orders')} />
        <Kpi label="Pending orders" value={num(k.pending)} hint="Awaiting kitchen" tone={k.pending ? 'info' : ''} onClick={() => ops.go('live')} />
        <Kpi label="Preparing" value={num(k.preparing + k.ready)} hint={k.ready ? `${k.ready} ready for pickup` : ''} onClick={() => ops.go('live')} />
        <Kpi label="Out for delivery" value={num(k.outForDelivery)} onClick={() => ops.go('live')} />
        <Kpi label="Delivered today" value={num(k.deliveredToday)} onClick={() => ops.go('orders')} />
        <Kpi label="Cancelled today" value={num(k.cancelledToday)} tone={k.cancelledToday ? 'bad' : ''} />
        <Kpi label="Average order value" value={money(k.avgOrderValue)} hint="Today" />
        <Kpi label="Active delivery partners" value={`${k.activePartners} / ${k.partnersTotal}`} hint="Online of total" onClick={() => ops.go('partners')} />
        <Kpi label="Active chefs" value={`${k.activeChefs} / ${k.chefsTotal}`} hint="With a dish on the menu" onClick={() => ops.go('chefs')} />
        <Kpi label="Registered customers" value={num(k.customers)} onClick={() => ops.go('customers')} />
        <Kpi label="Live orders" value={num(k.live)} hint="Not yet delivered" onClick={() => ops.go('live')} />
        <Kpi label="Payment success" value={d.payments.successRate === null ? '—' : `${d.payments.successRate}%`} hint={`${d.payments.failed} failed today`} tone={d.payments.failed ? 'warn' : ''} onClick={() => ops.go('payments')} />
      </div>

      <div className="ops-grid two-one">
        <Card title={`Daily revenue · ${d.range.label}`} action={<span className="muted small">Click a bar for that day</span>}>
          {anyData ? <BarChart data={rangeBars} prefix="₹" onSelect={setDay} selected={day} /> : <Empty title="No revenue in this period yet" hint="Revenue appears here as soon as an order is paid." />}
          <table className="ops-table compact days"><thead><tr><th>Day</th><th>Revenue</th><th>Orders</th><th>Avg order</th><th>Cancelled</th></tr></thead>
            <tbody>{[...d.daily].reverse().map((x, i) => <tr key={x.date} className={`click ${day === x.date ? 'sel' : ''}`} onClick={() => setDay(x.date)}><td>{i === 0 ? 'Today' : i === 1 ? 'Yesterday' : `Day −${i}`} <small className="muted">{x.label}, {x.date.slice(5)}</small></td><td><strong>{money(x.revenue)}</strong></td><td>{x.orders}</td><td>{money(x.avgOrder)}</td><td>{x.cancelled}</td></tr>)}</tbody></table>
        </Card>
        <Card title="Payments today" action={<button type="button" className="ops-link" onClick={() => ops.go('payments')}>Open payments</button>}>
          {methods.length ? <Donut parts={methods.map((m, i) => ({ label: m.method, value: m.count, color: METHOD_COLOR[i % 5] }))} center={d.payments.successRate === null ? '' : `${d.payments.successRate}%`} /> : <Empty title="No payments today" />}
          <ul className="ops-mini">{[['Successful', d.payments.successful], ['Failed', d.payments.failed], ['Pending', d.payments.pending], ['Refunds pending', d.payments.refundsPending], ['COD orders', d.payments.cod], ['UPI payments', d.payments.upi]].map(([a, b]) => <li key={a}><span>{a}</span><strong>{b}</strong></li>)}</ul>
        </Card>
      </div>
      {day && <DayDetail date={day} onClose={() => setDay(null)} />}

      <div className="ops-grid three">
        <Card title="Order status overview">
          <HBars rows={[['New', k.pending], ['Preparing', k.preparing], ['Ready for pickup', k.ready], ['Out for delivery', k.outForDelivery], ['Delivered today', k.deliveredToday], ['Cancelled today', k.cancelledToday]].map(([name, value]) => ({ name, value }))} color="var(--ops-info)" />
        </Card>
        <Card title={`Top performing chefs · ${d.range.label}`}>{d.topChefs.length ? <HBars rows={d.topChefs.map((c) => ({ name: c.name, value: c.revenue }))} format={money} /> : <Empty title="No sales yet" />}</Card>
        <Card title={`Top selling foods · ${d.range.label}`}>{d.topFoods.length ? <HBars rows={d.topFoods.map((c) => ({ name: c.name, value: c.qty }))} format={(v) => `${v} sold`} color="var(--ops-ok)" /> : <Empty title="No sales yet" />}</Card>
      </div>

      <div className="ops-grid two">
        <Card title="Recent activity" action={<span className="muted small">{loading ? '' : `Updated ${ago(d.generatedAt)}`}</span>}>
          {d.activity.length === 0 ? <Empty title="No activity yet" /> : <ul className="ops-feed">{d.activity.map((e) => <li key={e.id} className={e.severity} onClick={() => e.orderId && ops.openOrder(e.orderId)}><span>{e.text}</span><small>{ago(e.at)}</small></li>)}</ul>}
        </Card>
        <Card title="Notifications" action={<button type="button" className="ops-link" onClick={() => ops.go('notifications')}>See all ({d.notifications.unread} unread)</button>}>
          {d.notifications.items.length === 0 ? <Empty title="You're all caught up" /> : <ul className="ops-feed">{d.notifications.items.map((e) => <li key={e.id} className={`${e.severity} ${e.unread ? 'unread' : ''}`}>{e.severity === 'warn' && <AlertTriangle size={13} />}<span>{e.text}</span><small>{ago(e.at)}</small></li>)}</ul>}
        </Card>
      </div>
      {showReport && <ReportModal onClose={() => setShowReport(false)} />}
    </div>
  );
};
export default DashboardPage;
