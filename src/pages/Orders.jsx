import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PackageOpen, Trash2 } from 'lucide-react';
import { useOrders, ORDER_STAGES } from '../context/OrdersContext';
import { useT } from '../i18n/useT';
import { formatDate } from '../utils/format';
import { useCatalog, useLocalize } from '../context/CatalogContext';

const isActive = (order) => order.status !== 'cancelled' && order.stage < ORDER_STAGES.length - 1;

const Orders = () => {
  const { orders, loaded, loadError, removeOrder } = useOrders();
  const { t, language } = useT();
  const { getFoodById } = useCatalog();
  const { foodName } = useLocalize();
  const [confirmId, setConfirmId] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [error, setError] = useState('');

  if (!loaded) return <div className="page-container"><p className="muted">{t('od.loadingList')}</p></div>;
  if (loadError) return <div className="page-container"><div className="form-error" role="alert">{loadError}</div></div>;

  if (orders.length === 0) {
    return (
      <div className="page-container">
        <div className="empty-state large">
          <PackageOpen size={40} />
          <h2>{t('orders.none')}</h2>
          <p>{t('orders.noneText')}</p>
          <Link to="/menu" className="btn btn-primary">{t('cart.browse')}</Link>
        </div>
      </div>
    );
  }

  const doRemove = async (orderId) => {
    setError('');
    setRemoving(orderId);
    try {
      await removeOrder(orderId);
    } catch (err) {
      setError(err.message);
    } finally {
      setRemoving(null);
      setConfirmId(null);
    }
  };

  return (
    <div className="page-container">
      <h1>{t('orders.title')}</h1>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="order-list">
        {orders.map((order) => (
          <div key={order.id} className="order-row-wrap">
            <Link to={isActive(order) ? `/orders/${order.id}/track` : `/orders/${order.id}`} className="order-row">
              <div className="order-row-main">
                <strong>#{order.id}</strong>
                <span className="muted">{formatDate(order.placedAt, language, false)}</span>
              </div>
              <p className="order-row-items">
                {order.items.map((it) => foodName(getFoodById(it.id)) || it.name).join(', ')}
              </p>
              <div className="order-row-footer">
                <span className="order-row-status">
                  <span className={`status-pill ${order.status === 'cancelled' ? 'cancelled' : `stage-${order.stage}`}`}>
                    {order.status === 'cancelled' ? t('orders.cancelled') : t(`stage.${order.stage}`)}
                  </span>
                  {isActive(order) && <span className="track-cta">{t('orders.track')}</span>}
                  {order.status !== 'cancelled' && order.stage === ORDER_STAGES.length - 1 && (
                    <span className={`review-tag ${order.review ? 'done' : ''}`}>
                      {order.review ? `${t('review.reviewed')} · ${order.review.rating}★` : t('review.rateCta')}
                    </span>
                  )}
                </span>
                <span className="order-row-total">₹{order.total}</span>
              </div>
            </Link>

            {confirmId === order.id ? (
              <div className="order-row-confirm">
                <span className="muted">{t('orders.removeAsk')}</span>
                <button type="button" className="btn btn-danger btn-sm" disabled={removing === order.id} onClick={() => doRemove(order.id)}>
                  {removing === order.id ? '…' : t('orders.removeYes')}
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirmId(null)}>{t('cart.keep')}</button>
              </div>
            ) : (
              <button
                type="button"
                className="icon-btn order-row-remove"
                onClick={() => setConfirmId(order.id)}
                aria-label={t('orders.remove')}
                title={t('orders.remove')}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
