import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Check, Navigation, ReceiptText, Clock } from 'lucide-react';
import { useOrders } from '../context/OrdersContext';
import { paymentSummary, paymentStatusLabel } from '../components/Bill';
import CheckoutStepper from '../components/CheckoutStepper';
import { useT } from '../i18n/useT';
import { formatClock } from '../utils/format';
import { useCatalog, useLocalize } from '../context/CatalogContext';

const OrderConfirmation = () => {
  const { id } = useParams();
  const { getOrder, loaded } = useOrders();
  const order = getOrder(id);
  const { t, language } = useT();
  const { getChefById, getFoodById } = useCatalog();
  const { chefName, foodName } = useLocalize();

  if (!loaded) return <div className="page-container"><p className="muted">{t('od.loading')}</p></div>;
  if (!order) return <Navigate to="/orders" replace />;

  const chefNames = order.chefs.map((c) => chefName(getChefById(c.id)) || c.name).join(', ');

  return (
    <div className="page-container checkout-page">
      <div className="checkout-head"><h1>{t('oc.title')}</h1></div>
      <CheckoutStepper step={4} />

      <div className="confirm-card">
        <div className="result-badge success"><Check size={38} strokeWidth={3} /></div>
        <h2>{t('oc.thanks')}</h2>
        <p className="muted">
          {t(order.chefs.length > 1 ? 'oc.notifiedMany' : 'oc.notifiedOne', { id: order.id, chefs: chefNames })}
        </p>
        {order.etaAt && (
          <p className="confirm-eta"><Clock size={16} /> {t('oc.eta')} <strong>{formatClock(order.etaAt, language)}</strong></p>
        )}

        <div className="confirm-summary">
          {order.items.map((it) => (
            <div className="summary-row" key={it.id}><span>{foodName(getFoodById(it.id)) || it.name} × {it.quantity}</span><span>₹{it.price * it.quantity}</span></div>
          ))}
          <div className="summary-row total"><span>{t('common.total')}</span><span>₹{order.total}</span></div>
          <p className="muted small">
            {paymentSummary(order, t)} · {paymentStatusLabel(order, t)}
            {order.transactionId && <> · {t('bill.txn')} {order.transactionId}</>}
          </p>
        </div>

        <div className="confirmation-actions">
          <Link to={`/orders/${order.id}/track`} className="btn btn-primary"><Navigation size={16} /> {t('od.track')}</Link>
          <Link to={`/orders/${order.id}`} className="btn btn-secondary"><ReceiptText size={16} /> {t('od.viewBill')}</Link>
          <Link to="/menu" className="btn btn-secondary">{t('oc.more')}</Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
