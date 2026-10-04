import React, { useState, useEffect } from 'react';
import { API_URL, useAuth } from '../context/AuthContext';
import { LeaveModal } from '../components/LeaveModal';
import { Palmtree, Plus, Check, X, Search, Calendar, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

const FALLBACK_LEAVES = [
  {
    id: "leave_001",
    employee_id: "EMP-00124",
    employee_name: "Ahmed Ben Ali",
    leave_type: "Congé Annuel",
    start_date: "2026-10-12",
    end_date: "2026-10-16",
    days: 5,
    reason: "Congés d'automne en famille",
    status: "APPROVED",
    approved_by: "Sarah Martin",
    created_at: "2026-09-10"
  },
  {
    id: "leave_002",
    employee_id: "EMP-00125",
    employee_name: "Thomas Dupont",
    leave_type: "RTT",
    start_date: "2026-09-25",
    end_date: "2026-09-25",
    days: 1,
    reason: "Journée de récupération projet Q3",
    status: "PENDING",
    approved_by: null,
    created_at: "2026-09-18"
  },
  {
    id: "leave_003",
    employee_id: "EMP-00126",
    employee_name: "Lina Garcia",
    leave_type: "Congé Annuel",
    start_date: "2026-11-02",
    end_date: "2026-11-06",
    days: 5,
    reason: "Voyage prévu de longue date",
    status: "PENDING",
    approved_by: null,
    created_at: "2026-09-17"
  },
  {
    id: "leave_004",
    employee_id: "EMP-00130",
    employee_name: "Pierre Bernard",
    leave_type: "Maladie",
    start_date: "2026-09-18",
    end_date: "2026-09-19",
    days: 2,
    reason: "Arrêt de travail transmis par télétransmission",
    status: "APPROVED",
    approved_by: "Marie Laurent",
    created_at: "2026-09-18"
  }
];

export const LeavesPage = () => {
  const { currentRole, currentEmployee } = useAuth();
  const [leaves, setLeaves] = useState(FALLBACK_LEAVES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchLeaves = async () => {
    try {
      const res = await fetch(`${API_URL}/leaves`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setLeaves(data);
        }
      }
    } catch {}
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleApprove = async (id) => {
    try {
      await fetch(`${API_URL}/leaves/${id}/approve`, { method: 'POST' });
    } catch {}
    setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: 'APPROVED', approved_by: 'Moi' } : l));
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
  };

  const handleReject = async (id) => {
    try {
      await fetch(`${API_URL}/leaves/${id}/reject`, { method: 'POST' });
    } catch {}
    setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: 'REJECTED' } : l));
  };

  const filtered = leaves.filter(l => {
    const matchesFilter = filter === 'ALL' || l.status === filter;
    const matchesSearch =
      (l.employee_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.leave_type || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.reason || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const balances = [
    { label: 'Congé Annuel Solde', value: currentEmployee?.leave_balance ?? 18, sub: `sur ${currentEmployee?.allocated_leave ?? 25}j alloués`, color: 'var(--primary)', bg: '#F0FDF4' },
    { label: 'RTT Restants', value: 4, sub: 'Exercice 2026', color: '#3B82F6', bg: '#EFF6FF' },
    { label: 'Télétravail Quota', value: '2 j / sem', sub: 'Accord d’entreprise', color: '#8B5CF6', bg: '#EDE9FE' },
    { label: 'Demandes en attente', value: leaves.filter(l => l.status === 'PENDING').length, sub: 'À valider par Manager', color: '#F59E0B', bg: '#FFFBEB' },
  ];

  const statusMap = {
    APPROVED: { label: 'Approuvé', cls: 'badge-success' },
    REJECTED: { label: 'Refusé', cls: 'badge-danger' },
    PENDING: { label: 'En attente', cls: 'badge-warning' },
  };

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
            <Palmtree size={22} style={{ color: 'var(--primary)' }} /> Gestion des Congés & Absences
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 3 }}>
            Déposez vos demandes de congés, suivez vos soldes et validez les requêtes d’équipe
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={15} /> Poser une demande
        </button>
      </div>

      {/* Balance Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {balances.map((b) => (
          <div key={b.label} className="card" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 6 }}>{b.label}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: b.color, lineHeight: 1.1 }}>{b.value}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{b.sub}</div>
          </div>
        ))}
      </div>

      {/* Search & Filter Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="input-with-icon" style={{ maxWidth: 360, width: '100%' }}>
          <Search className="input-icon" size={15} />
          <input
            type="text"
            className="input"
            style={{ paddingLeft: 38 }}
            placeholder="Rechercher salarié, motif, type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { key: 'ALL', label: 'Toutes les demandes' },
            { key: 'PENDING', label: 'En attente' },
            { key: 'APPROVED', label: 'Validées' },
            { key: 'REJECTED', label: 'Refusées' },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setFilter(s.key)}
              className={`btn btn-sm ${filter === s.key ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.75rem', borderRadius: 20, padding: '5px 14px' }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Salarié</th>
                <th>Type d'absence</th>
                <th>Période</th>
                <th>Durée</th>
                <th>Motif renseigné</th>
                <th>Statut</th>
                {(currentRole === 'MANAGER' || currentRole === 'HR') && <th style={{ textAlign: 'right' }}>Décision</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    Aucune demande de congé enregistrée
                  </td>
                </tr>
              ) : filtered.map((req) => {
                const s = statusMap[req.status] || { label: req.status, cls: 'badge-muted' };
                return (
                  <tr key={req.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                          color: 'white', fontWeight: 700, fontSize: '0.72rem',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {req.employee_name?.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{req.employee_name}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        padding: '3px 8px', borderRadius: 6,
                        background: '#F0FDF4', color: 'var(--primary)',
                        fontWeight: 600, fontSize: '0.78rem'
                      }}>
                        {req.leave_type}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {req.start_date} → {req.end_date}
                    </td>
                    <td style={{ fontWeight: 800, fontSize: '0.85rem' }}>{req.days} j</td>
                    <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      {req.reason}
                    </td>
                    <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                    {(currentRole === 'MANAGER' || currentRole === 'HR') && (
                      <td style={{ textAlign: 'right' }}>
                        {req.status === 'PENDING' ? (
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button onClick={() => handleReject(req.id)} className="btn btn-outline btn-sm" title="Refuser" style={{ color: 'var(--danger-text)', borderColor: 'rgba(239,68,68,0.3)' }}>
                              <X size={13} />
                            </button>
                            <button onClick={() => handleApprove(req.id)} className="btn btn-primary btn-sm" title="Valider le congé">
                              <Check size={13} /> Valider
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {req.approved_by ? `Validé par ${req.approved_by}` : 'Traité'}
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
