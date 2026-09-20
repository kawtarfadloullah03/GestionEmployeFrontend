import React, { useState, useEffect } from 'react';
import { API_URL } from '../context/AuthContext';
import { BarChart3, FileSpreadsheet, Download, TrendingUp, Palmtree, Clock, Users, Search } from 'lucide-react';

export const ReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch(`${API_URL}/reports/summary`);
        if (res.ok) {
          const data = await res.json();
          setReportData(data);
        }
      } catch {}
    };
    fetchReports();
  }, []);

  const summaryList = reportData?.summary || [
    { employee_id: "EMP-00124", name: "Ahmed Ben Ali", department: "IT & Engineering", worked_hours: "158.3h", expected_hours: "160.0h", difference: "-1h40", allocated_leave: 25, used_leave: 12, remaining_leave: 13 },
    { employee_id: "EMP-00101", name: "Sarah Martin", department: "IT & Engineering", worked_hours: "165.1h", expected_hours: "160.0h", difference: "+5h10", allocated_leave: 25, used_leave: 8, remaining_leave: 17 },
    { employee_id: "EMP-00125", name: "Thomas Dupont", department: "IT & Engineering", worked_hours: "142.5h", expected_hours: "152.0h", difference: "-9h30", allocated_leave: 25, used_leave: 15, remaining_leave: 10 }
  ];

  const handleExportCSV = () => {
    const listToExport = reportData?.summary || summaryList;
    if (!listToExport || listToExport.length === 0) return;
    const headers = "ID,Salarié,Département,Heures Travaillées,Heures Attendues,Écart,Congés Consommés,Solde Restant\n";
    const rows = listToExport.map(s => 
      `"${s.employee_id}","${s.name}","${s.department}","${s.worked_hours}","${s.expected_hours}","${s.difference}","${s.used_leave}","${s.remaining_leave}"`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rapport_RH_Workflow_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalEmployees = summaryList.length;
  const totalWorkedHours = summaryList.reduce((acc, row) => acc + (parseFloat(row.worked_hours) || 0), 0).toFixed(1);
  const totalUsedLeave = summaryList.reduce((acc, row) => acc + (Number(row.used_leave) || 0), 0);
  const totalRemainingLeave = summaryList.reduce((acc, row) => acc + (Number(row.remaining_leave) || 0), 0);

  const kpis = [
    { label: 'Salariés suivis', value: totalEmployees, sub: 'Actifs dans les rapports', color: 'var(--primary)', bg: 'var(--primary-light)', icon: Users },
    { label: 'Volume heures cumulé', value: `${totalWorkedHours}h`, sub: 'Heures déclarées', color: '#3B82F6', bg: '#EFF6FF', icon: Clock },
    { label: 'Congés consommés', value: `${totalUsedLeave}j`, sub: 'Période en cours', color: '#F59E0B', bg: '#FEF3C7', icon: Palmtree },
    { label: 'Solde total restant', value: `${totalRemainingLeave}j`, sub: 'Droits à solder', color: '#8B5CF6', bg: '#EDE9FE', icon: FileSpreadsheet },
  ];

  const absenceData = reportData?.charts?.absences?.map(a => ({
    month: a.month,
    value: Math.min(100, Math.max(15, (a.absences / 12) * 100)),
    absences: a.absences
  })) || [
    { month: 'Jan', value: 40, absences: 4 },
    { month: 'Fév', value: 20, absences: 2 },
    { month: 'Mar', value: 50, absences: 5 },
    { month: 'Avr', value: 30, absences: 3 },
    { month: 'Mai', value: 60, absences: 6 },
    { month: 'Juin', value: 20, absences: 2 },
    { month: 'Juil', value: 80, absences: 8 },
    { month: 'Août', value: 100, absences: 12 },
    { month: 'Sep', value: 30, absences: 3 },
  ];

  const leaveTypes = [
    { name: 'Congés Annuels', pct: '45%', days: '112 jours', color: 'var(--primary)' },
    { name: 'RTT', pct: '25%', days: '62 jours', color: '#3B82F6' },
    { name: 'Congés Maladie', pct: '15%', days: '37 jours', color: '#EF4444' },
    { name: 'Télétravail', pct: '15%', days: '37 jours', color: '#8B5CF6' },
  ];

  const filteredList = summaryList.filter(s =>
    (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.employee_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={22} style={{ color: 'var(--primary)' }} />
            <span>Rapports & Analytics RH</span>
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 3 }}>
            Analyse du volume d'heures travaillées, écarts d'horaires et bilans des congés
          </p>
        </div>

        <button 
          onClick={handleExportCSV}
          className="btn btn-primary"
        >
          <Download size={15} />
          <span>Exporter CSV / Excel</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="card card-hover" style={{ padding: '1.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{k.label}</span>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} style={{ color: k.color }} />
                </div>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{k.value}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{k.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Visual Chart Bars & Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
        {/* Absences by month */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>
                  Absences par mois (T3 2026)
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Volume mensuel des jours d'absence
                </span>
              </div>
            </div>
            <span className="badge badge-success">Moyenne: 4.8j</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 160, paddingTop: '1rem', gap: 8 }}>
            {absenceData.map((item) => (
              <div key={item.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
                <div 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    background: '#F1F5F9', 
                    borderRadius: '6px 6px 0 0', 
                    display: 'flex', 
                    alignItems: 'flex-end', 
                    overflow: 'hidden'
                  }}
                >
                  <div 
                    title={`${item.month}: ${item.absences || item.value} jours d'absence`}
                    style={{ 
                      width: '100%', 
                      height: `${item.value}%`, 
                      background: 'var(--primary)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease, background 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-dark)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
                  />
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{item.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Type Breakdown */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Palmtree size={16} style={{ color: '#8B5CF6' }} />
              </div>
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>
                  Répartition des motifs de congés
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Total: 248 jours cumulés sur l'année
                </span>
              </div>
            </div>
            <span className="badge badge-purple">4 catégories</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.25rem' }}>
            {leaveTypes.map((item) => (
              <div key={item.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</span>
                  <span style={{ fontWeight: 700, color: item.color, fontSize: '0.78rem' }}>
                    {item.pct} ({item.days})
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: item.pct, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attendance & Leave Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileSpreadsheet size={18} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              Rapport Récapitulatif Heures & Congés par Salarié
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="input-with-icon" style={{ width: 240 }}>
              <Search className="input-icon" size={14} />
              <input
                type="text"
                className="input"
                style={{ paddingLeft: 34, paddingTop: 6, paddingBottom: 6, fontSize: '0.8rem' }}
                placeholder="Rechercher par nom, service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <span className="badge badge-muted">{filteredList.length} salarié(s)</span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Salarié</th>
                <th>Département</th>
                <th>Heures Effectuées</th>
                <th>Heures Attendues</th>
                <th>Écart Horaire</th>
                <th>Congés Alloués</th>
                <th>Consommés</th>
                <th>Solde Restant</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Aucun résultat trouvé pour "{searchTerm}"
                  </td>
                </tr>
              ) : (
                filteredList.map((row, idx) => {
                  const isPositive = row.difference && row.difference.startsWith('+');
                  return (
                    <tr key={idx}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{row.employee_id}</div>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{row.department}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>{row.worked_hours}</span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{row.expected_hours}</span>
                      </td>
                      <td>
                        <span className={`badge ${isPositive ? 'badge-success' : 'badge-danger'}`} style={{ fontFamily: 'monospace' }}>
                          {row.difference}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-secondary)' }}>{row.allocated_leave}j</span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--warning-text)', fontWeight: 600 }}>{row.used_leave}j</span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{row.remaining_leave}j</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
