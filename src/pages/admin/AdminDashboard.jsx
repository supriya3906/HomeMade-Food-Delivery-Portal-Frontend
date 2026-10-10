// Admin operations centre. This file is the shell (sidebar, header, drawers, toasts);
// each section lives in ./ops/. Routes: /admin and /admin/:section (same AdminRoute guard as before).
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { LayoutDashboard, Radio, ClipboardList, Truck, Bike, Users, ChefHat, Utensils, CreditCard, LineChart, Bell, LogOut, Menu, Search, X, AlertTriangle, ExternalLink, Tag, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { OpsContext, Toasts, Badge, usePoll, money, ago } from './ops/ui';
import DashboardPage from './ops/DashboardPage';
import { LiveOrdersPage, OrderManagementPage } from './ops/LiveOrdersPage';
import { DeliveryOpsPage, PartnersPage } from './ops/DeliveryPages';
import { CustomersPage, ChefsPage, MenuPage } from './ops/PeoplePages';
import PaymentsPage, { PaymentDrawer } from './ops/PaymentsPage';
import AnalyticsPage from './ops/AnalyticsPage';
import NotificationsPage from './ops/NotificationsPage';
import OrderDrawer from './ops/OrderDrawer';
import OffersPage from './ops/OffersPage';
import TiersPage from './ops/TiersPage';

const NAV = [
  ['Overview', [['dashboard', 'Dashboard', LayoutDashboard], ['live', 'Live orders', Radio], ['orders', 'Order management', ClipboardList]]],
  ['Delivery', [['delivery', 'Delivery operations', Truck], ['partners', 'Delivery partners', Bike]]],
  ['Business', [['customers', 'Customers', Users], ['chefs', 'Chefs / home cooks', ChefHat], ['menu', 'Menu management', Utensils], ['offers', 'Offers & Promos', Tag], ['tiers', 'Membership Tiers', Award], ['payments', 'Payments', CreditCard], ['revenue', 'Revenue & analytics', LineChart]]],
  ['System', [['notifications', 'Notifications', Bell]]]
];
const SECTIONS = NAV.flatMap(([, items]) => items.map(([id]) => id));

const HeaderSearch = ({ ops }) => {
  const [q, setQ] = useState('');
  const [res, setRes] = useState(null);
  useEffect(() => {
    if (q.trim().length < 2) { setRes(null); return undefined; }
    const id = setTimeout(() => api(`/admin/search?q=${encodeURIComponent(q.trim())}`).then(setRes).catch(() => setRes(null)), 250);
    return () => clearTimeout(id);
  }, [q]);
  const pick = (fn) => { setQ(''); setRes(null); fn(); };
  const none = res && !res.orders.length && !res.customers.length && !res.chefs.length;
  return (
    <div className="ops-hsearch">
      <Search size={15} aria-hidden="true" />
      <input type="search" placeholder="Search orders, customers, chefs" aria-label="Search orders, customers and chefs" value={q} onChange={(e) => setQ(e.target.value)} />
      {res && (
        <div className="ops-hresults" role="listbox">
          {none && <p className="muted small">No matches</p>}
          {res.orders.length > 0 && <><h5>Orders</h5>{res.orders.map((o) => <button type="button" key={o.id} onClick={() => pick(() => ops.openOrder(o.id))}>#{o.id} · {o.customer} · {money(o.total)} <Badge value={o.opsStatus} /></button>)}</>}
          {res.customers.length > 0 && <><h5>Customers</h5>{res.customers.map((c) => <button type="button" key={c.id} onClick={() => pick(() => ops.go('customers', c.id))}>{c.name} · {c.email}</button>)}</>}
          {res.chefs.length > 0 && <><h5>Chefs</h5>{res.chefs.map((c) => <button type="button" key={c.id} onClick={() => pick(() => ops.go('chefs'))}>{c.name} · {c.city}</button>)}</>}
        </div>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const { section: param } = useParams();
  const section = SECTIONS.includes(param) ? param : 'dashboard';
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [nav, setNav] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [orderId, setOrderId] = useState(null);
  const [paymentId, setPaymentId] = useState(null);
  const [focusId, setFocusId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const notes = usePoll('/admin/notifications', 8000);
  const health = usePoll('/health', 15000);
  const lastPending = useRef(null);

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  useEffect(() => { document.title = 'Rasoi Operations'; }, []);

  const toast = useCallback((text, tone = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-3), { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);
  // Tell the admin when a new order arrives (the count of new orders went up since the last poll).
  const pendingNow = notes.data?.counts.pendingOrders;
  useEffect(() => {
    if (pendingNow === undefined) return;
    if (lastPending.current !== null && pendingNow > lastPending.current) toast(`${pendingNow - lastPending.current} new order${pendingNow - lastPending.current > 1 ? 's' : ''} received`, 'info');
    lastPending.current = pendingNow;
  }, [pendingNow, toast]);

  const go = useCallback((id, focus = null) => { setFocusId(focus); setNav(false); navigate(id === 'dashboard' ? '/admin' : `/admin/${id}`); }, [navigate]);
  const ops = { go, toast, openOrder: setOrderId, openPayment: setPaymentId, refresh: notes.reload };
  const c = notes.data?.counts;
  const online = health.data && !health.error;

  const page = {
    dashboard: <DashboardPage />, live: <LiveOrdersPage />, orders: <OrderManagementPage />, delivery: <DeliveryOpsPage />, partners: <PartnersPage />,
    customers: <CustomersPage key={focusId || 'c'} focusId={focusId} />, chefs: <ChefsPage />, menu: <MenuPage />,
    offers: <OffersPage />, tiers: <TiersPage />,
    payments: <PaymentsPage />, revenue: <AnalyticsPage />, notifications: <NotificationsPage />
  }[section];

  return (
    <OpsContext.Provider value={ops}>
      <div className="ops-app">
        {nav && <div className="ops-scrim" onClick={() => setNav(false)} />}
        <aside className={`ops-side ${nav ? 'open' : ''}`} aria-label="Admin navigation">
          <div className="ops-brand"><span className="mark">R</span><div><strong>Rasoi</strong><small>Operations</small></div><button type="button" className="ops-icon only-mobile" onClick={() => setNav(false)} aria-label="Close menu"><X size={18} /></button></div>
          <nav>
            {NAV.map(([group, items]) => (
              <div key={group} className="ops-navgroup"><h6>{group}</h6>
                {items.map(([id, label, Icon]) => (
                  <button type="button" key={id} className={section === id ? 'on' : ''} aria-current={section === id ? 'page' : undefined} onClick={() => go(id)}>
                    <Icon size={16} aria-hidden="true" /><span>{label}</span>
                    {id === 'live' && c?.pendingOrders > 0 && <b>{c.pendingOrders}</b>}
                    {id === 'payments' && c?.paymentIssues > 0 && <b className="warn">{c.paymentIssues}</b>}
                    {id === 'notifications' && notes.data?.unread > 0 && <b>{notes.data.unread}</b>}
                  </button>))}
              </div>))}
          </nav>
          <div className="ops-side-foot">
            <div className="ops-me"><span className="ops-avatar">{(user?.name || 'A')[0]}</span><div><strong>{user?.name}</strong><small>Administrator</small></div></div>
            <button type="button" className="ops-sidelink" onClick={() => { logout(); navigate('/admin/login'); }}><LogOut size={14} /> Log out</button>
          </div>
        </aside>

        <div className="ops-main">
          <header className="ops-header">
            <button type="button" className="ops-icon only-mobile" onClick={() => setNav(true)} aria-label="Open menu"><Menu size={20} /></button>
            <HeaderSearch ops={ops} />
            <div className="ops-hright">
              <span className="ops-clock" aria-label="Current date and time"><strong>{new Date(now).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong><small>{new Date(now).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</small></span>
              {c && <>
                <button type="button" className={`ops-chip ${c.pendingOrders ? 'info' : ''}`} onClick={() => go('live')} title="Orders waiting for the kitchen">{c.pendingOrders} pending</button>
                {c.paymentIssues > 0 && <button type="button" className="ops-chip warn" onClick={() => go('payments')} title="Failed payments today and pending refunds"><AlertTriangle size={12} /> {c.paymentIssues} payment issue{c.paymentIssues > 1 ? 's' : ''}</button>}
                {c.deliveryDelays > 0 && <button type="button" className="ops-chip warn" onClick={() => go('delivery')} title="Late orders or orders waiting for a partner"><AlertTriangle size={12} /> {c.deliveryDelays} delivery delay{c.deliveryDelays > 1 ? 's' : ''}</button>}
              </>}
              <button type="button" className="ops-bell" onClick={() => go('notifications')} aria-label={`Notifications, ${notes.data?.unread || 0} unread`}><Bell size={18} />{notes.data?.unread > 0 && <b>{notes.data.unread > 99 ? '99+' : notes.data.unread}</b>}</button>
              <span className={`ops-sys ${online ? 'ok' : health.loading ? '' : 'bad'}`} title={health.data?.database || ''}><i />{online ? 'System online' : health.loading ? 'Checking' : 'Server unreachable'}</span>
            </div>
          </header>
          <main className="ops-content" id="ops-content">{page}</main>
        </div>
        {orderId && <OrderDrawer orderId={orderId} onClose={() => setOrderId(null)} />}
        {paymentId && <PaymentDrawer id={paymentId} onClose={() => setPaymentId(null)} onChanged={notes.reload} />}
        <Toasts items={toasts} dismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
      </div>
    </OpsContext.Provider>
  );
};
export default AdminDashboard;
