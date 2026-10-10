import React, { useState } from 'react';
import { Star, CheckCircle2 } from 'lucide-react';
import { useOrders } from '../context/OrdersContext';
import { useT } from '../i18n/useT';

const Stars = ({ value, onChange, label, readOnly = false }) => (
  <div className="star-input" role={readOnly ? 'img' : 'radiogroup'} aria-label={`${label}: ${value || 0} / 5`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        className={n <= value ? 'on' : ''}
        onClick={() => !readOnly && onChange(n)}
        role={readOnly ? undefined : 'radio'}
        aria-checked={readOnly ? undefined : n === value}
        aria-label={`${n} star${n > 1 ? 's' : ''}`}
        disabled={readOnly}
      >
        <Star size={26} fill={n <= value ? 'currentColor' : 'none'} />
      </button>
    ))}
  </div>
);

// Shown once an order is delivered: rate the food and the delivery, add a comment.
// One review per order; after submitting it becomes a read-only "Your review".
const ReviewCard = ({ order }) => {
  const { submitReview } = useOrders();
  const { t } = useT();
  const [rating, setRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (order.review) {
    const r = order.review;
    return (
      <section className="review-card done no-print" aria-label={t('review.yours')}>
        <h2><CheckCircle2 size={20} /> {t('review.thanks')}</h2>
        <p className="muted">{t('review.yours')}</p>
        <div className="review-row"><span>{t('review.food')}</span><Stars value={r.rating} label={t('review.food')} readOnly /></div>
        {r.deliveryRating && <div className="review-row"><span>{t('review.delivery')}</span><Stars value={r.deliveryRating} label={t('review.delivery')} readOnly /></div>}
        {r.comment && <blockquote className="review-comment">{r.comment}</blockquote>}
      </section>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return setError(t('review.pick'));
    setError('');
    setBusy(true);
    try {
      await submitReview(order.id, { rating, deliveryRating: deliveryRating || null, comment: comment.trim() });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="review-card no-print" onSubmit={submit} noValidate>
      <h2>{t('review.title')}</h2>
      <p className="muted">{t('review.sub')}</p>
      <div className="review-row"><span>{t('review.food')}</span><Stars value={rating} onChange={setRating} label={t('review.food')} /></div>
      <div className="review-row"><span>{t('review.delivery')}</span><Stars value={deliveryRating} onChange={setDeliveryRating} label={t('review.delivery')} /></div>
      <div className="form-group">
        <label className="form-label" htmlFor={`rv-${order.id}`}>{t('review.comment')}</label>
        <textarea id={`rv-${order.id}`} className="form-input" rows={3} maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('review.commentPh')} />
      </div>
      {error && <div className="form-error" role="alert">{error}</div>}
      <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? t('auth.wait') : t('review.submit')}</button>
    </form>
  );
};

export default ReviewCard;
