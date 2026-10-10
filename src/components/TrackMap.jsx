import React, { useRef, useLayoutEffect, useState } from 'react';
import { useT } from '../i18n/useT';

// Illustrated route from the chef's kitchen to the customer's door (not a tiled map).
// `progress` (0-1) is how far along the delivery partner is. When the server sends `tracking`
// (distance, ETA, position source) the strip below the map shows it. The partner position is only
// called GPS when a real GPS report exists; otherwise the strip says it is an estimate.
const PATH = 'M 70 150 C 170 40, 250 40, 320 110 S 470 190, 530 70';

const SUB_STEPS = ['placed', 'preparing', 'ready', 'partner_assigned', 'picked_up', 'out_for_delivery', 'arriving_soon', 'delivered'];
const STEP_LABEL = { placed: 'live.s.placed', preparing: 'live.s.preparing', ready: 'live.s.ready', partner_assigned: 'live.s.assigned', picked_up: 'live.s.picked', out_for_delivery: 'live.s.out', arriving_soon: 'live.s.arriving', delivered: 'live.s.delivered' };
// The server reports 'out_for_delivery' for both "picked up" and "on the way"; show picked up as done once out.
const stepIndex = (sub) => (sub === 'out_for_delivery' ? 5 : Math.max(0, SUB_STEPS.indexOf(sub)));

const TrackMap = ({ stage, progress, cancelled, tracking, partner }) => {
  const { t } = useT();
  const pathRef = useRef(null);
  const [pos, setPos] = useState({ x: 70, y: 150 });

  useLayoutEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    const p = tracking?.progress ?? progress;
    const t = stage >= 3 ? 1 : stage === 2 ? Math.min(0.97, Math.max(0.04, p)) : 0;
    const pt = path.getPointAtLength(len * t);
    setPos({ x: pt.x, y: pt.y });
  }, [stage, progress, tracking?.progress]);

  const moving = stage === 2 && !cancelled;

  return (
    <div className="track-map">
      <div aria-hidden="true">
      <svg viewBox="0 0 600 220" role="img">
        <rect className="map-bg" x="0" y="0" width="600" height="220" rx="16" />
        <g className="map-blocks">
          <rect x="120" y="150" width="70" height="40" rx="8" />
          <rect x="220" y="150" width="50" height="50" rx="8" />
          <rect x="360" y="20" width="80" height="40" rx="8" />
          <rect x="440" y="130" width="60" height="60" rx="8" />
          <rect x="20" y="30" width="60" height="50" rx="8" />
          <rect x="230" y="20" width="60" height="30" rx="8" />
        </g>
        <path className="map-road-base" d={PATH} />
        <path ref={pathRef} className="map-road" d={PATH} />

        {/* kitchen */}
        <g transform="translate(70 150)">
          <circle className={`map-pin kitchen ${stage <= 1 && !cancelled ? 'pulse' : ''}`} r="15" />
          <text className="map-emoji" textAnchor="middle" dy="6">🍳</text>
        </g>
        {/* home */}
        <g transform="translate(530 70)">
          <circle className={`map-pin home ${stage >= 3 ? 'pulse' : ''}`} r="15" />
          <text className="map-emoji" textAnchor="middle" dy="6">🏠</text>
        </g>
        {/* delivery partner */}
        {stage >= 2 && !cancelled && (
          <g className={`map-rider ${moving ? 'moving' : ''}`} style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}>
            <circle className="map-rider-ring" r="19" />
            <circle className="map-rider-dot" r="14" />
            <text className="map-emoji" textAnchor="middle" dy="6">🛵</text>
          </g>
        )}
      </svg>
      <div className="map-labels">
        <span>{t('map.kitchen')}</span>
        <span>{t('map.door')}</span>
      </div>
      </div>
      {tracking && !cancelled && <LiveStrip tracking={tracking} partner={partner} stage={stage} />}
    </div>
  );
};

const LiveStrip = ({ tracking, partner, stage }) => {
  const { t } = useT();
  const sub = tracking.subStage;
  const idx = stepIndex(sub);
  const gps = tracking.partner?.source === 'gps';
  const when = tracking.lastUpdatedAt ? Math.max(0, Math.round((Date.now() - new Date(tracking.lastUpdatedAt).getTime()) / 60000)) : null;
  return (
    <div className="live-strip">
      {stage === 2 && partner && (
        <>
          <div className="live-head">
            <strong>{t('live.onTheWay', { partner: partner.name })}</strong>
            {partner.phone && <a className="btn btn-secondary btn-sm" href={`tel:${partner.phone}`}>{t('live.call', { partner: partner.name })}</a>}
          </div>
          <div className="live-stats">
            {tracking.etaMinutes !== null && <div><span>{t('live.eta')}</span><strong>{t('live.minutes', { n: tracking.etaMinutes })}</strong></div>}
            {tracking.distanceKm !== null && <div><span>{t('live.distance')}</span><strong>{tracking.distanceKm} km</strong></div>}
          </div>
          <p className="live-note">{gps ? t('live.gps') : t('live.estimated')}{when !== null && ` · ${t('live.updated', { when: when === 0 ? '<1 min' : `${when} min` })}`}</p>
        </>
      )}
      {stage < 2 && sub !== 'cancelled' && !partner && sub === 'ready' && <p className="live-note">{t('live.waiting')}</p>}
      <ol className="live-steps" aria-label={t('live.steps')}>
        {SUB_STEPS.map((k, i) => <li key={k} className={i < idx || sub === 'delivered' ? 'done' : i === idx ? 'now' : ''} aria-current={i === idx ? 'step' : undefined}><i />{t(STEP_LABEL[k])}</li>)}
      </ol>
    </div>
  );
};

export default TrackMap;
