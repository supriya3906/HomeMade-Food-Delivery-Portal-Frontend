import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Navigation } from 'lucide-react';
import { useOrders, ORDER_STAGES } from '../context/OrdersContext';
import { useT } from '../i18n/useT';
import Bill, { paymentSummary, paymentStatusLabel } from '../components/Bill';
import ReviewCard from '../components/ReviewCard';
import { formatDate } from '../utils/format';
import { useLocalize, useCatalog } from '../context/CatalogContext';

const OrderDetails = () => {
  const { id } = useParams();
  const { getOrder, loaded } = useOrders();
  const { t, language } = useT();
  const { chefName } = useLocalize();
  const { getChefById } = useCatalog();
  const order = getOrder(id);

  if (!loaded) return <div className="page-container"><p className="muted">{t('od.loading')}</p></div>;
  if (!order) return <Navigate to="/orders" replace />;

  const cancelled = order.status === 'cancelled';
  const active = !cancelled && order.stage < ORDER_STAGES.length - 1;

  return (
    <div className="page-container">
      <nav className="breadcrumb no-print">
        <Link to="/orders">{t('trk.crumb')}</Link> / <span>#{order.id}</span>
      </nav>

      <div className="order-detail-head no-print">
        <h1>{t('od.order', { id: order.id })}</h1>
        <span className="muted">{t('od.placed', { date: formatDate(order.placedAt, language) })}</span>
      </div>

      <div className="order-status-strip no-print">
        <span className={`status-pill ${cancelled ? 'cancelled' : `stage-${order.stage}`}`}>
          {cancelled ? t('orders.cancelled') : t(`stage.${order.stage}`)}
        </span>
        <Link to={`/orders/${order.id}/track`} className={`btn btn-sm ${active ? 'btn-primary' : 'btn-secondary'}`}>
          <Navigation size={14} /> {active ? t('od.track') : t('od.viewTrack')}
        </Link>
      </div>

      {!cancelled && order.stage === ORDER_STAGES.length - 1 && <ReviewCard order={order} />}

      <div className="order-detail-grid no-print">
        <section>
          <h2>{t('od.delivery')}</h2>
          <p><strong>{order.address.name}</strong></p>
          <p>{order.address.phone}</p>
          <p>{order.address.address}, {order.address.city} - {order.address.pincode}</p>
          {order.address.notes && <p className="muted">{t('od.note', { note: order.address.notes })}</p>}
        </section>

        <section>
          <h2>{t('od.payment')}</h2>
          <p><strong>{paymentSummary(order, t)}</strong></p>
          <p className={`pay-status ${order.paymentStatus}`}>{paymentStatusLabel(order, t)}</p>
          <h2 style={{ marginTop: '1.25rem' }}>{t('od.chefs')}</h2>
          {order.chefs.map((chef) => (
            <p key={chef.id}><Link to={`/chefs/${chef.id}`}>{chefName(getChefById(chef.id)) || chef.name}</Link></p>
          ))}
        </section>
      </div>

      <Bill order={order} />
    </div>
  );
};

export default OrderDetails;
