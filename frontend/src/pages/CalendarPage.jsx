import React, { useState, useEffect } from 'react';
import { API_URL } from '../context/AuthContext';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

export const CalendarPage = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_URL}/calendar/events`);
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
        }
      } catch {}
    };
    fetchEvents();
  }, []);

  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

  const getEventStyle = (type) => {
    switch (type) {
      case 'HOLIDAY':
        return {
          backgroundColor: '#F1F5F9',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border)'
        };
      case 'LEAVE':
        return {
          backgroundColor: 'var(--warning-bg)',
          color: 'var(--warning-text)',
          border: '1px solid rgba(245, 158, 11, 0.25)'
        };
      case 'PRESENT':
        return {
          backgroundColor: 'var(--success-bg)',
          color: 'var(--success-text)',
          border: '1px solid rgba(34, 197, 94, 0.25)'
        };
      case 'REMOTE':
        return {
          backgroundColor: 'var(--purple-bg)',
          color: 'var(--purple-text)',
          border: '1px solid rgba(139, 92, 246, 0.25)'
        };
      default:
        return {
          backgroundColor: '#F8FAFC',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)'
        };
    }
  };

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarDays size={22} style={{ color: 'var(--primary)' }} />
            <span>Calendrier d'Entreprise</span>
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
            Vue mensuelle des présences, congés, télétravail et jours fériés
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <span className="badge badge-success">🟢 Présent</span>
          <span className="badge badge-purple">🔵 Télétravail</span>
          <span className="badge badge-warning">🟡 Congé</span>
          <span className="badge badge-danger">🔴 Absent</span>
          <span className="badge badge-muted" style={{ border: '1px solid var(--border)' }}>⚪ Férié</span>
        </div>
      </div>

      {/* Calendar Header Control */}
      <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
            SEPTEMBRE 2026
          </h3>
          <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Mois en cours</span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn btn-outline btn-icon" title="Mois précédent">
            <ChevronLeft size={16} />
          </button>
          <button className="btn btn-outline btn-icon" title="Mois suivant">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Month Grid */}
      <div className="card" style={{ padding: '1.25rem', overflowX: 'auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(100px, 1fr))',
            gap: '8px',
            minWidth: '700px',
            textAlign: 'center',
            marginBottom: '10px',
            fontWeight: 700,
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          <div>Lun</div>
          <div>Mar</div>
          <div>Mer</div>
          <div>Jeu</div>
          <div>Ven</div>
          <div style={{ color: 'var(--text-muted)' }}>Sam</div>
          <div style={{ color: 'var(--text-muted)' }}>Dim</div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(100px, 1fr))',
            gap: '8px',
            minWidth: '700px'
          }}
        >
          {daysInMonth.map((day) => {
            const dateStr = `2026-09-${day.toString().padStart(2, '0')}`;
            const dayEvents = events.filter((e) => e.date === dateStr);
            const isWeekend = day % 7 === 6 || day % 7 === 0;
            const isToday = day === 19;

            return (
              <div
                key={day}
                className="card-hover"
                style={{
                  minHeight: '96px',
                  padding: '8px',
                  borderRadius: '10px',
                  border: isToday
                    ? '1.5px solid var(--primary)'
                    : isWeekend
                    ? '1px solid var(--border-light)'
                    : '1px solid var(--border)',
                  backgroundColor: isToday
                    ? '#F0FDF4'
                    : isWeekend
                    ? '#F8FAFC'
                    : 'var(--bg-card)',
                  opacity: isWeekend ? 0.8 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                  boxShadow: isToday ? '0 0 0 2px rgba(34, 197, 94, 0.15)' : undefined
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  {isToday ? (
                    <span
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.72rem',
                        fontWeight: 800
                      }}
                    >
                      {day}
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: isWeekend ? 'var(--text-muted)' : 'var(--text-primary)'
                      }}
                    >
                      {day}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {dayEvents.map((ev, idx) => {
                    const style = getEventStyle(ev.type);
                    return (
                      <div
                        key={idx}
                        title={ev.title}
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          padding: '2px 6px',
                          borderRadius: '5px',
                          ...style
                        }}
                      >
                        {ev.badge} {ev.title.split('—')[0]}
                      </div>
                    );
                  })}
                  {isToday && (
                    <div
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: 'var(--success-text)',
                        backgroundColor: 'var(--success-bg)',
                        border: '1px solid rgba(34, 197, 94, 0.25)',
                        padding: '2px 6px',
                        borderRadius: '5px'
                      }}
                    >
                      🟢 Aujourd'hui
                    </div>
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
