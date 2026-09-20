import React, { useState, useEffect } from 'react';
import { API_URL, useAuth } from '../context/AuthContext';
import { Clock, Search } from 'lucide-react';

export const MyAttendancePage = () => {
  const { currentEmployee } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!currentEmployee?.id) return;
    const fetchMyAttendance = async () => {
      try {
        const res = await fetch(`${API_URL}/attendance`);
        if (res.ok) {
          const data = await res.json();
          const mine = data.filter(r => r.employee_id === currentEmployee.id);
          setAttendance(mine);
        }
      } catch {}
    };
    fetchMyAttendance();
  }, [currentEmployee]);

  const filtered = attendance.filter(a =>
    a.date.includes(search) ||
    (a.status || '').toLowerCase().includes(search.toLowerCase())
  );

  const todayRecord = attendance.find(a => a.date === new Date().toISOString().split('T')[0]);
  const todayStatus = todayRecord?.status || 'ABSENT';
  const todayWorked = todayRecord?.total_worked_minutes || 0;

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={22} style={{ color: 'var(--primary)' }} /> Mes présences
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 3 }}>
          Historique personnel de vos sessions de travail
        </p>
      </div>

      {/* Today summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.1rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 8 }}>Statut aujourd'hui</div>
          <span className={`badge ${
            todayStatus === 'PRESENT' ? 'badge-success' :
            todayStatus === 'REMOTE' ? 'badge-purple' :
            todayStatus === 'ON_LEAVE' ? 'badge-warning' :
            'badge-danger'
          }`} style={{ fontSize: '0.85rem', padding: '5px 14px' }}>
            {todayStatus === 'PRESENT' ? 'Présent' :
             todayStatus === 'REMOTE' ? 'Télétravail' :
             todayStatus === 'ON_LEAVE' ? 'En congé' : 'Absent'}
          </span>
        </div>
        <div className="card" style={{ padding: '1.1rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 8 }}>Heures aujourd'hui</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
            {Math.floor(todayWorked / 60)}h {(todayWorked % 60).toString().padStart(2, '0')}
          </div>
        </div>
        <div className="card" style={{ padding: '1.1rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 8 }}>Total sessions</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {attendance.length}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="input-with-icon" style={{ maxWidth: 350 }}>
        <Search className="input-icon" size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrer par date ou statut..."
          className="input"
          style={{ paddingLeft: 38 }}
        />
      </div>

      {/* History table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Statut</th>
                <th>Sessions</th>
                <th>Total travaillé</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Aucun enregistrement</td></tr>
              ) : filtered.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{row.date}</td>
                  <td>
                    <span className={`badge ${
                      row.status === 'PRESENT' ? 'badge-success' :
                      row.status === 'REMOTE' ? 'badge-purple' :
                      row.status === 'ON_LEAVE' ? 'badge-warning' :
                      'badge-danger'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(row.sessions || []).map((s, sIdx) => (
                        <span key={sIdx} style={{
                          padding: '3px 8px', borderRadius: 6,
                          background: 'var(--bg-app)', border: '1px solid var(--border)',
                          fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--info-text)',
                          whiteSpace: 'nowrap'
                        }}>
                          {s.check_in} → {s.check_out || 'En cours'}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary)' }}>
                    {Math.floor(row.total_worked_minutes / 60)}h {(row.total_worked_minutes % 60).toString().padStart(2, '0')}m
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
