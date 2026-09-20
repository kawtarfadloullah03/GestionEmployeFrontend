import React, { useState, useEffect } from 'react';
import { API_URL } from '../context/AuthContext';
import { Settings, Calendar, Clock, Plus, CheckCircle2 } from 'lucide-react';

export const SettingsPage = () => {
  const [holidays, setHolidays] = useState([]);
  const [newDate, setNewDate] = useState('');
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchHolidays = async () => {
    try {
      const res = await fetch(`${API_URL}/holidays`);
      if (res.ok) {
        const data = await res.json();
        setHolidays(data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!newDate || !newName || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_URL}/holidays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newDate, name: newName })
      });
      if (res.ok) {
        await fetchHolidays();
        setNewDate('');
        setNewName('');
      }
    } catch {} finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Settings size={22} style={{ color: 'var(--primary)' }} /> Configuration Entreprise
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 3 }}>
          Paramétrage des horaires de travail et calendrier des jours fériés légaux
        </p>
      </div>

      {/* Grid: Work schedules + Holidays */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
        {/* Work Schedules Card */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 7, color: 'var(--text-primary)' }}>
              <Clock size={18} style={{ color: 'var(--primary)' }} /> Horaires de travail standards
            </span>
            <span className="badge badge-success">39 heures / sem</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{
              padding: '12px 14px',
              borderRadius: 10,
              background: '#F8FAFC',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8
            }}>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                Lundi → Jeudi :
              </span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                08:30 → 17:30 <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.78rem' }}>(Pause 12:30 → 13:30)</span>
              </span>
            </div>

            <div style={{
              padding: '12px 14px',
              borderRadius: 10,
              background: '#F8FAFC',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8
            }}>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                Vendredi :
              </span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary-dark)' }}>
                08:30 → 16:30 <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.78rem' }}>(Pause 12:30 → 13:30)</span>
              </span>
            </div>
          </div>

          <div style={{
            marginTop: 'auto',
            padding: '12px 14px',
            background: 'var(--primary-light)',
            borderRadius: 10,
            border: '1px solid #BBF7D0',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <CheckCircle2 size={18} style={{ color: 'var(--primary-text)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--primary-text)', fontWeight: 500, lineHeight: 1.4 }}>
              Régime conventionnel 39h hebdomadaire avec acquisition automatique des droits RTT.
            </span>
          </div>
        </div>

        {/* Company Holidays Card */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 7, color: 'var(--text-primary)' }}>
              <Calendar size={18} style={{ color: 'var(--primary)' }} /> Jours fériés d'entreprise
            </span>
            <span className="badge badge-purple">{holidays.length} configuré(s)</span>
          </div>

          {/* Add Holiday Form */}
          <form onSubmit={handleAddHoliday} style={{ display: 'flex', gap: 8, marginBottom: '1.25rem' }}>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="input"
              style={{ width: 140, fontSize: '0.82rem' }}
              required
            />
            <input
              type="text"
              placeholder="Libellé du jour férié..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="input"
              style={{ flex: 1, fontSize: '0.82rem' }}
              required
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '8px 14px' }}
              disabled={isSubmitting}
            >
              <Plus size={16} /> Ajouter
            </button>
          </form>

          {/* Holidays List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
            {holidays.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Aucun jour férié configuré
              </div>
            ) : (
              holidays.map((h, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#F8FAFC',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {h.name}
                  </span>
                  <span style={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    color: 'var(--primary-text)',
                    background: 'var(--primary-light)',
                    padding: '3px 9px',
                    borderRadius: 6
                  }}>
                    {h.date}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
