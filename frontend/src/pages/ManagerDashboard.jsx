import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { Users, Clock, Calendar, Check, X, AlertTriangle, TrendingUp, UserCheck, UserX, Plane } from 'lucide-react';
import confetti from 'canvas-confetti';

const teamMembers = [
  { name: 'Thomas Dupont', role: 'Frontend Developer', status: 'PRESENT', avatar: null, initials: 'TD', checkIn: '08:47' },
  { name: 'Lina Garcia', role: 'UX Designer', status: 'REMOTE', avatar: null, initials: 'LG', checkIn: '09:02' },
  { name: 'Julie Martin', role: 'Backend Dev', status: 'PRESENT', avatar: null, initials: 'JM', checkIn: '08:31' },
  { name: 'Marc Leroy', role: 'DevOps', status: 'ON_LEAVE', avatar: null, initials: 'ML', checkIn: '—' },
  { name: 'Camille Blanc', role: 'QA Engineer', status: 'ABSENT', avatar: null, initials: 'CB', checkIn: '—' },
];

const STATUS_MAP = {
  PRESENT: { label: 'Présent', cls: 'badge-success', dot: 'dot-green' },
  REMOTE: { label: 'Télétravail', cls: 'badge-info', dot: 'dot-blue' },
  ON_LEAVE: { label: 'En congé', cls: 'badge-warning', dot: 'dot-yellow' },
  ABSENT: { label: 'Absent', cls: 'badge-danger', dot: 'dot-red' },
};

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

const AVATAR_COLORS = ['#22C55E', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];

export const ManagerDashboard = () => {
  const { currentUser } = useAuth();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPendingRequests = async () => {
    try {
      const res = await fetch(`${API_URL}/leaves?status=PENDING`);
      if (res.ok) setPendingRequests(await res.json());
    } catch (e) { console.warn(e); }
  };

  useEffect(() => { fetchPendingRequests(); }, []);

  const handleApprove = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/leaves/${id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (res.ok) { confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } }); fetchPendingRequests(); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleReject = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/leaves/${id}/reject`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (res.ok) fetchPendingRequests();
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const stats = [
    { label: 'Présents', value: 3, icon: UserCheck, color: '#22C55E', bg: '#F0FDF4' },
    { label: 'Télétravail', value: 1, icon: Clock, color: '#3B82F6', bg: '#EFF6FF' },
    { label: 'En congé', value: 1, icon: Plane, color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'Absents', value: 1, icon: UserX, color: '#EF4444', bg: '#FEF2F2' },
  ];

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Bonjour, {currentUser?.first_name} 👋
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 3 }}>
            Vue équipe · Vendredi 19 Septembre 2026
          </p>
        </div>
        <span className="badge badge-success" style={{ padding: '5px 14px', fontSize: '0.8rem' }}>
          👩‍💼 Manager Équipe
        </span>
      </div>

      {/* Team Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card" style={{ padding: '1.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={15} style={{ color: s.color }} />
                </div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>sur 6 collaborateurs</div>
            </div>
          );
        })}
      </div>

      {/* Main two-column */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.25rem' }}>
        {/* Team List */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Users size={16} style={{ color: 'var(--primary)' }} /> Mon équipe aujourd'hui
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>6 membres</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Collaborateur</th>
                <th>Poste</th>
                <th>Arrivée</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((m, i) => {
                const s = STATUS_MAP[m.status];
                return (
                  <tr key={i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                          background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                          color: 'white', fontWeight: 700, fontSize: '0.72rem',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>{m.initials}</div>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{m.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{m.role}</td>
                    <td style={{ fontWeight: 500, fontSize: '0.82rem' }}>{m.checkIn}</td>
                    <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Leave Approvals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 7 }}>
                <Calendar size={16} style={{ color: 'var(--warning)' }} /> Congés à valider
              </span>
              {pendingRequests.length > 0 && (
                <span className="badge badge-warning">{pendingRequests.length} en attente</span>
              )}
            </div>

            {pendingRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                <Check size={28} style={{ color: 'var(--success)', margin: '0 auto 8px' }} />
                Toutes les demandes sont traitées
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pendingRequests.map((req) => (
                  <div key={req.id} style={{ padding: '12px', background: '#FFFBEB', borderRadius: 10, border: '1px solid #FDE68A' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#F59E0B', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem', flexShrink: 0 }}>
                        {getInitials(req.employee_name || 'XX')}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{req.employee_name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{req.leave_type} · {req.days} jour(s)</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
                      Du {req.start_date} au {req.end_date}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleReject(req.id)} disabled={loading} className="btn btn-danger btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                        <X size={13} /> Refuser
                      </button>
                      <button onClick={() => handleApprove(req.id)} disabled={loading} className="btn btn-primary btn-sm" style={{ flex: 2, justifyContent: 'center' }}>
                        <Check size={13} /> Approuver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alerts */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 7 }}>
              <AlertTriangle size={16} style={{ color: 'var(--warning)' }} /> Alertes présence
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ padding: '10px 12px', background: '#FFFBEB', borderRadius: 8, borderLeft: '3px solid #F59E0B' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 3 }}>Thomas Dupont</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>1h de moins que le planning hier</div>
              </div>
              <div style={{ padding: '10px 12px', background: '#FEF2F2', borderRadius: 8, borderLeft: '3px solid #EF4444' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 3 }}>Camille Blanc</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Absence non justifiée aujourd'hui</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
