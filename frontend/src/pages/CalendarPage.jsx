import React, { useState, useEffect } from 'react';
import { apiFetch, API_URL } from '../context/AuthContext';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await apiFetch(`${API_URL}/calendar/events`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setEvents(data);
        }
      } catch {}
    };
    fetchEvents();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon...
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Make Monday=0

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const getEventStyle = (type) => {
    switch (type) {
      case 'HOLIDAY': return { backgroundColor: '#F1F5F9', color: 'var(--text-secondary)', border: '1px solid var(--border)' };
      case 'LEAVE': return { backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)', border: '1px solid rgba(245,158,11,0.25)' };
      case 'PRESENT': return { backgroundColor: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid rgba(34,197,94,0.25)' };
      case 'REMOTE': return { backgroundColor: 'var(--purple-bg)', color: 'var(--purple-text)', border: '1px solid rgba(139,92,246,0.25)' };
      default: return { backgroundColor: '#F8FAFC', color: 'var(--text-primary)', border: '1px solid var(--border)' };
    }
  };

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarDays size={22} style={{ color: 'var(--primary)' }} />
            Calendrier d'Entreprise
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 3 }}>
            Vue mensuelle des présences, congés, télétravail et jours fériés
          </p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <span className="badge badge-success">🟢 Présent</span>
          <span className="badge badge-purple">🔵 Télétravail</span>
          <span className="badge badge-warning">🟡 Congé</span>
          <span className="badge badge-danger">🔴 Absent</span>
          <span className="badge badge-muted" style={{ border: '1px solid var(--border)' }}>⚪ Férié</span>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
            {MONTH_NAMES[month].toUpperCase()} {year}
          </h3>
          {isCurrentMonth && <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Mois en cours</span>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {!isCurrentMonth && (
            <button className="btn btn-outline btn-sm" onClick={goToday}>
              Aujourd'hui
            </button>
          )}
          <button className="btn btn-outline btn-icon" title="Mois précédent" onClick={prevMonth}>
            <ChevronLeft size={16} />
          </button>
          <button className="btn btn-outline btn-icon" title="Mois suivant" onClick={nextMonth}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Month Grid */}
      <div className="card" style={{ padding: '1.25rem', overflowX: 'auto' }}>
        {/* Day names */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, minmax(100px, 1fr))',
          gap: 8, minWidth: 700, textAlign: 'center', marginBottom: 10,
          fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)',
          textTransform: 'uppercase', letterSpacing: '0.05em'
        }}>
          <div>Lun</div><div>Mar</div><div>Mer</div><div>Jeu</div><div>Ven</div>
          <div style={{ color: 'var(--text-muted)' }}>Sam</div>
          <div style={{ color: 'var(--text-muted)' }}>Dim</div>
        </div>

        {/* Day cells */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, minmax(100px, 1fr))',
          gap: 8, minWidth: 700
        }}>
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} style={{ minHeight: 96 }} />;
            }

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = events.filter((e) => e.date === dateStr);
            const dayOfWeek = new Date(year, month, day).getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isToday = isCurrentMonth && day === today.getDate();

            return (
              <div
                key={day}
                className="card-hover"
                style={{
                  minHeight: 96, padding: 8, borderRadius: 10,
                  border: isToday ? '1.5px solid var(--primary)' : isWeekend ? '1px solid var(--border-light)' : '1px solid var(--border)',
                  backgroundColor: isToday ? '#F0FDF4' : isWeekend ? '#F8FAFC' : 'var(--bg-card)',
                  opacity: isWeekend ? 0.8 : 1,
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                  boxShadow: isToday ? '0 0 0 2px rgba(34,197,94,0.15)' : undefined
                }}
              >
                <div style={{ marginBottom: 6 }}>
                  {isToday ? (
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%',
                      backgroundColor: 'var(--primary)', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.72rem', fontWeight: 800
                    }}>{day}</span>
                  ) : (
                    <span style={{
                      fontSize: '0.78rem', fontWeight: 700,
                      color: isWeekend ? 'var(--text-muted)' : 'var(--text-primary)'
                    }}>{day}</span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {dayEvents.map((ev, i) => {
                    const style = getEventStyle(ev.type);
                    return (
                      <div key={i} title={ev.title} style={{
                        fontSize: '0.68rem', fontWeight: 600,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        padding: '2px 6px', borderRadius: 5, ...style
                      }}>
                        {ev.badge} {ev.title.split('—')[0]}
                      </div>
                    );
                  })}
                  {isToday && (
                    <div style={{
                      fontSize: '0.68rem', fontWeight: 700,
                      color: 'var(--success-text)', backgroundColor: 'var(--success-bg)',
                      border: '1px solid rgba(34,197,94,0.25)',
                      padding: '2px 6px', borderRadius: 5
                    }}>🟢 Aujourd'hui</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
