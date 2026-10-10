import React from 'react';

const niceMax = (v) => { if (v <= 0) return 10; const p = 10 ** Math.floor(Math.log10(v)); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; };
const short = (n) => (n >= 100000 ? `${(n / 100000).toFixed(1)}L` : n >= 1000 ? `${(n / 1000).toFixed(n % 1000 ? 1 : 0)}k` : `${Math.round(n)}`);

// Vertical bars. data: [{ key, label, value }]. Clicking a bar calls onSelect(key).
export const BarChart = ({ data, height = 190, prefix = '', onSelect, selected, color = 'var(--ops-brand)' }) => {
  const W = 560, H = height, L = 38, B = 24, T = 10, R = 6;
  const max = niceMax(Math.max(0, ...data.map((d) => d.value || 0)));
  const bw = (W - L - R) / Math.max(1, data.length);
  const y = (v) => T + (H - T - B) * (1 - v / max);
  return (
    <svg className="ops-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Bar chart" preserveAspectRatio="none">
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}><line x1={L} x2={W - R} y1={y(max * f)} y2={y(max * f)} className="grid" /><text x={L - 6} y={y(max * f) + 3} textAnchor="end" className="axis">{prefix}{short(max * f)}</text></g>
      ))}
      {data.map((d, i) => {
        const x = L + i * bw + bw * 0.18, w = bw * 0.64, h = Math.max(d.value ? 2 : 0, H - B - y(d.value || 0));
        const on = selected === d.key;
        return (
          <g key={d.key} className={onSelect ? 'clickable' : ''} onClick={() => onSelect?.(d.key)} tabIndex={onSelect ? 0 : undefined} onKeyDown={(e) => e.key === 'Enter' && onSelect?.(d.key)} role={onSelect ? 'button' : undefined} aria-label={`${d.label}: ${prefix}${d.value}`}>
            <rect x={L + i * bw} y={T} width={bw} height={H - T - B} fill="transparent" />
            <rect x={x} y={H - B - h} width={w} height={h} rx="2" fill={color} opacity={selected && !on ? 0.4 : 1} />
            {d.value > 0 && bw > 34 && <text x={x + w / 2} y={H - B - h - 4} textAnchor="middle" className="val">{prefix}{short(d.value)}</text>}
            <text x={x + w / 2} y={H - 8} textAnchor="middle" className={`axis ${on ? 'sel' : ''}`}>{d.label}</text>
            <title>{d.label}: {prefix}{d.value}</title>
          </g>
        );
      })}
    </svg>
  );
};

export const LineChart = ({ data, height = 170, prefix = '', suffix = '', color = 'var(--ops-info)' }) => {
  const W = 560, H = height, L = 38, B = 24, T = 12, R = 10;
  const vals = data.map((d) => d.value).filter((v) => v !== null && v !== undefined);
  const max = niceMax(Math.max(0, ...vals));
  const step = (W - L - R) / Math.max(1, data.length - 1);
  const x = (i) => L + (data.length === 1 ? (W - L - R) / 2 : i * step), y = (v) => T + (H - T - B) * (1 - v / max);
  const pts = data.map((d, i) => (d.value === null || d.value === undefined ? null : [x(i), y(d.value), d]));
  const segs = [];
  let cur = [];
  for (const p of pts) { if (p) cur.push(p); else if (cur.length) { segs.push(cur); cur = []; } }
  if (cur.length) segs.push(cur);
  return (
    <svg className="ops-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Line chart" preserveAspectRatio="none">
      {[0, 0.5, 1].map((f) => <g key={f}><line x1={L} x2={W - R} y1={y(max * f)} y2={y(max * f)} className="grid" /><text x={L - 6} y={y(max * f) + 3} textAnchor="end" className="axis">{prefix}{short(max * f)}{suffix}</text></g>)}
      {segs.map((seg, i) => <path key={i} d={seg.map((p, j) => `${j ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />)}
      {pts.map((p, i) => p && <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={color}><title>{p[2].label}: {prefix}{p[2].value}{suffix}</title></circle>)}
      {data.map((d, i) => (data.length <= 12 || i % Math.ceil(data.length / 10) === 0) && <text key={i} x={x(i)} y={H - 8} textAnchor="middle" className="axis">{d.label}</text>)}
    </svg>
  );
};

export const Donut = ({ parts, size = 150, center }) => {
  const total = parts.reduce((s, p) => s + p.value, 0);
  const r = 52, c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="ops-donut">
      <svg viewBox="0 0 140 140" width={size} height={size} role="img" aria-label="Distribution chart">
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--ops-line)" strokeWidth="16" />
        {total > 0 && parts.map((p) => { const len = (p.value / total) * c; const el = <circle key={p.label} cx="70" cy="70" r={r} fill="none" stroke={p.color} strokeWidth="16" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-acc} transform="rotate(-90 70 70)"><title>{p.label}: {p.value}</title></circle>; acc += len; return el; })}
        {center && <text x="70" y="75" textAnchor="middle" className="donut-center">{center}</text>}
      </svg>
      <ul>{parts.map((p) => <li key={p.label}><i style={{ background: p.color }} />{p.label}<strong>{total ? `${Math.round((p.value / total) * 100)}%` : '—'}</strong><small>{p.value}</small></li>)}</ul>
    </div>
  );
};

export const HBars = ({ rows, format = (v) => v, color = 'var(--ops-brand)' }) => {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return <ul className="ops-hbars">{rows.map((r) => <li key={r.name}><span className="name" title={r.name}>{r.name}</span><span className="bar"><i style={{ width: `${(r.value / max) * 100}%`, background: color }} /></span><strong>{format(r.value)}</strong></li>)}</ul>;
};
