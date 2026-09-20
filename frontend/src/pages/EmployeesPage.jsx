import React, { useState, useEffect } from 'react';
import { API_URL } from '../context/AuthContext';
import { Users, Search, Plus, Mail, Phone, MapPin, X } from 'lucide-react';

const AVATAR_COLORS = ['#22C55E', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];

function getInitials(first, last) {
  return `${(first || '?')[0]}${(last || '?')[0]}`.toUpperCase();
}

export const EmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    department_id: 'dept_it', position: '', manager_name: 'Sarah Martin', contract_type: 'CDI'
  });

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_URL}/employees`);
      if (res.ok) setEmployees(await res.json());
    } catch {}
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/employees`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) { fetchEmployees(); setIsAddModalOpen(false); }
    } catch {}
  };

  const filtered = employees.filter(e =>
    `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    (e.position || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.department_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={22} style={{ color: 'var(--primary)' }} /> Gestion des Salariés
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 3 }}>
            {employees.length} employé(s) dans la base
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={15} /> Ajouter un salarié
        </button>
      </div>

      {/* Search */}
      <div className="input-with-icon" style={{ maxWidth: 380 }}>
        <Search className="input-icon" size={15} />
        <input
          type="text"
          className="input"
          style={{ paddingLeft: 36 }}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom, poste, département..."
        />
      </div>

      {/* Employee Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {filtered.map((emp, i) => (
          <div
            key={emp.id}
            className="card card-hover"
            onClick={() => setSelectedEmp(emp)}
            style={{ padding: '1.25rem', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
              {emp.avatar ? (
                <img src={emp.avatar} alt="" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{
                  width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                  background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                  color: 'white', fontWeight: 700, fontSize: '1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {getInitials(emp.first_name, emp.last_name)}
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {emp.first_name} {emp.last_name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginTop: 2 }}>{emp.position}</div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', background: '#F1F5F9', padding: '2px 8px', borderRadius: 4, display: 'inline-block', marginTop: 4 }}>
                  {emp.department_name}
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'Matricule', value: emp.id, mono: true },
                { label: 'Contrat', value: emp.contract_type, color: 'var(--primary)' },
                { label: 'Congés restants', value: `${emp.leave_balance} j`, color: '#3B82F6' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                  <span style={{ fontWeight: 700, fontFamily: row.mono ? 'monospace' : 'inherit', color: row.color || 'var(--text-primary)' }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Employee Detail Drawer */}
      {selectedEmp && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 420, background: 'white', height: '100%', padding: '1.5rem', overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>Fiche employé</span>
              <button className="btn-icon" onClick={() => setSelectedEmp(null)}><X size={16} /></button>
            </div>

            <div style={{ textAlign: 'center', paddingBottom: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
              {selectedEmp.avatar ? (
                <img src={selectedEmp.avatar} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 12px', display: 'block' }} />
              ) : (
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  {getInitials(selectedEmp.first_name, selectedEmp.last_name)}
                </div>
              )}
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{selectedEmp.first_name} {selectedEmp.last_name}</div>
              <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem', marginTop: 4 }}>{selectedEmp.position}</div>
              <span className="badge badge-success" style={{ marginTop: 8 }}>● Actif</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Contact */}
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Contact</div>
                {[
                  { icon: Mail, label: selectedEmp.email },
                  { icon: Phone, label: selectedEmp.phone || '—' },
                  { icon: MapPin, label: selectedEmp.address || '—' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <Icon size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Profil professionnel */}
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Profil professionnel</div>
                {[
                  { label: 'Matricule', value: selectedEmp.id, mono: true },
                  { label: 'Département', value: selectedEmp.department_name },
                  { label: 'Manager', value: selectedEmp.manager_name },
                  { label: "Date d'embauche", value: selectedEmp.hire_date || '—' },
                  { label: 'Contrat', value: selectedEmp.contract_type, color: 'var(--primary)' },
                  { label: 'Congés restants', value: `${selectedEmp.leave_balance} jours`, color: '#3B82F6' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#F8FAFC', borderRadius: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{row.label}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, fontFamily: row.mono ? 'monospace' : 'inherit', color: row.color || 'var(--text-primary)' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-panel animate-in">
            <div className="modal-header">
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>Nouveau dossier salarié</div>
              <button className="btn-icon" onClick={() => setIsAddModalOpen(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreate}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Prénom</label>
                    <input type="text" className="input" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Nom</label>
                    <input type="text" className="input" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} required />
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Email professionnel</label>
                  <input type="email" className="input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Téléphone</label>
                    <input type="text" className="input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Poste</label>
                    <input type="text" className="input" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} required />
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
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Contrat</label>
                    <select className="input" value={formData.contract_type} onChange={e => setFormData({...formData, contract_type: e.target.value})}>
                      <option value="CDI">CDI</option>
                      <option value="CDD">CDD</option>
                      <option value="Alternance">Alternance</option>
                      <option value="Stage">Stage</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer" style={{ padding: '0', borderTop: 'none' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setIsAddModalOpen(false)}>Annuler</button>
                  <button type="submit" className="btn btn-primary">Créer le dossier</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
