import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBell({ notifications, onClear }) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter(n => n.unread).length;

  const typeIcons = { status: '🔄', new: '✨', deleted: '🗑️', default: '🔔' };

  return (
    <div className="notif-bell" style={{ position: 'relative' }}>
      <button
        className="btn btn-ghost btn-icon"
        onClick={() => { setOpen(!open); if (!open) onClear(); }}
        title="Notifications"
      >
        🔔
        {unread > 0 && <span className="notif-dot" />}
      </button>

      {open && (
        <div className="notif-panel">
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13 }}>Notifications</span>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>{notifications.length} total</span>
          </div>
          {notifications.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No notifications yet</div>
          )}
          {notifications.slice(0, 10).map(n => (
            <div key={n.id} className={`notif-item ${n.unread ? 'unread' : ''}`}>
              <div className="notif-item-title">{typeIcons[n.type] || typeIcons.default} {n.title}</div>
              <div className="notif-item-time">{formatDistanceToNow(new Date(n.time), { addSuffix: true })}</div>
            </div>
          ))}
          {notifications.length > 10 && (
            <div style={{ padding: '8px 14px', textAlign: 'center', fontSize: 11, color: 'var(--text3)' }}>
              +{notifications.length - 10} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}
