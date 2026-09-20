import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { Users, Building2, ShieldCheck, Plus, FileSpreadsheet, ArrowUpRight, TrendingUp, Award } from 'lucide-react';

const topEmployees = [
  { name: 'Ahmed Ben Ali', hours: '42h 15m', pct: 95, color: '#22C55E' },
  { name: 'Thomas Dupont', hours: '40h 10m', pct: 89, color: '#22C55E' },
  { name: 'Lina Garcia', hours: '38h 50m', pct: 83, color: '#F59E0B' },
  { name: 'Julie Martin', hours: '37h 20m', pct: 79, color: '#F59E0B' },
  { name: 'Marc Leroy', hours: '32h 00m', pct: 61, color: '#EF4444' },
];

const AVATAR_COLORS = ['#22C55E', '#3B82F6', '#8B5CF6', '#F59E0B', '#06B6D4'];

export const HRDashboard = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [employeesCount, setEmployeesCount] = useState(6);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    const fetchHRStats = async () => {
      try {
        const resEmp = await fetch(`${API_URL}/employees`);
        if (resEmp.ok) setEmployeesCount((await resEmp.json()).length);
        const resAudit = await fetch(`${API_URL}/audit-logs`);
        if (resAudit.ok) setAuditLogs(await resAudit.json());
      } catch (e) { console.warn(e); }
    };
    fetchHRStats();
  }, []);

  const kpis = [
    { label: 'Effectif Total', value: employeesCount, sub: '+2 ce trimestre', trend: 'up', icon: Users, color: '#22C55E', bg: '#F0FDF4' },
    { label: 'Départements', value: 3, sub: 'IT · RH · Finance', trend: null, icon: Building2, color: '#3B82F6', bg: '#EFF6FF' },
    { label: 'Contrats CDI', value: '100%', sub: 'Tous actifs', trend: 'up', icon: Award, color: '#8B5CF6', bg: '#EDE9FE' },
    { label: "Logs d'Audit", value: auditLogs.length, sub: 'Traçabilité totale', trend: null, icon: ShieldCheck, color: '#F59E0B', bg: '#FFFBEB' },
  ];

  const departments = [
    { name: 'IT & Engineering', manager: 'Sarah Martin', count: 4, pct: 67 },
    { name: 'Ressources Humaines', manager: 'Marie Laurent', count: 1, pct: 17 },
    { name: 'Finance & Comptabilité', manager: 'Pierre Bernard', count: 2, pct: 33 },
  ];

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Administration RH 🛡️
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 3 }}>
            Bonjour {currentUser?.first_name} · Gouvernance du personnel en temps réel
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => onNavigate('reports')}>
            <FileSpreadsheet size={14} /> Exporter rapport
          </button>
          <button className="btn btn-primary" onClick={() => onNavigate('employees')}>
            <Plus size={14} /> Nouvel employé
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="card card-hover" style={{ padding: '1.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} style={{ color: k.color }} />
                </div>
                {k.trend === 'up' && (
                  <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>
                    <TrendingUp size={10} /> +2
                  </span>
                )}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{k.value}</div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>{k.label}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{k.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Main two-column */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

        {/* Top employees by hours */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              🏆 Top 5 · Heures travaillées
            </span>
            <button onClick={() => onNavigate('reports')} style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              Voir plus <ArrowUpRight size={13} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {topEmployees.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: AVATAR_COLORS[i], color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.68rem', flexShrink: 0
                }}>
                  {e.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', marginLeft: 8 }}>{e.hours}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${e.pct}%`, background: e.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building2 size={16} style={{ color: '#3B82F6' }} /> Départements
              </span>
              <button onClick={() => onNavigate('departments')} style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                Organigramme <ArrowUpRight size={13} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {departments.map((d, i) => (
                <div key={i} style={{ padding: '10px 12px', background: '#F8FAFC', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{d.name}</span>
                    <span className="badge badge-muted">{d.count} ETP</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 7 }}>
                    Manager: {d.manager}
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${d.pct}%`, background: 'var(--primary)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Logs */}
          <div className="card" style={{ padding: '1.25rem', flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 7 }}>
              <ShieldCheck size={16} style={{ color: '#F59E0B' }} /> Dernières actions
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
              {auditLogs.length === 0 ? (
                <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', padding: '1rem' }}>Aucune action enregistrée</div>
              ) : (
                auditLogs.map((log, i) => (
                  <div key={i} style={{ padding: '8px 10px', background: '#F8FAFC', borderRadius: 8, borderLeft: '3px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--primary)' }}>{log.action}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.date}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Par {log.by_user} · {log.entity}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
