import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { AttendanceWidget } from '../components/AttendanceWidget';
import { LeaveModal } from '../components/LeaveModal';
import { Clock, Calendar, Palmtree, Plus, ChevronRight, CheckCircle, AlertCircle, Loader } from 'lucide-react';

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

export const EmployeeDashboard = () => {
  const { currentEmployee, refreshEmployeeData } = useAuth();
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [myLeaveRequests, setMyLeaveRequests] = useState([]);

  const fetchMyLeaves = async () => {
    if (!currentEmployee?.id) return;
    try {
      const res = await fetch(`${API_URL}/leaves?employee_id=${currentEmployee.id}`);
      if (res.ok) setMyLeaveRequests(await res.json());
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
    VALIDATED: { bg: '#F0FDF4', border: '#86EFAC', text: '#15803D' },
    ABSENT: { bg: '#FEF2F2', border: '#FCA5A5', text: '#B91C1C' },
    IN_PROGRESS: { bg: '#EFF6FF', border: '#93C5FD', text: '#1D4ED8' },
  };

  const used = currentEmployee?.used_leave || 0;
  const allocated = currentEmployee?.allocated_leave || 25;
  const balance = currentEmployee?.leave_balance || 0;
  const pct = Math.round((used / allocated) * 100);

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Bonjour, {currentEmployee?.first_name} 👋
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 3 }}>
            {currentEmployee?.position} · {currentEmployee?.department_name}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsLeaveModalOpen(true)}>
          <Plus size={15} /> Demande de congé
        </button>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem' }}>
        {/* Attendance Clock Widget */}
        <div>
          <AttendanceWidget />
        </div>

        {/* Leave Balance Card */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Solde de congés</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Exercice 2026</span>
          </div>

          {/* Big number */}
          <div style={{ textAlign: 'center', padding: '1.25rem 0', borderRadius: 10, background: '#F0FDF4', marginBottom: '1rem' }}>
            <div style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
              {balance}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>jours restants sur {allocated}</div>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Utilisés</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{used} jours ({pct}%)</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${pct}%`, background: 'var(--primary)' }} />
            </div>
          </div>

          {/* Mini stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'Congés pris', value: `${used} j`, color: 'var(--danger-text)' },
              { label: 'RTT disponibles', value: '4 j', color: 'var(--success-text)' },
            ].map((s) => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: '#F8FAFC', borderRadius: 8 }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{s.label}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>

          <button
            className="btn btn-outline"
            style={{ width: '100%', marginTop: '1rem', fontSize: '0.8rem' }}
            onClick={() => setIsLeaveModalOpen(true)}
          >
            Poser des congés
          </button>
        </div>
      </div>

      {/* Second Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Weekly attendance */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Clock size={16} style={{ color: 'var(--primary)' }} /> Cette semaine
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Semaine 38</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {weeklyHistory.map((item) => {
              const c = dayColors[item.status] || dayColors.VALIDATED;
              return (
                <div key={item.day} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '10px 6px', borderRadius: 10,
                  background: c.bg, border: `1px solid ${c.border}`,
                }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{item.day}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{item.date}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: c.text, textAlign: 'center', lineHeight: 1.2 }}>{item.hours}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leave requests */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Calendar size={16} style={{ color: 'var(--warning)' }} /> Mes demandes de congés
            </span>
            <span className="badge badge-muted">{myLeaveRequests.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
            {myLeaveRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Aucune demande enregistrée
              </div>
            ) : (
              myLeaveRequests.map((req) => (
                <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{req.leave_type}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      {req.start_date} → {req.end_date} · {req.days} j
                    </div>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <LeaveModal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} onSuccess={() => { fetchMyLeaves(); refreshEmployeeData(); }} />
    </div>
  );
};
