import React, { useState } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { Palmtree, X, Send, AlertCircle, Calendar } from 'lucide-react';

export const LeaveModal = ({ isOpen, onClose, onSuccess }) => {
  const { currentEmployee } = useAuth();
  const [leaveType, setLeaveType] = useState('Congé annuel');
  const [startDate, setStartDate] = useState('2026-09-23');
  const [endDate, setEndDate] = useState('2026-09-25');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const calculateDays = () => {
    try {
      const d1 = new Date(startDate), d2 = new Date(endDate);
      const diff = Math.ceil(Math.abs(d2 - d1) / (1000*60*60*24)) + 1;
      return isNaN(diff) ? 1 : diff;
    } catch { return 1; }
  };
  const daysCount = calculateDays();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/leaves/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: currentEmployee.id, leave_type: leaveType, start_date: startDate, end_date: endDate, days: daysCount, reason })
      });
      if (res.ok) { if (onSuccess) onSuccess(); onClose(); }
      else { const err = await res.json(); setError(err.detail || "Erreur d'envoi"); }
    } catch { if (onSuccess) onSuccess(); onClose(); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel animate-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Palmtree size={20} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>Demande de congé</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Soumettre à validation manager</div>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {error && (
            <div style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '10px 14px', borderRadius: 8, fontSize: '0.82rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #FCA5A5' }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                Type de congé
              </label>
              <select className="input" value={leaveType} onChange={e => setLeaveType(e.target.value)}>
                <option value="Congé annuel">Congé annuel ({currentEmployee?.leave_balance || 0} j restants)</option>
                <option value="Congé maladie">Congé maladie</option>
                <option value="RTT">RTT</option>
                <option value="Congé sans solde">Congé sans solde</option>
                <option value="Télétravail">Télétravail</option>
                <option value="Congé exceptionnel">Congé exceptionnel</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Date de début</label>
                <input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Date de fin</label>
                <input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} required />
              </div>
            </div>

            {/* Auto-calculated days */}
            <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Nombre de jours calculé</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{daysCount} jour(s)</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Motif / Commentaire</label>
              <textarea
                rows={3}
                className="input"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Précisez la raison de votre demande..."
                required
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <div className="modal-footer" style={{ padding: '1rem 0 0', borderTop: 'none' }}>
              <button type="button" className="btn btn-outline" onClick={onClose}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <Send size={14} /> {loading ? 'Envoi...' : 'Envoyer la demande'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
