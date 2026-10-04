import React, { useState, useEffect } from 'react';
import { API_URL } from '../context/AuthContext';
import { Users, Search, Plus, Mail, Phone, MapPin, X, Building2, Calendar, Award, ShieldCheck, CheckCircle2, ChevronRight, FileSpreadsheet } from 'lucide-react';

const FALLBACK_EMPLOYEES = [
  {
    id: "EMP-00124",
    first_name: "Ahmed",
    last_name: "Ben Ali",
    email: "ahmed@company.com",
    phone: "+33 6 12 34 56 78",
    address: "14 Rue de la Paix, Paris",
    birth_date: "1995-06-15",
    department_id: "dept_it",
    department_name: "IT & Engineering",
    position: "Software Engineer",
    manager_name: "Sarah Martin",
    hire_date: "2024-03-12",
    contract_type: "CDI",
    status: "ACTIVE",
    leave_balance: 18,
    allocated_leave: 25,
    used_leave: 7,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "EMP-00101",
    first_name: "Sarah",
    last_name: "Martin",
    email: "sarah@company.com",
    phone: "+33 6 98 76 54 32",
    address: "8 Avenue des Champs-Élysées, Paris",
    birth_date: "1988-11-20",
    department_id: "dept_it",
    department_name: "IT & Engineering",
    position: "Engineering Lead",
    manager_name: "Direction Générale",
    hire_date: "2021-01-15",
    contract_type: "CDI",
    status: "ACTIVE",
    leave_balance: 17,
    allocated_leave: 25,
    used_leave: 8,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "EMP-00100",
    first_name: "Marie",
    last_name: "Laurent",
    email: "marie@company.com",
    phone: "+33 6 45 67 89 01",
    address: "22 Boulevard Haussmann, Paris",
    birth_date: "1985-04-10",
    department_id: "dept_rh",
    department_name: "Ressources Humaines",
    position: "Directrice RH",
    manager_name: "Direction Générale",
    hire_date: "2019-09-01",
    contract_type: "CDI",
    status: "ACTIVE",
    leave_balance: 20,
    allocated_leave: 25,
    used_leave: 5,
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "EMP-00125",
    first_name: "Thomas",
    last_name: "Dupont",
    email: "thomas@company.com",
    phone: "+33 6 11 22 33 44",
    address: "5 Rue Lafayette, Paris",
    birth_date: "1997-02-28",
    department_id: "dept_it",
    department_name: "IT & Engineering",
    position: "Frontend Developer",
    manager_name: "Sarah Martin",
    hire_date: "2023-05-10",
    contract_type: "CDI",
    status: "ACTIVE",
    leave_balance: 10,
    allocated_leave: 25,
    used_leave: 15,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "EMP-00126",
    first_name: "Lina",
    last_name: "Garcia",
    email: "lina@company.com",
    phone: "+33 6 55 44 33 22",
    address: "12 Rue de Rivoli, Paris",
    birth_date: "1994-08-14",
    department_id: "dept_it",
    department_name: "IT & Engineering",
    position: "UX/UI Designer",
    manager_name: "Sarah Martin",
    hire_date: "2022-10-01",
    contract_type: "CDI",
    status: "ACTIVE",
    leave_balance: 14,
    allocated_leave: 25,
    used_leave: 11,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "EMP-00130",
    first_name: "Pierre",
    last_name: "Bernard",
    email: "pierre@company.com",
    phone: "+33 6 77 88 99 00",
    address: "33 Avenue de l'Opéra, Paris",
    birth_date: "1990-12-05",
    department_id: "dept_finance",
    department_name: "Finance & Comptabilité",
    position: "Directeur Financier",
    manager_name: "Direction Générale",
    hire_date: "2020-04-01",
    contract_type: "CDI",
    status: "ACTIVE",
    leave_balance: 22,
    allocated_leave: 25,
    used_leave: 3,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
  }
];

const AVATAR_COLORS = ['#22C55E', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];

function getInitials(first, last) {
  return `${(first || '?')[0]}${(last || '?')[0]}`.toUpperCase();
}

