import React, { useState, useEffect } from 'react';
import { API_URL } from '../context/AuthContext';
import { ShieldCheck, Search } from 'lucide-react';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const res = await fetch(`${API_URL}/audit-logs`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch {}
    };
    fetchAudit();
  }, []);

  const filtered = logs.filter(l =>
    (l.entity || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.by_user || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.action || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.reason || '').toLowerCase().includes(search.toLowerCase())
  );

  const getActionBadgeClass = (action = '') => {
    const act = action.toUpperCase();
    if (act.includes('DELETE') || act.includes('SUPPR') || act.includes('REJECT')) return 'badge-danger';
    if (act.includes('CREATE') || act.includes('AJOUT') || act.includes('APPROV')) return 'badge-success';
    if (act.includes('CORRECT') || act.includes('UPDATE') || act.includes('MODIF')) return 'badge-warning';
    return 'badge-purple';
  };

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={22} style={{ color: 'var(--primary)' }} /> Journal d'Audit & Traçabilité Légale
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 3 }}>
            Historique non répudiable des modifications apportées aux pointages et dossiers RH
          </p>
        </div>
        <span className="badge badge-muted" style={{ fontSize: '0.78rem', padding: '5px 12px' }}>
          {filtered.length} enregistrement(s)
        </span>
      </div>

      {/* Filter Bar */}
      <div className="input-with-icon" style={{ maxWidth: 420 }}>
        <Search className="input-icon" size={15} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par utilisateur, action ou entité..."
          className="input"
          style={{ paddingLeft: 36 }}
        />
      </div>

      {/* Logs Table Card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Auteur (Modifié par)</th>
                <th>Date & Heure</th>
                <th>Entité (Salarié)</th>
                <th>Ancienne valeur</th>
                <th>Nouvelle valeur</th>
                <th>Motif Saisi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    Aucun journal d'audit trouvé
                  </td>
                </tr>
              ) : (
                filtered.map((log, idx) => (
                  <tr key={idx}>
                    <td>
                      <span className={`badge ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {log.by_user}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {log.date}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {log.entity}
                    </td>
                    <td>
                      {log.old_value ? (
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '0.78rem',
                          color: 'var(--danger-text)',
                          background: 'var(--danger-bg)',
                          padding: '2px 8px',
                          borderRadius: 4,
                          display: 'inline-block'
                        }}>
                          {log.old_value}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      {log.new_value ? (
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '0.78rem',
                          color: 'var(--success-text)',
                          background: 'var(--success-bg)',
                          padding: '2px 8px',
                          borderRadius: 4,
                          display: 'inline-block'
                        }}>
                          {log.new_value}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      {log.reason || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
