import React, { useState, useEffect, useRef } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { Play, Pause } from 'lucide-react';
import confetti from 'canvas-confetti';

function getLocalDateStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const AttendanceWidget = () => {
  const { currentEmployee } = useAuth();
  const [clockStatus, setClockStatus] = useState('OFF');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [todaySessions, setTodaySessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());
  const elapsedRef = useRef(0);
  const fetchTimerRef = useRef(null);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchTodayRecord = async () => {
    if (!currentEmployee?.id) return;
    try {
      const todayStr = getLocalDateStr();
      const res = await fetch(`${API_URL}/attendance`);
      if (res.ok) {
        const data = await res.json();
        const myRecord = data.find(r => r.employee_id === currentEmployee.id && r.date === todayStr);
        if (myRecord) {
          const sessions = myRecord.sessions || [];
          setTodaySessions(sessions);
          const workedMins = myRecord.total_worked_minutes || 0;
          setElapsedSeconds(workedMins * 60);
          elapsedRef.current = workedMins * 60;
          const hasActiveSession = sessions.some(s => !s.check_out);
          setClockStatus(hasActiveSession ? 'WORKING' : 'PAUSED');
        } else {
          setTodaySessions([]);
          setElapsedSeconds(0);
          elapsedRef.current = 0;
          setClockStatus('OFF');
        }
      }
    } catch (e) { console.warn(e); }
  };

  useEffect(() => { fetchTodayRecord(); }, [currentEmployee]);

  // Live elapsed timer — ticks every second when WORKING
  useEffect(() => {
    let timer;
    if (clockStatus === 'WORKING') {
      timer = setInterval(() => {
        elapsedRef.current += 1;
        setElapsedSeconds(elapsedRef.current);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [clockStatus]);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleClockAction = async () => {
    if (!currentEmployee?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/attendance/clock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: currentEmployee.id })
      });
      if (res.ok) {
        const data = await res.json();
        // Small delay to let backend write
        await new Promise(r => setTimeout(r, 300));
        await fetchTodayRecord();
        if (data.status === 'IN_SESSION') confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', textTransform: 'capitalize' }}>{dateStr}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1, marginTop: 4 }}>
            {timeStr}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 3 }}>
            Aujourd'hui travaille : <strong style={{ color: 'var(--primary)' }}>{formatTime(elapsedSeconds)}</strong>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Statut</div>
          {clockStatus === 'WORKING' ? (
            <span className="badge badge-success" style={{ fontSize: '0.8rem', padding: '5px 14px' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', display: 'inline-block', animation: 'pulse 1.5s infinite', marginRight: 6 }} />
              En cours
            </span>
          ) : clockStatus === 'PAUSED' ? (
            <span className="badge badge-warning" style={{ fontSize: '0.8rem', padding: '5px 14px' }}>En pause</span>
          ) : (
            <span className="badge badge-muted" style={{ fontSize: '0.8rem', padding: '5px 14px' }}>Non demarre</span>
          )}
        </div>
      </div>

      {/* Large Timer Display */}
      <div style={{
        background: 'var(--bg-app)', borderRadius: 12, padding: '1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '1rem', border: '1px solid var(--border)'
      }}>
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Compteur de temps
          </div>
          <div style={{
            fontSize: '2.5rem', fontWeight: 800,
            color: clockStatus === 'WORKING' ? 'var(--primary)' : 'var(--text-primary)',
            fontFamily: 'monospace', letterSpacing: '0.04em', lineHeight: 1
          }}>
            {formatTime(elapsedSeconds)}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
            {todaySessions.length} session(s) enregistree(s)
          </div>
        </div>

        <button
          onClick={handleClockAction}
          disabled={loading}
          className="btn btn-primary"
          style={{
            padding: '12px 24px', fontSize: '0.9rem',
            background: clockStatus === 'WORKING'
              ? '#F59E0B'
              : 'var(--primary)',
            boxShadow: clockStatus === 'WORKING'
              ? '0 4px 14px rgba(245,158,11,0.35)'
              : '0 4px 14px rgba(34,197,94,0.35)',
          }}
        >
          {clockStatus === 'WORKING' ? (
            <><Pause size={17} /> {loading ? 'Action...' : 'Pause / Sortie'}</>
          ) : (
            <><Play size={17} /> {loading ? 'Action...' : 'Pointer'}</>
          )}
        </button>
      </div>

      {/* Sessions list */}
      {todaySessions.length > 0 && (
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Sessions du jour
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
            {todaySessions.map((s, i) => (
              <div key={i} style={{ padding: '8px 12px', background: '#F0FDF4', borderRadius: 8, border: '1px solid #86EFAC', fontSize: '0.78rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 3 }}>Session #{i + 1}</div>
                <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                  {s.check_in} → {s.check_out || 'En cours'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
