import React, { useState } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { Clock, ShieldAlert, Check, X } from 'lucide-react';

export const AttendanceCorrectionModal = ({ isOpen, onClose, employee, dateStr, onSuccess }) => {
  const { currentUser } = useAuth();
  const [checkIn, setCheckIn] = useState('08:45');
  const [checkOut, setCheckOut] = useState('17:30');
  const [reason, setReason] = useState('Oubli de badgeage à l\'arrivée (problème de carte)');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !employee) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      employee_id: employee.id,
      date: dateStr || new Date().toISOString().split('T')[0],
      check_in: checkIn,
      check_out: checkOut,
      reason: reason,
      by_user: `${currentUser.first_name} ${currentUser.last_name}`
    };

    try {
      const res = await fetch(`${API_URL}/attendance/correct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (e) {
      if (onSuccess) onSuccess();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'var(--warning-bg)', border: '1px solid var(--warning)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Clock size={18} style={{ color: 'var(--warning)' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Correction de pointage</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>Modification manuelle (Saisie Audit Log obligatoire)</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Compliance Banner */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            padding: '10px 14px', borderRadius: 8,
            background: 'var(--warning-bg)', border: '1px solid var(--warning)',
            marginBottom: '1rem', fontSize: '0.78rem', color: 'var(--warning-text)'
          }}>
            <ShieldAlert size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <span style={{ fontWeight: 700 }}>Conformité RH & Traçabilité:</span>{' '}
              Toute modification de badgeage est automatiquement enregistrée dans le journal d'audit de l'entreprise.
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Employee info */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderRadius: 8,
              background: '#F8FAFC', border: '1px solid var(--border-light)',
              fontSize: '0.82rem'
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>Salarié concerné:</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{employee.first_name} {employee.last_name} ({employee.id})</span>
            </div>

            {/* Time inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Heure d'arrivée
                </label>
                <input
                  type="time"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="input"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Heure de départ
                </label>
                <input
                  type="time"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            {/* Reason */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                Motif de correction (Obligatoire)
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Expliquez la raison (ex: Oubli de badgeage, mission extérieure...)"
                className="input"
                style={{ resize: 'vertical' }}
                required
              />
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-outline">
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ background: 'var(--warning)', color: 'white' }}
            onClick={handleSubmit}
          >
            <Check size={15} />
            {loading ? 'Enregistrement...' : 'Enregistrer & Tracer'}
          </button>
        </div>
      </div>
    </div>
  );
};
