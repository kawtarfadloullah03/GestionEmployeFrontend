import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Clock, CalendarDays,
  Palmtree, BarChart3, Settings, ShieldCheck,
  Building2, Bell
} from 'lucide-react';

const NAV_SECTIONS = {
  EMPLOYEE: [
    {
      label: 'Mon espace',
      items: [
        { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
        { id: 'my-attendance', label: 'Mes présences', icon: Clock },
        { id: 'my-leaves', label: 'Mes congés', icon: Palmtree },
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
  EMPLOYEE: { bg: '#DBEAFE', text: '#1D4ED8', label: 'Salarié' },
  MANAGER: { bg: '#DCFCE7', text: '#15803D', label: 'Manager' },
  HR: { bg: '#EDE9FE', text: '#6D28D9', label: 'RH / Admin' },
};

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { currentRole, currentUser } = useAuth();
  const sections = NAV_SECTIONS[currentRole] || NAV_SECTIONS.EMPLOYEE;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <div>
          <div style={{ color: 'white', fontWeight: 800, fontSize: '1rem', lineHeight: 1 }}>WorkFlow HR</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.62rem', marginTop: 2, letterSpacing: '0.06em' }}>ENTERPRISE</div>
        </div>
      </div>

      {/* User pill */}
      <div style={{ padding: '12px 12px 4px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          {currentUser?.avatar ? (
            <img src={currentUser.avatar} alt="" className="avatar avatar-sm" />
          ) : (
            <div className="avatar-initials avatar-initials-sm" style={{ background: 'var(--primary)', color: 'white' }}>
              {getInitials(currentUser?.first_name, currentUser?.last_name)}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ color: 'white', fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser?.first_name} {currentUser?.last_name}
            </div>
            <div style={{
              fontSize: '0.68rem', fontWeight: 600, marginTop: 2,
              color: ROLE_COLORS[currentRole]?.text,
              background: ROLE_COLORS[currentRole]?.bg,
              padding: '1px 7px', borderRadius: 999, display: 'inline-block'
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
              return (
                <button
                  key={item.id}
                  className={`sidebar-item${isActive ? ' active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon size={16} style={{ flexShrink: 0 }} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, display: 'inline-block' }} />
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>MongoDB Atlas — GestionEmploye</span>
        </div>
      </div>
    </aside>
  );
};
