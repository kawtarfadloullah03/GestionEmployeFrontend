import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Search, QrCode, LogOut, X, Users, ChevronDown } from 'lucide-react';

const ROLE_LABELS = {
  EMPLOYEE: { label: 'Salarié', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
  MANAGER: { label: 'Manager', color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' },
  HR: { label: 'RH / Admin', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)' },
};

export const Navbar = () => {
  const { currentRole, currentUser, currentEmployee, notifications, setIsKioskOpen, logout } = useAuth();
  const [showNotif, setShowNotif] = useState(false);
  const role = ROLE_LABELS[currentRole] || ROLE_LABELS.EMPLOYEE;
  const unread = (notifications || []).filter(n => !n.read).length;

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Bonjour' : now.getHours() < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <header className="navbar">
      {/* Left: Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div className="input-with-icon" style={{ width: 300 }}>
          <Search className="input-icon" size={15} />
          <input
            type="text"
            className="input"
            style={{ paddingLeft: 38, height: 38, fontSize: '0.82rem', background: 'var(--bg-app)', borderColor: 'transparent' }}
            placeholder="Rechercher un employé, une demande..."
          />
        </div>

        <button
          onClick={() => setIsKioskOpen(true)}
          className="btn btn-outline btn-sm"
          style={{ gap: 6, height: 38, borderRadius: 10 }}
        >
          <QrCode size={14} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.78rem' }}>Borne QR</span>
          <span style={{
            width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)',
            boxShadow: '0 0 6px rgba(34,197,94,0.6)',
          }} />
        </button>
      </div>

      {/* Right: Notifications, Role badge, User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Logged-in User Role Badge */}
        <div style={{
          padding: '6px 14px',
          borderRadius: 999,
          background: role.bg,
          color: role.color,
          border: `1px solid ${role.border}`,
          fontSize: '0.76rem',
          fontWeight: 700,
          letterSpacing: '0.02em',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <Users size={13} />
          <span>{role.label}</span>
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn-icon"
            onClick={() => setShowNotif(!showNotif)}
            style={{ position: 'relative', borderRadius: 10 }}
          >
            <Bell size={17} />
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: -5, right: -5,
                width: 18, height: 18,
                background: 'linear-gradient(135deg, #EF4444, #DC2626)', color: 'white',
                fontSize: '0.62rem', fontWeight: 700,
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid white',
                boxShadow: '0 2px 6px rgba(239,68,68,0.4)'
              }}>{unread}</span>
            )}
          </button>

          {showNotif && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowNotif(false)} />
              <div className="notif-dropdown">
                <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifications</span>
                    {unread > 0 && (
                      <span style={{
                        marginLeft: 8, fontSize: '0.68rem', fontWeight: 600,
                        background: 'var(--danger-bg)', color: 'var(--danger-text)',
                        padding: '2px 7px', borderRadius: 999
                      }}>{unread} new</span>
                    )}
                  </div>
                  <button onClick={() => setShowNotif(false)} className="btn-icon" style={{ border: 'none', padding: 4 }}>
                    <X size={14} />
                  </button>
                </div>
                <div style={{ maxHeight: 320, overflowY: 'auto', padding: '8px' }}>
                  {(notifications || []).length === 0 ? (
                    <div className="empty-state" style={{ padding: '2rem' }}>
                      <div className="empty-state-icon" style={{ width: 44, height: 44 }}>
                        <Bell size={20} style={{ color: 'var(--text-muted)' }} />
                      </div>
                      <div style={{ fontSize: '0.82rem' }}>Aucune notification</div>
                    </div>
                  ) : (
                    notifications.map((n, i) => (
                      <div key={i} style={{
                        padding: '12px 14px', borderRadius: 10,
                        background: !n.read ? '#F0FDF4' : 'white',
                        marginBottom: 4,
                        borderLeft: !n.read ? '3px solid var(--primary)' : '3px solid transparent',
                        transition: 'all 0.15s ease',
                        cursor: 'pointer',
                      }}>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: 4 }}>{n.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{n.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 28, background: 'var(--border)' }} />

        {/* User avatar + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {currentUser?.avatar ? (
            <img src={currentUser.avatar} alt="" style={{
              width: 36, height: 36, borderRadius: '50%', objectFit: 'cover',
              border: '2px solid var(--border)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }} />
          ) : (
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #22C55E, #10B981)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.82rem',
              boxShadow: '0 2px 8px rgba(34,197,94,0.25)'
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
          <ChevronDown size={15} color="#94A3B8" />
          <button
            onClick={logout}
            className="btn-icon"
            title="Se déconnecter"
            style={{
              marginLeft: 4,
              color: 'var(--danger-text)',
              borderColor: 'rgba(239,68,68,0.15)',
              background: 'var(--danger-bg)',
              borderRadius: 10,
            }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
};
