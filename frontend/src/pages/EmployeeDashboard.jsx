import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { AttendanceWidget } from '../components/AttendanceWidget';
import { LeaveModal } from '../components/LeaveModal';
import {
  CalendarDays, Send, ChevronRight, CheckCircle2, XCircle, Clock, Umbrella
} from 'lucide-react';

const StatusBadge = ({ status }) => {
  const map = {
    VALIDATED: { label: 'Validé', cls: 'badge-success' },
    ABSENT: { label: 'Absent', cls: 'badge-danger' },
    IN_PROGRESS: { label: 'En cours', cls: 'badge-info' },
    APPROVED: { label: 'Approuvé', cls: 'badge-success' },
    REJECTED: { label: 'Refusé', cls: 'badge-danger' },
    PENDING: { label: 'En attente', cls: 'badge-warning' },
  };
  const m = map[status] || { label: status, cls: 'badge-muted' };
  return <span className={`badge ${m.cls}`}>{m.label}</span>;
};

const CardIcon = ({ color, bg, children }) => (
  <span style={{
    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
    background: bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  }}>
    {children}
  </span>
);

export const EmployeeDashboard = () => {
  const { currentEmployee, refreshEmployeeData } = useAuth();
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [myLeaveRequests, setMyLeaveRequests] = useState([
    { id: 'req_01', leave_type: 'Congé Payé', start_date: '2026-10-12', end_date: '2026-10-16', days: 5, status: 'APPROVED' },
    { id: 'req_02', leave_type: 'RTT', start_date: '2026-10-30', end_date: '2026-10-30', days: 1, status: 'PENDING' }
  ]);

  const fetchMyLeaves = async () => {
    if (!currentEmployee?.id) return;
    try {
      const res = await fetch(`${API_URL}/leaves?employee_id=${currentEmployee.id}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setMyLeaveRequests(data);
        }
      }
    } catch (e) { console.warn(e); }
  };

  useEffect(() => { fetchMyLeaves(); }, [currentEmployee]);

  const weeklyHistory = [
    { day: 'Lun', date: '15/09', hours: '8h02', status: 'VALIDATED' },
    { day: 'Mar', date: '16/09', hours: '7h54', status: 'VALIDATED' },
    { day: 'Mer', date: '17/09', hours: 'Absent', status: 'ABSENT' },
    { day: 'Jeu', date: '18/09', hours: '8h10', status: 'VALIDATED' },
    { day: 'Ven', date: '19/09', hours: 'En cours', status: 'IN_PROGRESS' },
  ];

  const dayColors = {
    VALIDATED: { bg: '#F0FDF4', border: '#86EFAC', text: '#15803D', icon: <CheckCircle2 size={15} color="#22C55E" /> },
    ABSENT: { bg: '#FEF2F2', border: '#FCA5A5', text: '#B91C1C', icon: <XCircle size={15} color="#EF4444" /> },
    IN_PROGRESS: { bg: '#EFF6FF', border: '#93C5FD', text: '#1D4ED8', icon: <Clock size={15} color="#3B82F6" /> },
  };

  const used = currentEmployee?.used_leave || 0;
  const allocated = currentEmployee?.allocated_leave || 25;
  const balance = currentEmployee?.leave_balance || 0;
  const pct = Math.min(100, Math.round((used / allocated) * 100));

  // Gauge (semicircle)
  const gaugePct = Math.max(0, Math.min(1, balance / Math.max(allocated, 1)));
  const GR = 72, GCX = 90, GCY = 88;
  const arcLen = Math.PI * GR;
  const gt = gaugePct * Math.PI;
  const dotX = GCX - GR * Math.cos(gt);
  const dotY = GCY - GR * Math.sin(gt);

  const weekNumber = 38;

  const leaveIconStyle = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('maladie')) return { bg: '#EFF6FF', color: '#3B82F6' };
    return { bg: '#DCFCE7', color: '#16A34A' };
  };

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Bonjour, {currentEmployee?.first_name || 'Ahmed'} 👋
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            {currentEmployee?.position || 'Software Engineer'} · {currentEmployee?.department_name || 'IT & Engineering'}
          </p>
        </div>
        <button
          className="btn btn-primary"
          style={{ padding: '12px 22px', fontSize: '0.875rem', borderRadius: 12 }}
          onClick={() => setIsLeaveModalOpen(true)}
        >
          <CalendarDays size={16} /> Demande de congé
        </button>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.25rem', alignItems: 'start' }}>
        {/* Attendance Clock Widget */}
        <AttendanceWidget />

        {/* Leave Balance Card */}
        <div className="card" style={{ padding: '1.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              <CardIcon bg="#EDE9FE"><Send size={16} color="#8B5CF6" /></CardIcon>
              Solde de congés
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Exercice 2026</span>
          </div>

          {/* Gauge */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', margin: '0.4rem 0 0.6rem' }}>
            <svg width="180" height="98" viewBox="0 0 180 98">
              <defs>
                <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22C55E" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
              <path d={`M ${GCX - GR} ${GCY} A ${GR} ${GR} 0 0 1 ${GCX + GR} ${GCY}`}
                fill="none" stroke="#E5E7EB" strokeWidth="13" strokeLinecap="round" />
              <path d={`M ${GCX - GR} ${GCY} A ${GR} ${GR} 0 0 1 ${GCX + GR} ${GCY}`}
                fill="none" stroke="url(#gaugeGrad)" strokeWidth="13" strokeLinecap="round"
                strokeDasharray={arcLen} strokeDashoffset={arcLen * (1 - gaugePct)} />
              <circle cx={dotX} cy={dotY} r="7" fill="#22C55E" stroke="#fff" strokeWidth="3" />
            </svg>
            <div style={{ position: 'absolute', top: 26, left: 0, right: 0, textAlign: 'center' }}>
              <div style={{ fontSize: '2.3rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{balance}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                jours restants sur {allocated}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Utilisés</span>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>{used} jours ({pct}%)</span>
            </div>
            <div className="progress-bar" style={{ height: 9 }}>
              <div className="progress-fill" style={{ width: `${pct}%`, background: 'linear-gradient(135deg,#22C55E,#10B981)' }} />
            </div>
          </div>

          {/* Mini stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Congés pris', value: `${used} j`, icon: <CalendarDays size={15} color="#3B82F6" />, bg: '#EFF6FF' },
              { label: 'RTT disponibles', value: '4 j', icon: <Clock size={15} color="#8B5CF6" />, bg: '#F5F3FF' },
            ].map((s) => (
              <div key={s.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 12px', background: '#F8FAFC', borderRadius: 10, border: '1px solid var(--border-light)',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  <CardIcon bg={s.bg}>{s.icon}</CardIcon>
                  {s.label}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#3B82F6' }}>{s.value}</span>
              </div>
            ))}
          </div>

          <button
            className="btn btn-outline"
            style={{ width: '100%', marginTop: '0.9rem', fontSize: '0.82rem', padding: '11px 16px', borderRadius: 10, justifyContent: 'center' }}
            onClick={() => setIsLeaveModalOpen(true)}
          >
            <Send size={14} /> Poser des congés
          </button>
        </div>
      </div>

      {/* Second Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* Weekly attendance */}
        <div className="card" style={{ padding: '1.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              <CardIcon bg="#DCFCE7"><CalendarDays size={16} color="#16A34A" /></CardIcon>
              Cette semaine
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Semaine {weekNumber} <ChevronRight size={15} />
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {weeklyHistory.map((item) => {
              const c = dayColors[item.status] || dayColors.VALIDATED;
              return (
                <div key={item.day} style={{
                  padding: '11px 12px', borderRadius: 12,
                  background: c.bg, border: `1px solid ${c.border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.day}</span>
                    {c.icon}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 6 }}>{item.date}</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: c.text }}>{item.hours}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leave requests */}
        <div className="card" style={{ padding: '1.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              <CardIcon bg="#DBEAFE"><CalendarDays size={16} color="#2563EB" /></CardIcon>
              Mes demandes de congés
            </span>
            <span style={{
              width: 26, height: 26, borderRadius: '50%',
              background: '#EFF6FF', color: '#3B82F6',
              fontSize: '0.75rem', fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid #BFDBFE',
            }}>{myLeaveRequests.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
            {myLeaveRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Aucune demande enregistrée
              </div>
            ) : (
              myLeaveRequests.map((req) => {
                const ic = leaveIconStyle(req.leave_type);
                return (
                  <div key={req.id} style={{
                    display: 'flex', alignItems: 'center', gap: 11,
                    padding: '10px 12px', background: '#F8FAFC', borderRadius: 12,
                    border: '1px solid var(--border-light)',
                  }}>
                    <span style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: ic.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Umbrella size={17} color={ic.color} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{req.leave_type}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                        {req.start_date} → {req.end_date} · {req.days} j
                      </div>
                    </div>
                    <StatusBadge status={req.status} />
                    <ChevronRight size={16} color="#94A3B8" style={{ flexShrink: 0 }} />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <LeaveModal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} onSuccess={() => { fetchMyLeaves(); refreshEmployeeData(); }} />
    </div>
  );
};
