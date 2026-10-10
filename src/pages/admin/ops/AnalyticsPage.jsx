import React, { useState } from 'react';
import { BarChart, LineChart, Donut, HBars } from './charts';
import { Card, Segmented, Empty, ErrorBox, SkeletonBlock, usePoll, useOps, money, num, dayText, Table } from './ui';

const COLORS = ['#C1531B', '#2563EB', '#1F7A4D', '#7C3AED', '#B7791F', '#9AA0AB'];
const RANGES = [['today', 'Today'], ['yesterday', 'Yesterday'], ['7d', '7 days'], ['30d', '30 days'], ['month', 'This month'], ['custom', 'Custom']];

const AnalyticsPage = ({ focus = 'revenue' }) => {
  const ops = useOps();
  const [range, setRange] = useState('7d');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [day, setDay] = useState(null);
  const q = range === 'custom' ? (from && to ? `?range=custom&from=${from}&to=${to}` : '?range=7d') : `?range=${range}`;
  const { data: a, error, reload } = usePoll(`/admin/analytics${q}`, 15000);
  const dayData = usePoll(day ? `/admin/revenue/day/${day}` : null, 0);
  const labelOf = (d) => (a.days.length > 10 ? d.date.slice(8) : d.label);
  return (
    <div className="ops-page">
      <div className="ops-toolbar"><h1>{focus === 'revenue' ? 'Revenue & analytics' : 'Analytics'}</h1>
        <div className="ops-toolbar-right"><Segmented label="Range" value={range} onChange={setRange} options={RANGES} />
          {range === 'custom' && <><input type="date" aria-label="From" value={from} onChange={(e) => setFrom(e.target.value)} /><input type="date" aria-label="To" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></>}</div></div>
      {error && !a && <ErrorBox message={error} onRetry={reload} />}{!a && !error && <SkeletonBlock rows={10} />}
      {a && <>
        <div className="ops-kpis small">
          {[['Revenue (paid)', money(a.revenue.total)], ['Orders', num(a.orders.total)], ['Delivered', num(a.orders.delivered)], ['Cancelled', `${a.orders.cancelled}${a.orders.cancelRate !== null ? ` (${a.orders.cancelRate}%)` : ''}`], ['Average order value', money(a.orders.avg)],
            ['Payment success', a.payments.successRate === null ? '—' : `${a.payments.successRate}%`], ['Avg delivery time', a.delivery.avgMinutes ? `${a.delivery.avgMinutes} min` : '—'], ['New customers', num(a.customers.signups)]].map(([k, v]) => <div className="ops-kpi" key={k}><span className="k">{k}</span><strong>{v}</strong></div>)}
        </div>
        <div className="ops-grid two">
          <Card title="Daily revenue" action={<span className="muted small">Click a bar for that day&apos;s orders</span>}><BarChart data={a.days.map((d) => ({ key: d.date, label: labelOf(d), value: d.revenue }))} prefix="₹" onSelect={setDay} selected={day} /></Card>
          <Card title="Daily orders"><BarChart data={a.days.map((d) => ({ key: d.date, label: labelOf(d), value: d.orders }))} color="var(--ops-info)" /></Card>
        </div>
        {day && dayData.data?.date === day && <Card title={dayText(day)} action={<button type="button" className="ops-btn sm" onClick={() => setDay(null)}>Close</button>}>
          <div className="ops-daygrid">{[['Revenue (paid)', money(dayData.data.revenue)], ['Orders', dayData.data.orders], ['Delivered', dayData.data.delivered], ['Cancelled', dayData.data.cancelled], ['Pending', dayData.data.pending], ['Average order', money(dayData.data.avgOrder)]].map(([k, v]) => <div key={k}><span>{k}</span><strong>{v}</strong></div>)}</div>
          <Table className="compact"><thead><tr><th>Order</th><th>Customer</th><th>Amount</th></tr></thead><tbody>{dayData.data.orderList.map((o) => <tr key={o.id} className="click" onClick={() => ops.openOrder(o.id)}><td>#{o.id}</td><td>{o.customer}</td><td>{money(o.total)}</td></tr>)}</tbody></Table></Card>}
        <div className="ops-grid two">
          <Card title="Revenue by day"><Table className="compact"><thead><tr><th>Date</th><th>Revenue</th><th>Orders</th><th>Delivered</th><th>Cancelled</th><th>Avg order</th></tr></thead><tbody>{[...a.days].reverse().map((d) => <tr key={d.date} className="click" onClick={() => setDay(d.date)}><td>{d.label}, {d.date}</td><td><strong>{money(d.revenue)}</strong></td><td>{d.orders}</td><td>{d.delivered}</td><td>{d.cancelled}</td><td>{money(d.avgOrder)}</td></tr>)}</tbody></Table></Card>
          <Card title="Customer growth">{a.growth.length ? <LineChart data={a.growth.map((g) => ({ label: labelOf(g), value: g.total }))} color="var(--ops-ok)" /> : <Empty title="No data" />}
            <p className="muted small">{a.customers.buyers} buying customers · {a.customers.newBuyers} first-time · {a.customers.repeatBuyers} repeat</p></Card>
        </div>
        <div className="ops-grid three">
          <Card title="Orders by category">{a.byCategory.length ? <Donut parts={a.byCategory.map((c, i) => ({ label: c.name, value: c.value, color: COLORS[i % 6] }))} /> : <Empty title="No orders" />}</Card>
          <Card title="Orders by chef (dishes sold)">{a.byChef.length ? <HBars rows={a.byChef} /> : <Empty title="No orders" />}</Card>
          <Card title="Payment methods">{a.payments.methodShare.length ? <Donut parts={a.payments.methodShare.map((m, i) => ({ label: m.method, value: m.count, color: COLORS[i % 6] }))} /> : <Empty title="No payments" />}
            <p className="muted small">{a.payments.successful} successful · {a.payments.failed} failed · {a.payments.refundsPending} refunds pending</p></Card>
        </div>
        <Card title="Delivery time (minutes from order to delivery)"><LineChart data={a.delivery.daily.map((d) => ({ label: labelOf(d), value: d.minutes }))} suffix=" min" />
          <p className="muted small">Fastest {a.delivery.fastest ?? '—'} min · slowest {a.delivery.slowest ?? '—'} min · {a.delivery.lateNow} orders late right now</p></Card>
      </>}
    </div>
  );
};
export default AnalyticsPage;