export const EmployeesPage = () => {
  const [employees, setEmployees] = useState(FALLBACK_EMPLOYEES);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState('info');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    department_id: 'dept_it', position: '', manager_name: 'Sarah Martin', contract_type: 'CDI'
  });

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_URL}/employees`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setEmployees(data);
        }
      }
    } catch (e) {
      console.warn("Using offline fallback employees:", e);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const newEmp = {
      ...formData,
      id: `EMP-${Math.floor(10000 + Math.random() * 90000)}`,
      department_name: formData.department_id === 'dept_it' ? 'IT & Engineering' : formData.department_id === 'dept_rh' ? 'Ressources Humaines' : 'Finance & Comptabilité',
      status: 'ACTIVE',
      leave_balance: 25,
      allocated_leave: 25,
      used_leave: 0,
      hire_date: new Date().toISOString().split('T')[0]
    };
    try {
      const res = await fetch(`${API_URL}/employees`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        fetchEmployees();
      } else {
        setEmployees(prev => [newEmp, ...prev]);
      }
    } catch {
      setEmployees(prev => [newEmp, ...prev]);
    }
    setIsAddModalOpen(false);
  };

  const filtered = employees.filter(e => {
    const matchesSearch =
      `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      (e.position || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.department_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.id || '').toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || e.department_id === selectedDept;
    return matchesSearch && matchesDept;
  });

  const totalCDI = employees.filter(e => e.contract_type === 'CDI').length;

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
            <Users size={22} style={{ color: 'var(--primary)' }} /> Annuaire des Collaborateurs
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 3 }}>
            Gestion centralisée des fiches du personnel, coordonnées et contrats
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={15} /> Nouveau collaborateur
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Effectif Actif', value: employees.length, sub: 'Salariés répertoriés', icon: Users, color: 'var(--primary)', bg: '#F0FDF4' },
          { label: 'Départements', value: 3, sub: 'Pôles opérationnels', icon: Building2, color: '#3B82F6', bg: '#EFF6FF' },
          { label: 'Taux CDI', value: `${Math.round((totalCDI / (employees.length || 1)) * 100)}%`, sub: `${totalCDI} contrats stables`, icon: Award, color: '#8B5CF6', bg: '#EDE9FE' },
          { label: 'Disponibilité', value: '100%', sub: 'Dossiers conformes', icon: ShieldCheck, color: '#F59E0B', bg: '#FFFBEB' },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: kpi.bg, color: kpi.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={20} />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{kpi.value}</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>{kpi.label}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{kpi.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="input-with-icon" style={{ maxWidth: 360, width: '100%' }}>
          <Search className="input-icon" size={15} />
          <input
            type="text"
            className="input"
            style={{ paddingLeft: 38 }}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, poste, matricule..."
          />
        </div>

        {/* Department Pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'Tous' },
            { id: 'dept_it', label: 'IT & Dev' },
            { id: 'dept_rh', label: 'Ressources Humaines' },
            { id: 'dept_finance', label: 'Finance' }
          ].map(dept => (
            <button
              key={dept.id}
              onClick={() => setSelectedDept(dept.id)}
              className={`btn btn-sm ${selectedDept === dept.id ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.75rem', borderRadius: 20, padding: '5px 14px' }}
            >
              {dept.label}
            </button>
          ))}
        </div>
      </div>

      {/* Employee Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.15rem' }}>
        {filtered.map((emp, i) => (
          <div
            key={emp.id}
            className="card card-hover"
            onClick={() => { setSelectedEmp(emp); setActiveDrawerTab('info'); }}
            style={{
              padding: '1.25rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                {emp.avatar ? (
                  <img
                    src={emp.avatar}
                    alt=""
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      objectFit: 'cover',
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}
                  />
                ) : (
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                    background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                    color: 'white', fontWeight: 700, fontSize: '1.1rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    {getInitials(emp.first_name, emp.last_name)}
                  </div>
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.96rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {emp.first_name} {emp.last_name}
                    </div>
                    <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                      Actif
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginTop: 2 }}>{emp.position}</div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', background: 'var(--bg-app)', padding: '2px 8px', borderRadius: 6, display: 'inline-block', marginTop: 4, border: '1px solid var(--border-light)' }}>
                    {emp.department_name}
                  </span>
                </div>
              </div>

              {/* Data Rows */}
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Matricule</span>
                  <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{emp.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Contrat</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{emp.contract_type || 'CDI'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Solde Congés</span>
                  <span style={{ fontWeight: 700, color: '#3B82F6' }}>{emp.leave_balance ?? 18} jours restants</span>
                </div>
              </div>
            </div>

            {/* Bottom action trigger */}
            <div style={{
              marginTop: 12,
              paddingTop: 8,
              borderTop: '1px dashed var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.74rem',
              color: 'var(--primary)',
              fontWeight: 600
            }}>
              <span>Consulter dossier</span>
              <ChevronRight size={14} />
            </div>
          </div>
        ))}
      </div>

      {/* Employee Detail Drawer */}
      {selectedEmp && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            justifyContent: 'flex-end',
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={() => setSelectedEmp(null)}
        >
          <div
            style={{
              width: 440,
              maxWidth: '90vw',
              background: 'white',
              height: '100%',
              padding: '1.75rem',
              overflowY: 'auto',
              boxShadow: '-8px 0 32px rgba(0,0,0,0.18)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>Dossier Collaborateur</span>
              <button className="btn-icon" onClick={() => setSelectedEmp(null)}>
                <X size={16} />
              </button>
            </div>

            {/* Profile Avatar Card */}
            <div style={{
              textAlign: 'center',
              padding: '1.5rem',
              borderRadius: 14,
              background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
              border: '1px solid var(--border)'
            }}>
              {selectedEmp.avatar ? (
                <img
                  src={selectedEmp.avatar}
                  alt=""
                  style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 12px', display: 'block', border: '3px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
                />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--primary)', color: 'white', fontWeight: 800, fontSize: '1.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}>
                  {getInitials(selectedEmp.first_name, selectedEmp.last_name)}
                </div>
              )}
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                {selectedEmp.first_name} {selectedEmp.last_name}
              </div>
              <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem', marginTop: 3 }}>
                {selectedEmp.position}
              </div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10 }}>
                <span className="badge badge-success">Actif</span>
                <span className="badge badge-muted" style={{ fontFamily: 'monospace' }}>{selectedEmp.id}</span>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
              {[
                { key: 'info', label: 'Coordonnées & Poste' },
                { key: 'leaves', label: 'Soldes & Droits' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveDrawerTab(tab.key)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: 'none',
                    background: 'none',
                    fontWeight: activeDrawerTab === tab.key ? 700 : 500,
                    fontSize: '0.82rem',
                    color: activeDrawerTab === tab.key ? 'var(--primary)' : 'var(--text-secondary)',
                    borderBottom: activeDrawerTab === tab.key ? '2px solid var(--primary)' : '2px solid transparent',
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeDrawerTab === 'info' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Coordonnées</div>
                  {[
                    { icon: Mail, label: selectedEmp.email },
                    { icon: Phone, label: selectedEmp.phone || '+33 6 12 34 56 78' },
                    { icon: MapPin, label: selectedEmp.address || 'Paris, France' },
                  ].map(({ icon: Icon, label }, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                      <Icon size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{label}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Données Contractuelles</div>
                  {[
                    { label: 'Département', value: selectedEmp.department_name },
                    { label: 'Manager Référent', value: selectedEmp.manager_name },
                    { label: "Date d'embauche", value: selectedEmp.hire_date || '2023-01-15' },
                    { label: 'Type de contrat', value: selectedEmp.contract_type || 'CDI', color: 'var(--primary)' },
                  ].map((row, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: '#F8FAFC', borderRadius: 8, marginBottom: 5 }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{row.label}</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: row.color || 'var(--text-primary)' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ padding: '1.25rem', background: '#F0FDF4', borderRadius: 12, border: '1px solid #86EFAC', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
                    {selectedEmp.leave_balance ?? 18}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    Jours de congés payés restants sur {selectedEmp.allocated_leave ?? 25}j
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { label: 'Congés utilisés', value: `${selectedEmp.used_leave ?? 7} jours`, color: 'var(--warning-text)' },
                    { label: 'RTT restants', value: '4 jours', color: 'var(--primary)' },
                    { label: 'Télétravail autorisé', value: '2 jours / semaine', color: '#3B82F6' },
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#F8FAFC', borderRadius: 8 }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: item.color }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-panel animate-in">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F0FDF4', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={18} />
                </div>
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>Nouveau Collaborateur</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Création de fiche salarié et calcul des droits</p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setIsAddModalOpen(false)}><X size={16} /></button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleCreate}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Prénom</label>
                    <input type="text" className="input" placeholder="ex: Karim" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Nom</label>
                    <input type="text" className="input" placeholder="ex: Mansouri" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} required />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Email professionnel</label>
                  <input type="email" className="input" placeholder="nom@entreprise.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Téléphone</label>
                    <input type="text" className="input" placeholder="+33 6 12 34 56 78" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Intitulé du poste</label>
                    <input type="text" className="input" placeholder="ex: Développeur React" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Département</label>
                    <select className="input" value={formData.department_id} onChange={e => setFormData({...formData, department_id: e.target.value})}>
                      <option value="dept_it">IT & Engineering</option>
                      <option value="dept_rh">Ressources Humaines</option>
                      <option value="dept_finance">Finance & Comptabilité</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Type de Contrat</label>
                    <select className="input" value={formData.contract_type} onChange={e => setFormData({...formData, contract_type: e.target.value})}>
                      <option value="CDI">CDI</option>
                      <option value="CDD">CDD</option>
                      <option value="Alternance">Alternance</option>
                      <option value="Stage">Stage</option>
                    </select>
                  </div>
                </div>

                <div className="modal-footer" style={{ padding: 0, borderTop: 'none', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button type="button" className="btn btn-outline" onClick={() => setIsAddModalOpen(false)}>Annuler</button>
                  <button type="submit" className="btn btn-primary">Enregistrer le collaborateur</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
