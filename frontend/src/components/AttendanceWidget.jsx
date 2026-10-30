import React, { useState, useEffect, useRef } from 'react';
import { apiFetch, useAuth, API_URL } from '../context/AuthContext';
import { Play, Pause, CalendarDays, Timer, Clock, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

function getLocalDateStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseTimeToTodayTimestamp(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0);
  return d.getTime();
}

function calculateCompletedSeconds(sessions) {
  let total = 0;
  for (const s of sessions) {
    if (s.check_in && s.check_out) {
      const inParts = s.check_in.split(':').map(Number);
      const outParts = s.check_out.split(':').map(Number);
      const inSec = (inParts[0] || 0) * 3600 + (inParts[1] || 0) * 60 + (inParts[2] || 0);
      const outSec = (outParts[0] || 0) * 3600 + (outParts[1] || 0) * 60 + (outParts[2] || 0);
      if (outSec >= inSec) {
        total += (outSec - inSec);
      }
    }
  }
  return total;
}

export const AttendanceWidget = () => {
  const { currentEmployee } = useAuth();
  const [clockStatus, setClockStatus] = useState('OFF');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [todaySessions, setTodaySessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  const activeStartTimestampRef = useRef(null);
  const baseSecondsRef = useRef(0);

  // Live wall clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const getStorageKey = () => {
    const todayStr = getLocalDateStr();
    return `workflow_clock_${currentEmployee?.id || 'default'}_${todayStr}`;
  };

  const syncTimerState = (sessions, totalWorkedMinutes) => {
    const todayStr = getLocalDateStr();
    const storageKey = getStorageKey();
    const completedSec = calculateCompletedSeconds(sessions) || (totalWorkedMinutes * 60) || 0;
    
    // Find if there is an active session
    const activeSession = sessions.find(s => !s.check_out);

    if (activeSession) {
      setClockStatus('WORKING');
      baseSecondsRef.current = completedSec;

      // Check if we have exact high-resolution start timestamp in localStorage
      let startTs = null;
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
        if (saved.isActive && saved.startTimestamp) {
          startTs = Number(saved.startTimestamp);
        }
      } catch {}

      // Fallback: deduce start timestamp from activeSession.check_in
      if (!startTs && activeSession.check_in) {
        startTs = parseTimeToTodayTimestamp(activeSession.check_in);
      }
      if (!startTs) {
        startTs = Date.now();
      }

      activeStartTimestampRef.current = startTs;

      // Save to localStorage
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          isActive: true,
          startTimestamp: startTs,
          baseSeconds: completedSec
        }));
      } catch {}

      const currentActiveSeconds = Math.max(0, Math.floor((Date.now() - startTs) / 1000));
      setElapsedSeconds(completedSec + currentActiveSeconds);
    } else {
      // No active session
      setClockStatus(sessions.length > 0 ? 'PAUSED' : 'OFF');
      activeStartTimestampRef.current = null;
      baseSecondsRef.current = completedSec;
      setElapsedSeconds(completedSec);

      try {
        localStorage.setItem(storageKey, JSON.stringify({
          isActive: false,
          startTimestamp: null,
          baseSeconds: completedSec
        }));
      } catch {}
    }
  };

  const fetchTodayRecord = async () => {
    if (!currentEmployee?.id) return;
    try {
      const todayStr = getLocalDateStr();
      const res = await apiFetch(`${API_URL}/attendance`);
      if (res.ok) {
        const data = await res.json();
        const myRecord = data.find(r => r.employee_id === currentEmployee.id && r.date === todayStr);
        if (myRecord) {
          const sessions = myRecord.sessions || [];
          setTodaySessions(sessions);
          syncTimerState(sessions, myRecord.total_worked_minutes || 0);
          return;
        }
      }
    } catch (e) {
      console.warn("fetchTodayRecord error:", e);
    }

    // If no backend record exists yet, check localStorage to see if user clocked in locally
    try {
      const storageKey = getStorageKey();
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      if (saved.isActive && saved.startTimestamp) {
        setClockStatus('WORKING');
        activeStartTimestampRef.current = Number(saved.startTimestamp);
        baseSecondsRef.current = Number(saved.baseSeconds || 0);
        const diff = Math.max(0, Math.floor((Date.now() - saved.startTimestamp) / 1000));
        setElapsedSeconds(baseSecondsRef.current + diff);
      } else if (saved.baseSeconds) {
        setClockStatus('PAUSED');
        baseSecondsRef.current = Number(saved.baseSeconds);
        setElapsedSeconds(Number(saved.baseSeconds));
      } else {
        setClockStatus('OFF');
        setElapsedSeconds(0);
      }
    } catch {}
  };

  useEffect(() => {
    fetchTodayRecord();
  }, [currentEmployee]);

  // Live timer tick every 1000ms based on real timestamps
  useEffect(() => {
    let timer;
    if (clockStatus === 'WORKING') {
      timer = setInterval(() => {
        if (activeStartTimestampRef.current) {
          const activeSec = Math.max(0, Math.floor((Date.now() - activeStartTimestampRef.current) / 1000));
          setElapsedSeconds(baseSecondsRef.current + activeSec);
        } else {
          setElapsedSeconds(prev => prev + 1);
        }
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

    const nowD = new Date();
    const nowTimeStr = nowD.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const storageKey = getStorageKey();

    if (clockStatus !== 'WORKING') {
      // Clock in
      const startTs = Date.now();
      activeStartTimestampRef.current = startTs;
      setClockStatus('WORKING');
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          isActive: true,
          startTimestamp: startTs,
          baseSeconds: elapsedSeconds
        }));
      } catch {}
      setTodaySessions(prev => [...prev, { check_in: nowTimeStr, check_out: null }]);
    } else {
      // Clock out / Pause
      const endSec = elapsedSeconds;
      activeStartTimestampRef.current = null;
      baseSecondsRef.current = endSec;
      setClockStatus('PAUSED');
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          isActive: false,
          startTimestamp: null,
          baseSeconds: endSec
        }));
      } catch {}
      setTodaySessions(prev => {
        const last = [...prev];
        if (last.length > 0 && !last[last.length - 1].check_out) {
          last[last.length - 1] = { ...last[last.length - 1], check_out: nowTimeStr };
        }
        return last;
      });
    }

    try {
      const res = await apiFetch(`${API_URL}/attendance/clock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: currentEmployee.id })
      });
      if (res.ok) {
        const data = await res.json();
        await new Promise(r => setTimeout(r, 200));
        await fetchTodayRecord();
        if (data.status === 'IN_SESSION') {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
        }
      }
    } catch (e) {
      console.error("Attendance clock API error:", e);
    } finally {
      setLoading(false);
    }
  };

  const sessionDuration = (s) => {
    if (!s.check_in || !s.check_out) return null;
    const inP = s.check_in.split(':').map(Number);
    const outP = s.check_out.split(':').map(Number);
    const inSec = (inP[0] || 0) * 3600 + (inP[1] || 0) * 60 + (inP[2] || 0);
    const outSec = (outP[0] || 0) * 3600 + (outP[1] || 0) * 60 + (outP[2] || 0);
    const diff = outSec - inSec;
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    if (h > 0) return m > 0 ? `${h} h ${m} min` : `${h} h`;
    return `${m} min`;
  };

  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const statusConfig = {
    WORKING: { label: 'En cours', cls: 'badge-success', pulse: true },
    PAUSED: { label: 'En pause', cls: 'badge-warning', pulse: false },
    OFF: { label: 'Non démarré', cls: 'badge-muted', pulse: false },
  };
  const st = statusConfig[clockStatus] || statusConfig.OFF;

  return (
    <div className="card" style={{ padding: '1.4rem', background: 'linear-gradient(135deg, #ffffff 55%, #F0FDF4 100%)' }}>
      {/* Header: date / clock / status */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{
            width: 46, height: 46, borderRadius: 12, flexShrink: 0,
            background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CalendarDays size={22} color="#16A34A" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', textTransform: 'capitalize', color: 'var(--text-primary)' }}>{dateStr}</div>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1, marginTop: 2, letterSpacing: '-0.02em' }}>
              {timeStr}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 5 }}>
              Aujourd'hui travaillé :{' '}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)' }} />
                <strong style={{ color: 'var(--primary)', fontWeight: 700 }}>{formatTime(elapsedSeconds)}</strong>
              </span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Statut</div>
          <span className={`badge ${st.cls}`} style={{ fontSize: '0.78rem', padding: '5px 13px' }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: clockStatus === 'WORKING' ? 'var(--success)' : clockStatus === 'PAUSED' ? 'var(--warning)' : 'var(--text-muted)',
              display: 'inline-block', animation: st.pulse ? 'pulse 1.5s infinite' : 'none', marginRight: 5,
            }} />
            {st.label}
          </span>
        </div>
      </div>

      {/* Compteur de temps */}
      <div style={{
        background: '#F8FAFC', borderRadius: 14, padding: '1rem 1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        marginBottom: '1.1rem', border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Timer size={20} color="#3B82F6" />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 2 }}>
              Compteur de temps
            </div>
            <div style={{
              fontSize: '2.1rem', fontWeight: 800, lineHeight: 1,
              color: clockStatus === 'WORKING' ? 'var(--primary)' : 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}>
              {formatTime(elapsedSeconds)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
              {todaySessions.length} session(s) enregistrée(s)
            </div>
          </div>
        </div>

        <button
          onClick={handleClockAction}
          disabled={loading}
          className="btn"
          style={{
            padding: '13px 26px', fontSize: '0.9rem', fontWeight: 700, borderRadius: 12,
            background: clockStatus === 'WORKING'
              ? 'linear-gradient(135deg, #F59E0B, #D97706)'
              : 'linear-gradient(135deg, #22C55E, #16A34A)',
            color: '#fff', border: 'none',
            boxShadow: clockStatus === 'WORKING'
              ? '0 6px 16px rgba(245,158,11,0.35)'
              : '0 6px 16px rgba(34,197,94,0.35)',
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              <Clock size={16} color="#22C55E" /> Sessions du jour
            </span>
            <span className="badge badge-muted" style={{ fontSize: '0.7rem' }}>
              {todaySessions.length} session{todaySessions.length > 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10 }}>
            {todaySessions.map((s, i) => {
              const dur = sessionDuration(s);
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', background: '#F0FDF4', borderRadius: 12, border: '1px solid #86EFAC',
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #22C55E, #16A34A)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: 800,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>Session #{i + 1}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 1 }}>
                      {s.check_in} → {s.check_out || 'En cours'}
                    </div>
                    {dur && (
                      <span style={{
                        display: 'inline-block', marginTop: 5,
                        background: '#DCFCE7', color: '#15803D',
                        fontSize: '0.66rem', fontWeight: 700,
                        padding: '2px 8px', borderRadius: 999,
                      }}>{dur}</span>
                    )}
                  </div>
                  {s.check_out ? (
                    <CheckCircle2 size={18} color="#22C55E" style={{ flexShrink: 0 }} />
                  ) : (
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', animation: 'pulse 1.5s infinite', flexShrink: 0 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
