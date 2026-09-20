import React, { useState, useEffect } from 'react';
import { API_URL } from '../context/AuthContext';
import { Building2, Crown, Users, Search } from 'lucide-react';

const AVATAR_COLORS = ['#22C55E', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];

function getInitials(first, last) {
  return `${(first || '?')[0]}${(last || '?')[0]}`.toUpperCase();
}

export const DepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await fetch(`${API_URL}/departments`);
        if (res.ok) {
          const data = await res.json();
          setDepartments(data);
        }
      } catch {}
    };
    fetchDepts();
  }, []);

  const totalMembers = departments.reduce((acc, d) => acc + (d.members?.length || 0), 0);

  const filtered = departments.filter((d) => {
    const q = search.toLowerCase();
    const nameMatch = (d.name || '').toLowerCase().includes(q);
    const codeMatch = (d.code || '').toLowerCase().includes(q);
    const memberMatch = (d.members || []).some(
      (m) =>
        `${m.first_name} ${m.last_name}`.toLowerCase().includes(q) ||
        (m.position || '').toLowerCase().includes(q)
    );
    return nameMatch || codeMatch || memberMatch;
  });

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
            <Building2 size={22} style={{ color: 'var(--primary)' }} /> Organigramme & Départements
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 3 }}>
            Structure hiérarchique et répartition des équipes d'entreprise
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.1rem', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <Building2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{departments.length}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: 2 }}>Pôles & Départements</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Unités organisationnelles</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.1rem', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--info-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--info)' }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{totalMembers}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: 2 }}>Collaborateurs affectés</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Répartis dans les équipes</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.1rem', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
            <Crown size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{departments.length}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: 2 }}>Responsables de pôle</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Encadrement hiérarchique</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="input-with-icon" style={{ maxWidth: 380, width: '100%' }}>
          <Search className="input-icon" size={15} />
          <input
            type="text"
            className="input"
            style={{ paddingLeft: 36 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher département, collaborateur, poste..."
          />
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {filtered.length} département{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Department Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {filtered.map((dept) => {
          const manager = (dept.members || []).find((m) => m.id === dept.manager_id);
          const managerName = manager
            ? `${manager.first_name} ${manager.last_name}`
            : (dept.code === 'IT' ? 'Sarah Martin' : dept.code === 'RH' ? 'Marie Laurent' : dept.code === 'FIN' ? 'Pierre Bernard' : 'Sarah Martin / Marie Laurent');
          const managerRole = manager?.position || 'Manager de Département';

          return (
            <div
              key={dept.id}
              className="card card-hover"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.25rem',
                borderTop: `4px solid ${dept.color || 'var(--primary)'}`
              }}
            >
              <div>
                {/* Department Card Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.25rem',
                    paddingBottom: '0.85rem',
                    borderBottom: '1px solid var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: dept.color || 'var(--primary)',
                        boxShadow: `0 0 0 3px ${dept.color ? `${dept.color}25` : 'rgba(34,197,94,0.15)'}`,
                        flexShrink: 0
                      }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <h3
                        style={{
                          fontWeight: 800,
                          fontSize: '1.05rem',
                          color: 'var(--text-primary)',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {dept.name}
                      </h3>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Identifiant : {dept.id}
                      </div>
                    </div>
                  </div>
                  <span className="badge badge-purple" style={{ fontWeight: 700, flexShrink: 0 }}>
                    {dept.code}
                  </span>
                </div>

                {/* Department Hierarchy / Tree */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Manager Node */}
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: '#FEF3C7',
                        border: '1px solid #FCD34D',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Crown size={18} style={{ color: '#D97706' }} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {managerName}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#B45309', fontWeight: 600 }}>
                        {managerRole}
                      </div>
                    </div>
                    <span className="badge badge-warning" style={{ fontSize: '0.68rem', padding: '2px 7px' }}>
                      Lead
                    </span>
                  </div>

                  {/* Team Tree List */}
                  <div
                    style={{
                      paddingLeft: 12,
                      borderLeft: '2px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      marginBottom: '1rem'
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        marginBottom: 2
                      }}
                    >
                      Membres rattachés ({(dept.members || []).length}) :
                    </div>

                    {(dept.members || []).length === 0 ? (
                      <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.78rem', padding: '6px 0' }}>
                        Chargement des membres...
                      </div>
                    ) : (
                      dept.members.map((m, mIdx) => (
                        <div
                          key={m.id || mIdx}
                          style={{
                            padding: '7px 10px',
                            borderRadius: 8,
                            background: '#F8FAFC',
                            border: '1px solid var(--border-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                            {m.avatar ? (
                              <img
                                src={m.avatar}
                                alt={`${m.first_name} ${m.last_name}`}
                                style={{ width: 26, height: 26, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: 6,
                                  background: AVATAR_COLORS[mIdx % AVATAR_COLORS.length],
                                  color: 'white',
                                  fontWeight: 700,
                                  fontSize: '0.68rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}
                              >
                                {getInitials(m.first_name, m.last_name)}
                              </div>
                            )}
                            <span
                              style={{
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {m.first_name} {m.last_name}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                            {m.position}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Department Card Footer */}
              <div
                style={{
                  paddingTop: 12,
                  borderTop: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={14} style={{ color: 'var(--text-muted)' }} /> Effectif
                </span>
                <span style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>
                  {(dept.members || []).length} collaborateur{(dept.members || []).length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
