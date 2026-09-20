import React, { useState, useEffect } from 'react';
import { API_URL, useAuth } from '../context/AuthContext';
import { AttendanceCorrectionModal } from '../components/AttendanceCorrectionModal';
import { Clock, Search, Edit3 } from 'lucide-react';

export const AttendancePage = () => {
  const { currentRole } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const fetchAttendance = async () => {
    try {
      const res = await fetch(`${API_URL}/attendance`);
      if (res.ok) {
        const data = await res.json();
        setAttendance(data);
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

  const filtered = attendance.filter(a =>
    a.employee_name.toLowerCase().includes(search.toLowerCase()) ||
    a.employee_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={22} style={{ color: 'var(--primary)' }} /> Présence & Pointage
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 3 }}>
            Historique des sessions de travail et corrections de badgeage
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="input-with-icon" style={{ maxWidth: 420 }}>
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

      {/* Attendance Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Salarié</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Sessions de badgeage</th>
                <th>Total Travaillé</th>
                {(currentRole === 'MANAGER' || currentRole === 'HR') && (
                  <th style={{ textAlign: 'right' }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Aucun enregistrement de présence
                  </td>
                </tr>
              ) : filtered.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>
                    {row.employee_name}
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>
                      {row.employee_id}
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
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(row.sessions || []).map((s, sIdx) => (
                        <span
                          key={sIdx}
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: 'var(--bg-app)',
                            border: '1px solid var(--border)',
                            fontSize: '0.75rem',
                            fontFamily: 'monospace',
                            color: 'var(--info-text)',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {s.check_in} → {s.check_out || 'En cours'}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary)' }}>
                    {Math.floor(row.total_worked_minutes / 60)}h {(row.total_worked_minutes % 60).toString().padStart(2, '0')}m
                  </td>
                  {(currentRole === 'MANAGER' || currentRole === 'HR') && (
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => openCorrection(row)}
                        className="btn btn-outline btn-sm"
                        style={{ color: 'var(--warning-text)', borderColor: 'var(--warning)', fontSize: '0.75rem' }}
                      >
                        <Edit3 size={12} />
                        Corriger
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
