import React, { useState, useEffect } from 'react';
import { API_URL, useAuth } from '../context/AuthContext';
import { AttendanceCorrectionModal } from '../components/AttendanceCorrectionModal';
import { Clock, Search, Edit3, UserCheck, AlertTriangle, Laptop, CalendarDays, ArrowUpRight } from 'lucide-react';

const FALLBACK_ATTENDANCE = [
  {
    employee_id: "EMP-00124",
    employee_name: "Ahmed Ben Ali",
    date: "2026-09-19",
    status: "PRESENT",
    sessions: [
      { check_in: "08:52", check_out: "12:30" },
      { check_in: "13:30", check_out: "17:45" }
    ],
    total_worked_minutes: 463
  },
  {
    employee_id: "EMP-00101",
    employee_name: "Sarah Martin",
    date: "2026-09-19",
    status: "PRESENT",
    sessions: [
      { check_in: "08:30", check_out: "12:15" },
      { check_in: "13:15", check_out: null }
    ],
    total_worked_minutes: 420
  },
  {
    employee_id: "EMP-00125",
    employee_name: "Thomas Dupont",
    date: "2026-09-19",
    status: "PRESENT",
    sessions: [
      { check_in: "09:05", check_out: "12:40" },
      { check_in: "13:40", check_out: "18:00" }
    ],
    total_worked_minutes: 475
  },
  {
    employee_id: "EMP-00126",
    employee_name: "Lina Garcia",
    date: "2026-09-19",
    status: "REMOTE",
    sessions: [
      { check_in: "09:00", check_out: "12:30" },
      { check_in: "13:30", check_out: "17:30" }
    ],
    total_worked_minutes: 450
  },
  {
    employee_id: "EMP-00100",
    employee_name: "Marie Laurent",
    date: "2026-09-19",
    status: "PRESENT",
    sessions: [
      { check_in: "08:45", check_out: "12:30" },
      { check_in: "13:30", check_out: "17:15" }
    ],
    total_worked_minutes: 450
  },
  {
    employee_id: "EMP-00130",
    employee_name: "Pierre Bernard",
    date: "2026-09-19",
    status: "ON_LEAVE",
    sessions: [],
    total_worked_minutes: 0
  }
];

export const AttendancePage = () => {
  const { currentRole } = useAuth();
  const [attendance, setAttendance] = useState(FALLBACK_ATTENDANCE);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchAttendance = async () => {
    try {
      const res = await fetch(`${API_URL}/attendance`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setAttendance(data);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const openCorrection = (record) => {
    setSelectedRecord(record);
    setIsCorrectionModalOpen(true);
  };

  const filtered = attendance.filter(a => {
    const matchesSearch =
      (a.employee_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.employee_id || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.date || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const presentCount = attendance.filter(a => a.status === 'PRESENT').length;
  const remoteCount = attendance.filter(a => a.status === 'REMOTE').length;
  const leaveCount = attendance.filter(a => a.status === 'ON_LEAVE').length;
  const totalWorked = attendance.reduce((acc, curr) => acc + (curr.total_worked_minutes || 0), 0);

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
            <Clock size={22} style={{ color: 'var(--primary)' }} /> Présence & Pointages en Temps Réel
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 3 }}>
            Suivi des sessions de badgeage, calcul des heures réelles et régularisations
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Sur site (Présents)', value: presentCount, sub: 'Badgeages validés', icon: UserCheck, color: 'var(--primary)', bg: '#F0FDF4' },
          { label: 'En Télétravail', value: remoteCount, sub: 'Déclarations actives', icon: Laptop, color: '#8B5CF6', bg: '#EDE9FE' },
          { label: 'En Congé / Absents', value: leaveCount, sub: 'Absences planifiées', icon: CalendarDays, color: '#F59E0B', bg: '#FFFBEB' },
          { label: 'Volume cumulé', value: `${Math.floor(totalWorked / 60)}h ${totalWorked % 60}m`, sub: 'Heures travaillées', icon: Clock, color: '#3B82F6', bg: '#EFF6FF' },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: kpi.bg, color: kpi.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={20} />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{kpi.value}</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>{kpi.label}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{kpi.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="input-with-icon" style={{ maxWidth: 380, width: '100%' }}>
          <Search className="input-icon" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrer par nom de salarié ou matricule..."
            className="input"
            style={{ paddingLeft: 38 }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'Tous' },
            { id: 'PRESENT', label: 'Sur site' },
            { id: 'REMOTE', label: 'Télétravail' },
            { id: 'ON_LEAVE', label: 'En congé' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`btn btn-sm ${statusFilter === f.id ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.75rem', borderRadius: 20, padding: '5px 14px' }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Attendance Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Collaborateur</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Sessions du jour</th>
                <th>Temps Effectif</th>
                {(currentRole === 'MANAGER' || currentRole === 'HR') && (
                  <th style={{ textAlign: 'right' }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    Aucun enregistrement de présence correspondant
                  </td>
                </tr>
              ) : filtered.map((row, idx) => (
                <tr key={idx}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'linear-gradient(135deg, #0F172A, #334155)',
                        color: 'white', fontWeight: 700, fontSize: '0.72rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {row.employee_name?.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>{row.employee_name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {row.employee_id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                    {row.date}
                  </td>
                  <td>
                    <span className={`badge ${
                      row.status === 'PRESENT' ? 'badge-success' :
                      row.status === 'REMOTE' ? 'badge-purple' :
                      row.status === 'ON_LEAVE' ? 'badge-warning' :
                      'badge-danger'
                    }`}>
                      {row.status === 'PRESENT' ? '● Présent' :
                       row.status === 'REMOTE' ? '● Télétravail' :
                       row.status === 'ON_LEAVE' ? '● Congé' : '● Absent'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(row.sessions || []).length === 0 ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucune session</span>
                      ) : (
                        (row.sessions || []).map((s, sIdx) => (
                          <span
                            key={sIdx}
                            style={{
                              padding: '3px 8px',
                              borderRadius: 6,
                              background: '#F8FAFC',
                              border: '1px solid var(--border)',
                              fontSize: '0.75rem',
                              fontFamily: 'monospace',
                              color: 'var(--text-primary)',
                              whiteSpace: 'nowrap',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.check_out ? 'var(--primary)' : 'var(--warning)' }} />
                            {s.check_in} → {s.check_out || 'En cours'}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td style={{ fontWeight: 800, fontFamily: 'monospace', color: row.total_worked_minutes > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {Math.floor((row.total_worked_minutes || 0) / 60)}h {((row.total_worked_minutes || 0) % 60).toString().padStart(2, '0')}m
                  </td>
                  {(currentRole === 'MANAGER' || currentRole === 'HR') && (
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => openCorrection(row)}
                        className="btn btn-outline btn-sm"
                        style={{ color: 'var(--warning-text)', borderColor: 'rgba(245,158,11,0.3)', fontSize: '0.75rem' }}
                      >
                        <Edit3 size={12} />
                        Régulariser
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AttendanceCorrectionModal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        employee={selectedRecord ? { id: selectedRecord.employee_id, first_name: selectedRecord.employee_name, last_name: "" } : null}
        dateStr={selectedRecord ? selectedRecord.date : null}
        onSuccess={fetchAttendance}
      />
    </div>
  );
};
