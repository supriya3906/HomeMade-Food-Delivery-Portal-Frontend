import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { X, AlertTriangle, Inbox } from 'lucide-react';
import { api } from '../../../api/client';

// ---- formatting ---------------------------------------------------------------
export const money = (n) => (n === null || n === undefined ? '—' : `₹${Math.round(n).toLocaleString('en-IN')}`);
export const num = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('en-IN'));
export const pctText = (n) => (n === null || n === undefined ? '—' : `${n > 0 ? '+' : ''}${n}%`);
export const clock = (iso) => (iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—');
export const dateTime = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
export const dayText = (key) => new Date(`${key}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
export const ago = (iso, now = Date.now()) => {
  if (!iso) return '—';
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
};

// ---- polling: fetches, then refreshes quietly (no skeleton flash, no page reload) ----
export const usePoll = (path, ms = 0) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const alive = useRef(true);
  const load = useCallback(async () => {
    if (!path) { setData(null); setLoading(false); return; }
    try { const d = await api(path); if (alive.current) { setData(d); setError(''); } } catch (e) { if (alive.current) setError(e.message); } finally { if (alive.current) setLoading(false); }
  }, [path]);
  useEffect(() => {
    alive.current = true;
    setLoading(true);
    load();
    if (!ms) return () => { alive.current = false; };
    const id = setInterval(() => { if (!document.hidden) load(); }, ms);
    return () => { alive.current = false; clearInterval(id); };
  }, [load, ms]);
  return { data, error, loading, reload: load };
};

// ---- shell context: drawers, navigation, toasts ----------------------------------
export const OpsContext = createContext(null);
export const useOps = () => useContext(OpsContext);

// ---- small components ----------------------------------------------------------
const TONE = {
  NEW: 'info', PREPARING: 'warn', READY_FOR_PICKUP: 'violet', OUT_FOR_DELIVERY: 'brand', DELIVERED: 'ok', CANCELLED: 'bad',
  INITIATED: 'neutral', PROCESSING: 'warn', SUCCESS: 'ok', FAILED: 'bad', REFUND_INITIATED: 'warn', REFUNDED: 'neutral',
  available: 'ok', on_delivery: 'warn', offline: 'bad', active: 'ok', inactive: 'neutral'
};
const LABEL = { NEW: 'New', PREPARING: 'Preparing', READY_FOR_PICKUP: 'Ready for pickup', OUT_FOR_DELIVERY: 'Out for delivery', DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
  INITIATED: 'Initiated', PROCESSING: 'Processing', SUCCESS: 'Success', FAILED: 'Failed', REFUND_INITIATED: 'Refund initiated', REFUNDED: 'Refunded',
  available: 'Available', on_delivery: 'On delivery', offline: 'Offline', active: 'Active', inactive: 'Inactive' };
export const Badge = ({ value, tone, children }) => <span className={`ops-badge ${tone || TONE[value] || 'neutral'}`}>{children || LABEL[value] || value}</span>;

export const PAY_LABEL = { paid: 'Paid', pay_on_delivery: 'Pay on delivery', refund_initiated: 'Refund initiated', refunded: 'Refunded', cancelled: 'Cancelled' };
export const PayBadge = ({ status }) => <Badge tone={{ paid: 'ok', pay_on_delivery: 'neutral', refund_initiated: 'warn', refunded: 'neutral', cancelled: 'bad' }[status] || 'neutral'}>{PAY_LABEL[status] || status}</Badge>;

export const Skeleton = ({ h = 16, w = '100%', style }) => <span className="ops-skel" style={{ height: h, width: w, ...style }} aria-hidden="true" />;
export const SkeletonBlock = ({ rows = 4 }) => <div className="ops-skel-block" aria-busy="true" aria-label="Loading">{Array.from({ length: rows }, (_, i) => <Skeleton key={i} h={14} w={`${92 - i * 9}%`} />)}</div>;

export const Empty = ({ title, hint, children }) => (
  <div className="ops-empty"><Inbox size={22} aria-hidden="true" /><strong>{title}</strong>{hint && <p>{hint}</p>}{children}</div>
);
export const ErrorBox = ({ message, onRetry }) => (
  <div className="ops-error" role="alert"><AlertTriangle size={18} /><div><strong>Could not load this data</strong><p>{message}</p></div>{onRetry && <button type="button" className="ops-btn" onClick={onRetry}>Try again</button>}</div>
);

export const Card = ({ title, action, children, className = '', pad = true }) => (
  <section className={`ops-card ${className}`}>
    {(title || action) && <header className="ops-card-head"><h3>{title}</h3>{action}</header>}
    <div className={pad ? 'ops-card-body' : ''}>{children}</div>
  </section>
);

export const Segmented = ({ options, value, onChange, label }) => (
  <div className="ops-seg" role="group" aria-label={label}>
    {options.map(([v, text]) => <button key={v} type="button" aria-pressed={value === v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>{text}</button>)}
  </div>
);

export const Drawer = ({ title, subtitle, onClose, children, wide, footer }) => {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="ops-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className={`ops-drawer ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="ops-drawer-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button type="button" className="ops-icon" onClick={onClose} aria-label="Close"><X size={18} /></button></header>
        <div className="ops-drawer-body">{children}</div>
        {footer && <footer className="ops-drawer-foot">{footer}</footer>}
      </aside>
    </div>
  );
};

export const ConfirmDialog = ({ title, message, confirmLabel = 'Confirm', danger, onConfirm, onCancel }) => (
  <div className="ops-backdrop center" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
    <div className="ops-dialog" role="alertdialog" aria-modal="true" aria-label={title}>
      <h3>{title}</h3><p>{message}</p>
      <div className="ops-dialog-actions"><button type="button" className="ops-btn" onClick={onCancel}>Keep as is</button><button type="button" className={`ops-btn ${danger ? 'danger' : 'primary'}`} onClick={onConfirm}>{confirmLabel}</button></div>
    </div>
  </div>
);

export const Toasts = ({ items, dismiss }) => (
  <div className="ops-toasts" aria-live="polite">{items.map((t) => <div key={t.id} className={`ops-toast ${t.tone}`}><span>{t.text}</span><button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss"><X size={14} /></button></div>)}</div>
);

export const KV = ({ rows }) => <dl className="ops-kv">{rows.filter(Boolean).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v ?? '—'}</dd></div>)}</dl>;
export const Table = ({ children, className = '' }) => <div className="ops-table-wrap"><table className={`ops-table ${className}`}>{children}</table></div>;
