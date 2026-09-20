import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Search, QrCode, LogOut, ChevronDown, X, Settings } from 'lucide-react';

const ROLE_LABELS = {
  EMPLOYEE: { label: 'Salarié', color: '#1D4ED8', bg: '#DBEAFE' },
  MANAGER: { label: 'Manager', color: '#15803D', bg: '#DCFCE7' },
  HR: { label: 'RH / Admin', color: '#6D28D9', bg: '#EDE9FE' },
};

export const Navbar = () => {
  const { currentRole, currentUser, currentEmployee, notifications, setIsKioskOpen, logout } = useAuth();
  const [showNotif, setShowNotif] = useState(false);
  const role = ROLE_LABELS[currentRole] || ROLE_LABELS.EMPLOYEE;
  const unread = (notifications || []).filter(n => !n.read).length;

  return (
    <header className="navbar">
      {/* Left: Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="input-with-icon" style={{ width: 280 }}>
          <Search className="input-icon" size={15} />
          <input
            type="text"
            className="input"
            style={{ paddingLeft: 36, height: 36, fontSize: '0.82rem', background: 'var(--bg-app)' }}
            placeholder="Rechercher un employé, une demande..."
          />
        </div>

        <button
          onClick={() => setIsKioskOpen(true)}
          className="btn btn-outline btn-sm"
          style={{ gap: 6, height: 36 }}
        >
          <QrCode size={14} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.78rem' }}>Borne QR</span>
        </button>
      </div>

      {/* Right: Notifications, Role badge, User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Role Badge */}
        <div style={{
          padding: '4px 12px',
          borderRadius: 999,
          background: role.bg,
          color: role.color,
          fontSize: '0.75rem',
          fontWeight: 700,
        }}>
          {role.label}
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn-icon"
            onClick={() => setShowNotif(!showNotif)}
            style={{ position: 'relative' }}
          >
            <Bell size={17} />
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                width: 17, height: 17,
                background: '#EF4444', color: 'white',
                fontSize: '0.65rem', fontWeight: 700,
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid white'
              }}>{unread}</span>
            )}
          </button>

          {showNotif && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              width: 340, background: 'white',
              border: '1px solid var(--border)', borderRadius: 12,
              boxShadow: 'var(--shadow-lg)', zIndex: 100,
            }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Notifications</span>
                <button onClick={() => setShowNotif(false)} className="btn-icon" style={{ border: 'none', padding: 4 }}>
                  <X size={14} />
                </button>
              </div>
              <div style={{ maxHeight: 280, overflowY: 'auto', padding: '8px' }}>
                {(notifications || []).length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    Aucune notification
                  </div>
                ) : (
                  notifications.map((n, i) => (
                    <div key={i} style={{
                      padding: '10px 12px', borderRadius: 8,
                      background: !n.read ? '#F0FDF4' : 'white',
                      marginBottom: 4,
                      borderLeft: !n.read ? '3px solid var(--primary)' : '3px solid transparent',
                    }}>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: 3 }}>{n.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{n.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 12, borderLeft: '1px solid var(--border)' }}>
          {currentUser?.avatar ? (
            <img src={currentUser.avatar} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'var(--primary)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.8rem'
            }}>
              {(currentUser?.first_name?.[0] || '?')}{(currentUser?.last_name?.[0] || '')}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
              {currentUser?.first_name} {currentUser?.last_name}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              {currentEmployee?.position || '—'}
            </span>
          </div>
          <button
            onClick={logout}
            className="btn-icon"
            title="Se déconnecter"
            style={{ marginLeft: 4, color: 'var(--danger-text)', borderColor: 'var(--danger-bg)', background: 'var(--danger-bg)' }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
};
