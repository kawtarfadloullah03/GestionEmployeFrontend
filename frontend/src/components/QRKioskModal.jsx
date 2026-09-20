import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { QrCode, CheckCircle, X } from 'lucide-react';
import confetti from 'canvas-confetti';

export const QRKioskModal = () => {
  const { isKioskOpen, setIsKioskOpen } = useAuth();
  const [statusMsg, setStatusMsg] = useState(null);

  if (!isKioskOpen) return null;

  const handleSimulateScan = (empName, empId, position) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setStatusMsg({ name: empName, time: nowTime, position });
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const employees = [
    { name: 'Ahmed Ben Ali', id: 'EMP-00124', pos: 'Software Engineer', color: '#22C55E', initials: 'AB' },
    { name: 'Sarah Martin', id: 'EMP-00101', pos: 'Engineering Manager', color: '#3B82F6', initials: 'SM' },
    { name: 'Thomas Dupont', id: 'EMP-00125', pos: 'Frontend Dev', color: '#8B5CF6', initials: 'TD' },
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-panel animate-in" style={{ maxWidth: 460, textAlign: 'center' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCode size={20} style={{ color: 'var(--primary)' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Borne de Badgeage</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Simulateur QR Code</div>
            </div>
          </div>
          <button className="btn-icon" onClick={() => setIsKioskOpen(false)}><X size={16} /></button>
        </div>

        <div className="modal-body">
          {/* QR Code simulator graphic */}
          <div style={{
            width: 160, height: 160, margin: '0 auto 1.5rem',
            background: '#1A2332', borderRadius: 16, padding: 16,
            border: '3px solid var(--primary)', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5, width: '100%', height: '100%' }}>
              {[...Array(25)].map((_, i) => (
                <div key={i} style={{
                  borderRadius: 3,
                  background: [0,1,5,6,10,14,18,19,23,24,7,12,17,3,11,15].includes(i)
                    ? 'var(--primary)'
                    : [2,8,9,13,16,20,22].includes(i)
                    ? '#3B82F6'
                    : 'rgba(255,255,255,0.06)'
                }} />
              ))}
            </div>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 13,
              border: '2px solid rgba(34,197,94,0.3)',
              animation: 'pulse 2s ease infinite'
            }} />
          </div>

          {statusMsg ? (
            <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12, padding: '1rem', marginBottom: '1rem' }}>
              <CheckCircle size={28} style={{ color: 'var(--primary)', marginBottom: 8 }} />
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{statusMsg.name}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{statusMsg.position}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>
                ✅ Badgeage enregistré à {statusMsg.time}
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Présentez votre QR Code ou sélectionnez un salarié pour simuler le badgeage :
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {employees.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => handleSimulateScan(emp.name, emp.id, emp.pos)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                      background: 'white', border: '1.5px solid var(--border)', borderRadius: 10,
                      cursor: 'pointer', transition: 'all 0.15s ease', textAlign: 'left'
                    }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = emp.color; e.currentTarget.style.background = '#F8FAFC'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'white'; }}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: emp.color, color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '0.75rem', flexShrink: 0
                    }}>{emp.initials}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{emp.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{emp.pos} · {emp.id}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
