import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Clock, CalendarDays,
  Palmtree, BarChart3, Settings, ShieldCheck,
  Building2, Bell, Zap, Home, Umbrella, Workflow
} from 'lucide-react';

const NAV_SECTIONS = {
  EMPLOYEE: [
    {
      label: 'Mon espace',
      items: [
        { id: 'dashboard', label: 'Tableau de bord', icon: Home },
        { id: 'my-attendance', label: 'Mes présences', icon: Clock },
        { id: 'my-leaves', label: 'Mes congés', icon: Umbrella },
        { id: 'calendar', label: 'Calendrier', icon: CalendarDays },
        { id: 'notifications', label: 'Notifications', icon: Bell },
      ]
    }
  ],
  MANAGER: [
    {
      label: 'Analyser',
      items: [
        { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
        { id: 'attendance', label: 'Présence & Équipe', icon: Clock },
        { id: 'leaves', label: 'Gestion des Congés', icon: Palmtree },
        { id: 'calendar', label: 'Calendrier', icon: CalendarDays },
      ]
    },
    {
      label: 'Gérer',
      items: [
        { id: 'employees', label: 'Mes employés', icon: Users },
        { id: 'departments', label: 'Départements', icon: Building2 },
        { id: 'notifications', label: 'Notifications', icon: Bell },
      ]
    }
  ],
  HR: [
    {
      label: 'Analyser',
      items: [
        { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
        { id: 'attendance', label: 'Présence & Pointage', icon: Clock },
        { id: 'leaves', label: 'Gestion des Congés', icon: Palmtree },
        { id: 'calendar', label: 'Calendrier', icon: CalendarDays },
        { id: 'reports', label: 'Rapports & Stats', icon: BarChart3 },
        { id: 'agentic', label: 'Assistant agentique', icon: Workflow },
      ]
    },
    {
      label: 'Gérer',
      items: [
        { id: 'employees', label: 'Employés', icon: Users },
        { id: 'departments', label: 'Départements', icon: Building2 },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'settings', label: 'Configuration RH', icon: Settings },
        { id: 'audit', label: "Logs d'Audit", icon: ShieldCheck },
      ]
    }
  ]
};

function getInitials(firstName, lastName) {
  return `${(firstName || '?')[0]}${(lastName || '?')[0]}`.toUpperCase();
}

const ROLE_COLORS = {
  EMPLOYEE: { bg: 'rgba(59,130,246,0.15)', text: '#60A5FA', label: 'Salarié', border: 'rgba(59,130,246,0.2)' },
  MANAGER: { bg: 'rgba(34,197,94,0.15)', text: '#4ADE80', label: 'Manager', border: 'rgba(34,197,94,0.2)' },
  HR: { bg: 'rgba(139,92,246,0.15)', text: '#A78BFA', label: 'RH / Admin', border: 'rgba(139,92,246,0.2)' },
};

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { currentRole, currentUser, notifications } = useAuth();
  const sections = NAV_SECTIONS[currentRole] || NAV_SECTIONS.EMPLOYEE;
  const unread = (notifications || []).filter(n => !n.read).length;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #22C55E 0%, #10B981 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          boxShadow: '0 4px 12px rgba(34,197,94,0.3)'
        }}>
          <Zap size={18} color="white" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ color: 'white', fontWeight: 800, fontSize: '1.05rem', lineHeight: 1, letterSpacing: '-0.02em' }}>WorkFlow HR</div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.6rem', marginTop: 3, letterSpacing: '0.12em', fontWeight: 600 }}>ENTERPRISE</div>
        </div>
      </div>

      {/* User pill */}
      <div style={{ padding: '14px 12px 6px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '11px 12px',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.06)',
          transition: 'all 0.2s ease',
        }}>
          {currentUser?.avatar ? (
            <img src={currentUser.avatar} alt="" className="avatar avatar-sm" style={{ border: '2px solid rgba(255,255,255,0.15)' }} />
          ) : (
            <div className="avatar-initials avatar-initials-sm" style={{ background: 'linear-gradient(135deg, #22C55E, #10B981)', color: 'white' }}>
              {getInitials(currentUser?.first_name, currentUser?.last_name)}
            </div>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ color: 'white', fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser?.first_name} {currentUser?.last_name}
            </div>
            <div style={{
              fontSize: '0.65rem', fontWeight: 600, marginTop: 3,
              color: ROLE_COLORS[currentRole]?.text,
              background: ROLE_COLORS[currentRole]?.bg,
              border: `1px solid ${ROLE_COLORS[currentRole]?.border || 'transparent'}`,
              padding: '2px 8px', borderRadius: 999, display: 'inline-block',
              letterSpacing: '0.02em'
            }}>
              {ROLE_COLORS[currentRole]?.label}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {sections.map((section) => (
          <div key={section.label}>
            <div className="sidebar-section-label">{section.label}</div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const hasNotifBadge = item.id === 'notifications' && unread > 0;
              return (
                <button
                  key={item.id}
                  className={`sidebar-item${isActive ? ' active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon size={17} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {hasNotifBadge && (
                    <span style={{
                      minWidth: 18, height: 18,
                      background: '#EF4444', color: 'white',
                      fontSize: '0.62rem', fontWeight: 700,
                      borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(239,68,68,0.4)',
                      animation: 'pulse 2s ease infinite'
                    }}>{unread}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--primary)', flexShrink: 0, display: 'inline-block',
            boxShadow: '0 0 8px rgba(34,197,94,0.5)',
            animation: 'pulse 2s ease infinite'
          }} />
          <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>Données servies par l’API RH</span>
        </div>
        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', marginTop: 6, letterSpacing: '0.02em' }}>
          v2.0 · WorkFlow Entreprise
        </div>
      </div>
    </aside>
  );
};
