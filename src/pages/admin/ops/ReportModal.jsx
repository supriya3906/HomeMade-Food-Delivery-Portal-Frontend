import React, { useState } from 'react';
import { FileText, Download, Printer, Calendar, Clock, CheckCircle, XCircle, Truck, Utensils, X, Loader2 } from 'lucide-react';
import { api } from '../../../api/client';
import { money, num } from './ui';

export const ReportModal = ({ onClose }) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const currentMonthStr = todayStr.slice(0, 7);

  const [mode, setMode] = useState('date'); // 'date' | 'month'
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const q = mode === 'date' ? `?date=${selectedDate}` : `?month=${selectedMonth}`;
      const data = await api(`/admin/reports/generate${q}`);
      setReport(data);
    } catch (err) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!report || !report.orders) return;
    const headers = ['Order ID', 'Placed At', 'Customer', 'Phone', 'Items', 'Total (INR)', 'Payment Method', 'Payment Status', 'Status', 'Delivery Partner', 'Zone'];
    const rows = report.orders.map((o) => [
      o.id,
      o.placedAt,
      `"${(o.customer || '').replace(/"/g, '""')}"`,
      o.phone || '',
      `"${(o.items || '').replace(/"/g, '""')}"`,
      o.total,
      o.paymentMethod,
      o.paymentStatus,
      o.status,
      `"${(o.partner || '').replace(/"/g, '""')}"`,
      o.zone
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rasoi-report-${report.period.type}-${report.period.value}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="ops-modal-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ops-report-modal" role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
        <header className="ops-report-header no-print">
          <div className="ops-report-title">
            <FileText size={20} className="icon-gold" />
            <div>
              <h2 id="report-modal-title">Generate Operations & Financial Report</h2>
              <p className="muted small">Generate real-time business and delivery report for a specific date or month</p>
            </div>
          </div>
          <button type="button" className="ops-icon" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </header>

        <div className="ops-report-controls no-print">
          <div className="ops-segmented-tabs">
            <button
              type="button"
              className={mode === 'date' ? 'active' : ''}
              onClick={() => { setMode('date'); setReport(null); }}
            >
              <Calendar size={14} /> Specific Date
            </button>
            <button
              type="button"
              className={mode === 'month' ? 'active' : ''}
              onClick={() => { setMode('month'); setReport(null); }}
            >
              <Clock size={14} /> Specific Month
            </button>
          </div>

          <div className="ops-date-picker-wrap">
            {mode === 'date' ? (
              <label>
                <span>Select Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  max={todayStr}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </label>
            ) : (
              <label>
                <span>Select Month:</span>
                <input
                  type="month"
                  value={selectedMonth}
                  max={currentMonthStr}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </label>
            )}

            <button
              type="button"
              className="ops-btn primary"
              disabled={loading}
              onClick={fetchReport}
            >
              {loading ? <><Loader2 size={14} className="spin" /> Generating...</> : 'Generate Report'}
            </button>
          </div>
        </div>

        {error && <div className="ops-warn-line no-print" style={{ margin: '16px' }}>{error}</div>}

        <div className="ops-report-body" id="printable-report">
          {!report && !loading && (
            <div className="ops-empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <FileText size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <h4>Select a date or month and click &ldquo;Generate Report&rdquo;</h4>
              <p className="muted small">Orders, gross sales, delivery turnaround, and partner stats will be calculated.</p>
            </div>
          )}

          {loading && (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <Loader2 size={36} className="spin" style={{ margin: '0 auto 12px', color: 'var(--ops-accent, #c1531b)' }} />
              <p className="muted">Compiling data from database...</p>
            </div>
          )}

          {report && !loading && (
            <div className="ops-report-sheet">
              <div className="ops-report-sheet-head">
                <div>
                  <span className="ops-report-badge">Rasoi Operations Report</span>
                  <h3>{report.period.label}</h3>
                  <small className="muted">Generated on {new Date().toLocaleString('en-IN')}</small>
                </div>
                <div className="ops-report-actions no-print">
                  <button type="button" className="ops-btn sm" onClick={downloadCSV}>
                    <Download size={14} /> Download CSV
                  </button>
                  <button type="button" className="ops-btn sm primary" onClick={handlePrint}>
                    <Printer size={14} /> Print / Save PDF
                  </button>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="ops-report-kpis">
                <div className="ops-report-kpi">
                  <span>Gross Sales</span>
                  <strong>{money(report.summary.grossSales)}</strong>
                  <small className="muted">{money(report.summary.paidRevenue)} paid</small>
                </div>
                <div className="ops-report-kpi">
                  <span>Total Orders</span>
                  <strong>{num(report.summary.totalOrders)}</strong>
                  <small className="muted">{num(report.summary.deliveredOrders)} delivered</small>
                </div>
                <div className="ops-report-kpi">
                  <span>Delivered Orders</span>
                  <strong style={{ color: 'var(--ops-ok, #16a34a)' }}>{num(report.summary.deliveredOrders)}</strong>
                  <small className="muted">{num(report.summary.cancelledOrders)} cancelled</small>
                </div>
                <div className="ops-report-kpi">
                  <span>Avg Order Value</span>
                  <strong>{money(report.summary.avgOrderValue)}</strong>
                  <small className="muted">Per completed order</small>
                </div>
                <div className="ops-report-kpi">
                  <span>Avg Delivery Time</span>
                  <strong>{report.summary.avgDeliveryMin ? `${report.summary.avgDeliveryMin} min` : '—'}</strong>
                  <small className="muted">{report.summary.totalDeliveryPartners} active partners</small>
                </div>
              </div>

              {/* Breakdown grids */}
              <div className="ops-report-grid">
                <div className="ops-report-block">
                  <h4>Payment Methods</h4>
                  {report.paymentMethods.length === 0 ? (
                    <p className="muted small">No payment data recorded in this period</p>
                  ) : (
                    <table className="ops-table compact">
                      <thead>
                        <tr><th>Method</th><th>Orders</th><th>Collected</th></tr>
                      </thead>
                      <tbody>
                        {report.paymentMethods.map((m) => (
                          <tr key={m.method}>
                            <td><strong>{m.method}</strong></td>
                            <td>{m.count}</td>
                            <td><strong>{money(m.amount)}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="ops-report-block">
                  <h4>Top Selling Dishes</h4>
                  {report.topDishes.length === 0 ? (
                    <p className="muted small">No dishes sold in this period</p>
                  ) : (
                    <ul className="ops-report-list">
                      {report.topDishes.map((d, i) => (
                        <li key={d.name}>
                          <span>#{i + 1} {d.name}</span>
                          <strong>{d.count} ordered</strong>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="ops-report-block">
                  <h4>Top Home Chefs</h4>
                  {report.topChefs.length === 0 ? (
                    <p className="muted small">No chef orders in this period</p>
                  ) : (
                    <ul className="ops-report-list">
                      {report.topChefs.map((c, i) => (
                        <li key={c.name}>
                          <span>#{i + 1} Chef {c.name}</span>
                          <strong>{c.count} plates</strong>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="ops-report-block">
                  <h4>Delivery Fleet Activity</h4>
                  {report.partnerMetrics.length === 0 ? (
                    <p className="muted small">No partner deliveries completed in this period</p>
                  ) : (
                    <ul className="ops-report-list">
                      {report.partnerMetrics.map((p) => (
                        <li key={p.name}>
                          <span><Truck size={13} /> {p.name}</span>
                          <strong>{p.deliveries} deliveries</strong>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Order Listing */}
              <div className="ops-report-orders">
                <h4>Detailed Orders ({report.orders.length})</h4>
                {report.orders.length === 0 ? (
                  <p className="muted small">No orders recorded for this period.</p>
                ) : (
                  <div className="ops-table-wrap">
                    <table className="ops-table compact">
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Placed At</th>
                          <th>Customer</th>
                          <th>Items</th>
                          <th>Total</th>
                          <th>Payment</th>
                          <th>Status</th>
                          <th>Rider</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.orders.map((o) => (
                          <tr key={o.id}>
                            <td><strong>#{o.id}</strong></td>
                            <td><small>{new Date(o.placedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</small></td>
                            <td>{o.customer}<br /><small className="muted">{o.phone}</small></td>
                            <td className="small">{o.items}</td>
                            <td><strong>{money(o.total)}</strong></td>
                            <td>{o.paymentMethod}<br /><small className="muted">{o.paymentStatus}</small></td>
                            <td><span className="ops-badge sm">{o.status}</span></td>
                            <td>{o.partner}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
