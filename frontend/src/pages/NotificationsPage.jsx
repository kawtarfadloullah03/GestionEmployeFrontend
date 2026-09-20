import React, { useState, useEffect } from 'react';
import { API_URL, useAuth } from '../context/AuthContext';
import { Bell, Check, CheckCircle, AlertTriangle, Info } from 'lucide-react';

const TYPE_CONFIG = {
  ACTION_REQUIRED: { icon: AlertTriangle, color: 'var(--warning)', bg: 'var(--warning-bg)', label: 'Action requise' },
  SUCCESS: { icon: CheckCircle, color: 'var(--success)', bg: 'var(--success-bg)', label: 'Succès' },
  WARNING: { icon: AlertTriangle, color: 'var(--danger)', bg: 'var(--danger-bg)', label: 'Attention' },
  INFO: { icon: Info, color: 'var(--info)', bg: 'var(--info-bg)', label: 'Information' },
};

export const NotificationsPage = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`${API_URL}/notifications?user_id=${currentUser.id}`);
      if (res.ok) setNotifications(await res.json());
    } catch {}
  };

  useEffect(() => { fetchNotifications(); }, [currentUser]);

  const markAllRead = async () => {
    if (!currentUser?.id) return;
    try {
      await fetch(`${API_URL}/notifications/read-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id })
      });
      fetchNotifications();
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={22} style={{ color: 'var(--primary)' }} /> Notifications
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 3 }}>
            {unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Tout est lu'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-outline btn-sm" onClick={markAllRead}>
            <Check size={14} /> Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {notifications.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Bell size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
            <div style={{ fontSize: '0.9rem' }}>Aucune notification</div>
          </div>
        ) : notifications.map((n) => {
          const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.INFO;
          const Icon = cfg.icon;
          return (
            <div key={n.id} className="card" style={{
              padding: '1rem 1.25rem',
              display: 'flex', alignItems: 'flex-start', gap: 12,
              borderLeft: `3px solid ${n.read ? 'var(--border)' : cfg.color}`,
              opacity: n.read ? 0.7 : 1,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <Icon size={16} style={{ color: cfg.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{n.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 3 }}>{n.message}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  {new Date(n.created_at).toLocaleString('fr-FR')}
                </div>
              </div>
              {!n.read && (
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: cfg.color, flexShrink: 0, marginTop: 6
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
