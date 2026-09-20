import React, { useState, useEffect } from 'react';
import { API_URL, useAuth } from '../context/AuthContext';
import { LeaveModal } from '../components/LeaveModal';
import { Palmtree, Plus, Check, X } from 'lucide-react';
import confetti from 'canvas-confetti';

export const LeavesPage = () => {
  const { currentRole, currentEmployee } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('ALL');

  const fetchLeaves = async () => {
    try {
      const res = await fetch(`${API_URL}/leaves`);
      if (res.ok) setLeaves(await res.json());
    } catch {}
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleApprove = async (id) => {
    try {
      await fetch(`${API_URL}/leaves/${id}/approve`, { method: 'POST' });
      fetchLeaves();
      confetti({ particleCount: 50, spread: 60 });
    } catch {}
  };

  const handleReject = async (id) => {
    try {
      await fetch(`${API_URL}/leaves/${id}/reject`, { method: 'POST' });
      fetchLeaves();
    } catch {}
  };

  const filtered = filter === 'ALL' ? leaves : leaves.filter(l => l.status === filter);

  const balances = [
    { label: 'Congé Annuel', value: currentEmployee?.leave_balance ?? '—', sub: `sur ${currentEmployee?.allocated_leave ?? 25}j`, color: '#22C55E', bg: '#F0FDF4' },
    { label: 'RTT Restants', value: 4, sub: 'Acquis 2026', color: '#3B82F6', bg: '#EFF6FF' },
    { label: 'Télétravail', value: '2/sem', sub: 'Autorisé', color: '#8B5CF6', bg: '#EDE9FE' },
    { label: 'Congé Maladie', value: 1, sub: 'Justificatif OK', color: '#F59E0B', bg: '#FFFBEB' },
  ];

  const statusMap = {
    APPROVED: { label: 'Approuvé', cls: 'badge-success' },
    REJECTED: { label: 'Refusé', cls: 'badge-danger' },
    PENDING: { label: 'En attente', cls: 'badge-warning' },
  };

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Palmtree size={22} style={{ color: 'var(--primary)' }} /> Gestion des Congés
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 3 }}>
            Demandes, soldes et validations
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={15} /> Demander un congé
        </button>
      </div>

      {/* Balance Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {balances.map((b) => (
          <div key={b.label} className="card" style={{ padding: '1.1rem' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 8 }}>{b.label}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: b.color, lineHeight: 1 }}>{b.value}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{b.sub}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Historique des demandes ({filtered.length})</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.75rem' }}
              >
                {s === 'ALL' ? 'Tous' : statusMap[s]?.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Salarié</th>
                <th>Type</th>
                <th>Période</th>
                <th>Durée</th>
                <th>Motif</th>
                <th>Statut</th>
                {(currentRole === 'MANAGER' || currentRole === 'HR') && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Aucune demande</td></tr>
              ) : filtered.map((req) => {
                const s = statusMap[req.status] || { label: req.status, cls: 'badge-muted' };
                return (
                  <tr key={req.id}>
                    <td style={{ fontWeight: 600 }}>{req.employee_name}</td>
                    <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{req.leave_type}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {req.start_date} → {req.end_date}
                    </td>
                    <td style={{ fontWeight: 600 }}>{req.days} j</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      {req.reason}
                    </td>
                    <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                    {(currentRole === 'MANAGER' || currentRole === 'HR') && (
                      <td style={{ textAlign: 'right' }}>
                        {req.status === 'PENDING' ? (
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button onClick={() => handleReject(req.id)} className="btn btn-danger btn-sm">
                              <X size={12} />
                            </button>
                            <button onClick={() => handleApprove(req.id)} className="btn btn-primary btn-sm">
                              <Check size={12} /> Approuver
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Traité par {req.approved_by || 'Manager'}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <LeaveModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchLeaves} />
    </div>
  );
};
