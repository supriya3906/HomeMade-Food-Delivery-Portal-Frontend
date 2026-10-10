import React, { useMemo } from 'react';

// Operational map: zones, delivery partners and open orders drawn from their real coordinates.
// It is a schematic projection (no map tiles are loaded), so it works offline and shows exactly what the
// dispatcher uses: positions in latitude / longitude. Partner dots without GPS sit at their zone centre.
const COLOR = { available: '#1F7A4D', on_delivery: '#B7791F', offline: '#9AA0AB' };
const ORDER_COLOR = { NEW: '#2563EB', PREPARING: '#B7791F', READY_FOR_PICKUP: '#7C3AED', OUT_FOR_DELIVERY: '#C1531B' };

const DeliveryMap = ({ zones = [], partners = [], orders = [], height = 300, highlight }) => {
  const W = 640, H = height;
  const proj = useMemo(() => {
    const pts = [...zones, ...partners.filter((p) => p.lat !== null), ...orders];
    if (!pts.length) return null;
    const pad = 0.04;
    const lats = pts.map((p) => p.lat), lngs = pts.map((p) => p.lng);
    let minLat = Math.min(...lats) - pad, maxLat = Math.max(...lats) + pad, minLng = Math.min(...lngs) - pad, maxLng = Math.max(...lngs) + pad;
    const k = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180));
    const spanX = (maxLng - minLng) * k, spanY = maxLat - minLat;
    const scale = Math.min((W - 40) / spanX, (H - 40) / spanY);
    const ox = (W - spanX * scale) / 2, oy = (H - spanY * scale) / 2;
    return { x: (lng) => ox + (lng - minLng) * k * scale, y: (lat) => oy + (maxLat - lat) * scale, kmPx: scale / 111 };
  }, [zones, partners, orders, H]);
  if (!proj) return <div className="ops-map empty">No coordinates yet — add delivery zones and partner positions.</div>;
  return (
    <div className="ops-map">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Delivery operations map" preserveAspectRatio="xMidYMid meet">
        <rect width={W} height={H} className="map-bg" />
        {zones.map((z) => (
          <g key={z.id}>
            <circle cx={proj.x(z.lng)} cy={proj.y(z.lat)} r={Math.max(8, (z.radiusKm || 8) * proj.kmPx)} className={`map-zone ${highlight === z.id ? 'on' : ''}`} />
            <text x={proj.x(z.lng)} y={proj.y(z.lat) - 4} textAnchor="middle" className="map-zone-label">{z.name}</text>
          </g>
        ))}
        {orders.map((o) => <rect key={o.id} x={proj.x(o.lng) - 4} y={proj.y(o.lat) - 4} width="8" height="8" rx="1.5" fill={ORDER_COLOR[o.status] || '#2563EB'} stroke="#fff" strokeWidth="1.5"><title>Order {o.id} · {o.status}</title></rect>)}
        {partners.filter((p) => p.lat !== null).map((p) => (
          <g key={p.id} transform={`translate(${proj.x(p.lng)} ${proj.y(p.lat)})`}>
            <circle r="7" fill={COLOR[p.status]} stroke="#fff" strokeWidth="2" strokeDasharray={p.positionSource === 'gps' ? undefined : '0'}><title>{p.name} · {p.status.replace('_', ' ')} · position: {p.positionSource === 'gps' ? 'live GPS' : p.positionSource === 'zone' ? 'zone centre' : 'last known'}</title></circle>
            <text y="-11" textAnchor="middle" className="map-partner-label">{p.name}</text>
            {p.positionSource === 'gps' && <circle r="11" fill="none" stroke={COLOR[p.status]} strokeWidth="1" opacity="0.5" />}
          </g>
        ))}
      </svg>
      <ul className="ops-map-legend">
        <li><i style={{ background: COLOR.available }} />Available</li><li><i style={{ background: COLOR.on_delivery }} />On delivery</li><li><i style={{ background: COLOR.offline }} />Offline</li>
        <li><i className="sq" style={{ background: '#2563EB' }} />Open order</li><li className="muted">Ringed dot = live GPS</li>
      </ul>
    </div>
  );
};
export default DeliveryMap;
