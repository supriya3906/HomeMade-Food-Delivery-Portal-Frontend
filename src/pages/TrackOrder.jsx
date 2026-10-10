import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import {
  ClipboardCheck, CookingPot, Bike, PartyPopper, XCircle, CheckCircle2, Circle, MapPin,
  ReceiptText, Star, ShieldCheck, Clock
} from 'lucide-react';
import { useOrders, ORDER_STAGES } from '../context/OrdersContext';
import { paymentSummary, paymentStatusLabel } from '../components/Bill';
import TrackMap from '../components/TrackMap';
import ReviewCard from '../components/ReviewCard';
import { useT } from '../i18n/useT';
import { formatClock, formatDate } from '../utils/format';
import { useCatalog, useLocalize } from '../context/CatalogContext';

const STAGE_ICONS = [ClipboardCheck, CookingPot, Bike, PartyPopper];

const initials = (name = '') => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

const TrackOrder = () => {
  const { id } = useParams();
  const { getOrder, refreshOrder, cancelOrder, loaded } = useOrders();
  const { t, language } = useT();
  const clock = (iso) => formatClock(iso, language);
  const dateTime = (iso) => formatDate(iso, language, false);
  const { getChefById, getFoodById } = useCatalog();
  const { chefName, foodName } = useLocalize();
  const [liveOrder, setLiveOrder] = useState(() => getOrder(id) || null);
  const [fetching, setFetching] = useState(!liveOrder);
  const [fetchError, setFetchError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [actionError, setActionError] = useState('');

  const order = liveOrder || getOrder(id);
  const active = !!order && order.status !== 'cancelled' && order.stage < ORDER_STAGES.length - 1;

  // Tick every second for live timers
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  // Poll live order updates directly from backend
  useEffect(() => {
    let cancelled = false;
    const loadStatus = async () => {
      try {
        const o = await refreshOrder(id);
        if (!cancelled && o) setLiveOrder(o);
      } catch (err) {
        if (!cancelled && !order) setFetchError(err.message || 'Order not found');
      } finally {
        if (!cancelled) setFetching(false);
      }
    };
    loadStatus();
    const poll = setInterval(loadStatus, 2000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [id, refreshOrder]);

  if (fetching && !order) {
    return (
      <div className="page-container track-page">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div className="spin" style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 16px' }} />
          <h3>Connecting to live order tracking...</h3>
          <p className="muted">Fetching real-time updates for #{id}</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page-container track-page">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h2>Order #{id} not found</h2>
          <p className="muted">{fetchError || 'Unable to locate this order.'}</p>
          <Link to="/orders" className="btn btn-primary" style={{ marginTop: 16 }}>View My Orders</Link>
        </div>
      </div>
    );
  }

  const cancelled = order.status === 'cancelled';
  const stage = order.stage;
  const delivered = !cancelled && stage === ORDER_STAGES.length - 1;
  const chefOf = (c) => chefName(getChefById(c.id)) || c.name;
  const chefNames = order.chefs.map(chefOf).join(', ');
  const many = order.chefs.length > 1;
  const partner = order.partner;

  const etaMs = order.etaAt ? new Date(order.etaAt).getTime() : null;
  const minsLeft = etaMs ? Math.ceil((etaMs - now) / 60000) : null;
  const outSince = order.stageTimes?.[2] ? new Date(order.stageTimes[2]).getTime() : null;
  const progress = outSince && etaMs && etaMs > outSince ? (now - outSince) / (etaMs - outSince) : 0;

  const headline = cancelled
    ? t('track.cancelled')
    : t(`track.h${stage}`);
  const sub = cancelled
    ? order.paymentStatus === 'refund_initiated'
      ? t('trk.refundNote', { n: order.total })
      : t('trk.cancelledNote')
    : [
        t(many ? 'trk.sub0Many' : 'trk.sub0One', { chefs: chefNames }),
        `${t(many ? 'trk.sub1Many' : 'trk.sub1One', { chefs: chefNames })}${partner ? ` ${t('trk.sub1Partner', { partner: partner.name })}` : ''}`,
        t('trk.sub2', { partner: partner ? partner.name : t('trk.partnerDefault') }),
        order.stageTimes?.[3] ? t('trk.sub3At', { time: clock(order.stageTimes[3]) }) : t('trk.sub3')
      ][stage];

  const HeroIcon = cancelled ? XCircle : STAGE_ICONS[stage];

  const run = async (fn) => {
    setActionError('');
    try { await fn(order.id); } catch (err) { setActionError(err.message); }
    setConfirmCancel(false);
  };

  let etaBlock = null;
  if (!cancelled && !delivered && etaMs) {
    etaBlock = (
      <div className="eta">
        <span className="eta-label"><Clock size={14} /> {t('trk.arriving')}</span>
        <strong className="eta-time">{clock(order.etaAt)}</strong>
        <span className="eta-sub">{minsLeft > 1 ? t('trk.inMin', { n: minsLeft }) : minsLeft === 1 ? t('trk.inOne') : t('trk.anyMoment')}</span>
      </div>
    );
  } else if (delivered && order.stageTimes?.[3]) {
    etaBlock = (
      <div className="eta done">
        <span className="eta-label">{t('trk.deliveredAt')}</span>
        <strong className="eta-time">{clock(order.stageTimes[3])}</strong>
      </div>
    );
  }

  return (
    <div className="page-container track-page">
      <nav className="breadcrumb no-print">
        <Link to="/orders">{t('trk.crumb')}</Link> / <span>#{order.id}</span>
      </nav>

      <section className={`track-hero ${cancelled ? 'cancelled' : ''} ${delivered ? 'delivered' : ''}`}>
        <div className="track-hero-main">
          <span className="track-hero-icon"><HeroIcon size={28} /></span>
          <div>
            <p className="track-eyebrow">{t('od.order', { id: order.id })}</p>
            <h1>{headline}</h1>
            <p className="track-sub">{sub}</p>
          </div>
        </div>
        {etaBlock}
        {!cancelled && (
          <div className="track-progress" role="progressbar" aria-valuemin={0} aria-valuemax={3} aria-valuenow={stage} aria-label={t('trk.progress')}>
            {ORDER_STAGES.map((label, i) => (
              <div key={label} className={`seg ${i < stage ? 'done' : i === stage ? (delivered ? 'done' : 'current') : ''}`} />
            ))}
          </div>
        )}
      </section>

      {delivered && <ReviewCard order={order} />}

      {!cancelled && <TrackMap stage={stage} progress={progress} cancelled={cancelled} tracking={order.tracking} partner={partner} />}

      {stage === 2 && !cancelled && order.deliveryOtp && (
        <div className="otp-banner">
          <ShieldCheck size={20} />
          <p>{t('trk.otp')} <strong className="otp-code">{order.deliveryOtp}</strong></p>
        </div>
      )}

      <div className="track-grid">
        <div className="track-col">
          <section className="track-card">
            <h2>{t('track.status')}</h2>
            <ol className="timeline">
              {ORDER_STAGES.map((label, i) => {
                const reached = !cancelled ? i <= stage : i === 0;
                const current = !cancelled && i === stage && !delivered;
                const time = order.stageTimes?.[i];
                const Icon = STAGE_ICONS[i];
                return (
                  <li key={label} className={`tl-item ${reached ? 'done' : ''} ${current ? 'current' : ''}`}>
                    <span className="tl-dot">{reached && !current ? <CheckCircle2 size={20} /> : current ? <Icon size={16} /> : <Circle size={20} />}</span>
                    <div className="tl-body">
                      <strong>{t(`stage.${i}`)}</strong>
                      <span>{t(`trk.note${i}`)}</span>
                    </div>
                    <time className="tl-time">{reached && time ? clock(time) : current ? t('trk.inProgress') : ''}</time>
                  </li>
                );
              })}
              {cancelled && (
                <li className="tl-item cancelled">
                  <span className="tl-dot"><XCircle size={20} /></span>
                  <div className="tl-body"><strong>{t('trk.cancelledTitle')}</strong><span>{order.cancelledAt ? dateTime(order.cancelledAt) : ''}</span></div>
                </li>
              )}
            </ol>
          </section>

          {active && (
            <section className="track-card">
              <h2>{t('trk.manage')}</h2>
              {stage < 2 ? (
                confirmCancel ? (
                  <div className="confirm-inline">
                    <span className="muted">{t('trk.cancelAsk')}{order.paymentStatus === 'paid' ? t('trk.refunded') : ''}</span>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => run(cancelOrder)}>{t('trk.yesCancel')}</button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirmCancel(false)}>{t('trk.keep')}</button>
                  </div>
                ) : (
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirmCancel(true)}>{t('trk.cancel')}</button>
                )
              ) : (
                <p className="muted">{t('trk.noCancel')}</p>
              )}
              {actionError && <div className="form-error" role="alert">{actionError}</div>}
            </section>
          )}
        </div>

        <div className="track-col">
          {partner && !cancelled && (
            <section className="track-card partner-card">
              <h2>{t('trk.partner')}</h2>
              <div className="person">
                <span className="avatar">{initials(partner.name)}</span>
                <div>
                  <strong>{partner.name}</strong>
                  <span className="muted">{partner.rating ? <><Star size={12} className="star" /> {partner.rating} · </> : null}{partner.vehicle}{partner.vehicleNo ? ` · ${partner.vehicleNo}` : ''}</span>
                </div>
              </div>
              <p className="muted small">{stage >= 3 ? t('trk.partnerDone') : stage === 2 ? t('trk.partnerOut') : t('trk.partnerAssigned')}</p>
            </section>
          )}

          <section className="track-card">
            <h2>{t(many ? 'trk.chefMany' : 'trk.chefOne')}</h2>
            {order.chefs.map((chef) => (
              <Link key={chef.id} to={`/chefs/${chef.id}`} className="person link">
                <span className="avatar chef">{initials(chefOf(chef))}</span>
                <div><strong>{chefOf(chef)}</strong><span className="muted">{order.items.filter((it) => it.chefId === chef.id).map((it) => foodName(getFoodById(it.id)) || it.name).join(', ')}</span></div>
              </Link>
            ))}
          </section>

          <section className="track-card">
            <h2>{t('trk.deliveringTo')}</h2>
            <p className="addr"><MapPin size={16} /> <span><strong>{order.address.name}</strong><br />{order.address.address}, {order.address.city} - {order.address.pincode}{order.address.notes && <><br /><span className="muted">{t('od.note', { note: order.address.notes })}</span></>}</span></p>
          </section>

          <section className="track-card">
            <h2>{t('od.payment')}</h2>
            <div className="summary-row"><span>{t('common.total')}</span><strong>₹{order.total}</strong></div>
            <p className="muted small">{paymentSummary(order, t)}</p>
            <p className={`pay-status ${order.paymentStatus}`}>{paymentStatusLabel(order, t)}</p>
            <Link to={`/orders/${order.id}`} className="btn btn-secondary btn-sm bill-link"><ReceiptText size={14} /> {t('od.viewBill')}</Link>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
