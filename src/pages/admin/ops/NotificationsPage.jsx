import React from 'react';
import { AlertTriangle, Bell } from 'lucide-react';
import { api } from '../../../api/client';
import { Card, Empty, ErrorBox, SkeletonBlock, usePoll, useOps, ago } from './ui';

const NotificationsPage = () => {
  const ops = useOps();
  const { data, error, reload } = usePoll('/admin/notifications', 8000);
  const act = (n) => { if (n.orderId) ops.openOrder(n.orderId); };
  return (
    <div className="ops-page">
      <div className="ops-toolbar"><h1>Notifications</h1><button type="button" className="ops-btn" disabled={!data?.unread} onClick={async () => { await api('/admin/notifications/read', { method: 'POST' }); reload(); ops.refresh(); }}>Mark all as read</button></div>
      {error && !data && <ErrorBox message={error} onRetry={reload} />}{!data && !error && <SkeletonBlock rows={8} />}
      {data && <Card pad={false}>{data.items.length === 0 ? <div className="ops-card-body"><Empty title="Nothing in the last 48 hours" hint="New orders, payment problems, delays and refund requests show up here." /></div> : (
        <ul className="ops-notes">{data.items.map((n) => <li key={n.id} className={`${n.severity} ${n.unread ? 'unread' : ''}`}><button type="button" onClick={() => act(n)} disabled={!n.orderId}>{n.severity === 'warn' ? <AlertTriangle size={16} /> : <Bell size={16} />}<span>{n.text}</span><small>{ago(n.at)}</small></button></li>)}</ul>)}</Card>}
    </div>
  );
};
export default NotificationsPage;
