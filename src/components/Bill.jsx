import React from 'react';
import { Printer, UtensilsCrossed } from 'lucide-react';
import { TAX_PERCENT } from '../config/pricing';
import { useT } from '../i18n/useT';
import { useLocalize, useCatalog } from '../context/CatalogContext';
import { formatDate } from '../utils/format';

// `t` is the translate function from useT(), so the text follows the website language.
export const paymentSummary = (order, t) => {
  const label = order.paymentMethod === 'cod' ? t('checkout.cod') : order.paymentLabel;
  // Orders placed before card payments were removed still show their card details.
  if (order.cardLast4) return `${label}${order.cardBrand ? ` · ${order.cardBrand}` : ''} ${t('bill.ending')} ${order.cardLast4}`;
  if (order.upiId) return `${label} · ${order.upiId}`;
  return label;
};

export const paymentStatusLabel = (order, t) =>
  ({
    paid: t('pay.paid'),
    pay_on_delivery: t('pay.pod'),
    refund_initiated: t('pay.refund'),
    refunded: t('pay.refunded'),
    cancelled: t('pay.cancelled')
  })[order.paymentStatus] || t('pay.pending');

// Printable bill generated for every order. The amounts come from the server
// (backend/src/pricing.js), so what's shown here is exactly what was charged.
const Bill = ({ order }) => {
  const { t, language } = useT();
  const { foodName, chefName } = useLocalize();
  const { getFoodById, getChefById } = useCatalog();
  return (
  <section className="bill" aria-label={t('bill.aria')}>
    <div className="bill-head">
      <div className="bill-brand">
        <span className="brand-mark"><UtensilsCrossed size={18} /></span>
        <strong>Ras<span>oi</span></strong>
      </div>
      <div className="bill-meta">
        <strong>{order.invoiceNo}</strong>
        <span>{formatDate(order.placedAt, language)}</span>
      </div>
    </div>

    <p className="bill-to">
      {t('bill.billedTo')} <strong>{order.address.name}</strong>, {order.address.address}, {order.address.city} - {order.address.pincode}
    </p>

    <table className="bill-table">
      <thead>
        <tr><th>{t('bill.item')}</th><th>{t('bill.qty')}</th><th>{t('bill.price')}</th><th>{t('bill.amount')}</th></tr>
      </thead>
      <tbody>
        {order.items.map((item) => (
          <tr key={item.id}>
            <td>{foodName(getFoodById(item.id)) || item.name}{item.chefName && <small>{t('bill.chef', { name: chefName(getChefById(item.chefId)) || item.chefName })}</small>}</td>
            <td>{item.quantity}</td>
            <td>₹{item.price}</td>
            <td>₹{item.price * item.quantity}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <div className="bill-totals">
      <div className="summary-row"><span>{t('bill.subtotal')}</span><span>₹{order.subtotal}</span></div>
      <div className="summary-row"><span>{t('bill.delivery')}</span><span>{order.deliveryFee === 0 ? (order.paymentMethod === 'upi' ? t('checkout.freeUpi') : t('bill.free')) : `₹${order.deliveryFee}`}</span></div>
      {order.discount > 0 && <div className="summary-row discount"><span>{t('bill.coupon', { code: order.couponCode })}</span><span>− ₹{order.discount}</span></div>}
      {order.paymentFee > 0 && (
        <div className="summary-row"><span>{order.paymentFeeLabel}</span><span>₹{order.paymentFee}</span></div>
      )}
      {order.tax > 0 && <div className="summary-row"><span>{t('checkout.tax', { p: TAX_PERCENT })}</span><span>₹{order.tax}</span></div>}
      <div className="summary-row total"><span>{t('common.total')}</span><span>₹{order.total}</span></div>
    </div>

    <p className="bill-pay">
      <strong>{paymentSummary(order, t)}</strong> &middot; {paymentStatusLabel(order, t)}
      {order.transactionId && <><br />{t('bill.txn')} {order.transactionId}</>}
    </p>

    <button type="button" className="btn btn-secondary btn-sm no-print" onClick={() => window.print()}>
      <Printer size={14} /> {t('bill.print')}
    </button>
  </section>
  );
};

export default Bill;
