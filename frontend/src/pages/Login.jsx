import React, { useState } from 'react';
import { apiFetch, useAuth, DEMO_USERS, API_URL } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, User, Briefcase, ShieldCheck, CheckCircle } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await apiFetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Identifiants invalides.');
      const role = data.user?.role;
      if (!role || !DEMO_USERS[role] || !login(role, data.token, data.user)) {
        throw new Error('Le serveur a retourné un profil de connexion invalide.');
      }
    } catch (err) {
      setError(err.message || 'Impossible de joindre le service de connexion.');
    }
  };

  const handleDemoLogin = async (roleKey) => {
    setError('');
    try {
      const demoUser = DEMO_USERS[roleKey]?.user;
      const res = await apiFetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoUser.email, password: 'password123' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Connexion de démonstration refusée.');
      if (!login(roleKey, data.token, data.user)) throw new Error('Profil de démonstration invalide.');
    } catch (err) {
      setError(err.message || 'Impossible de joindre le service de connexion.');
    }
  };

  const features = [
    'Gestion des présences & pointages',
    'Demandes et approbations de congés',
    'Rapports RH en temps réel',
    'Organigramme interactif',
  ];

  return (
    <div className="login-page">
      <div className="login-overlay" />
      {/* Left Panel - Branding */}
      <div className="login-left" style={{ alignItems: 'center' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: '1.3rem', lineHeight: 1 }}>WorkFlow HR</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', marginTop: 3, letterSpacing: '0.08em' }}>ENTERPRISE SUITE</div>
          </div>
        </div>

        {/* Headline — centered vertically + horizontally */}
        <div style={{
          flex: 1, width: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <h1 style={{ color: 'white', fontSize: '3rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '1.5rem', maxWidth: 640 }}>
            Pilotez vos RH avec<br />
            <span style={{ color: 'var(--primary)' }}>clarté & efficacité</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.15rem', lineHeight: 1.6, marginBottom: '2.5rem', maxWidth: 560, textAlign: 'center' }}>
            Plateforme tout-en-un pour la gestion des employés, des présences et des congés.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle style={{ color: 'var(--primary)', width: 20, height: 20, flexShrink: 0 }} />
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.05rem' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', marginTop: '2rem' }}>
          © 2026 WorkFlow Enterprise Solutions
        </p>
      </div>

      {/* Right Panel - Login Form */}
      <div className="login-right">
        <div className="login-card">
          {/* Mobile logo */}
          <div style={{ display: 'none', marginBottom: '2rem' }}>
            <span style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-primary)' }}>WorkFlow HR</span>
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem' }}>
            Connexion
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginBottom: '2rem' }}>
            Entrez vos identifiants pour accéder à votre espace.
          </p>

          {/* Error */}
          {error && (
            <div style={{
              background: 'var(--danger-bg)', color: 'var(--danger-text)',
              padding: '10px 14px', borderRadius: 8,
              fontSize: '0.8rem', marginBottom: '1rem',
              border: '1px solid #FCA5A5'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
            {/* Email field */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>
                Adresse email
              </label>
              <div className="input-with-icon">
                <Mail className="input-icon" />
                <input
                  type="email"
                  className="input"
                  style={{ paddingLeft: 38 }}
                  placeholder="nom@entreprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>
                  Mot de passe
                </label>
                <a href="#" style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 500, textDecoration: 'none' }}>
                  Mot de passe oublié ?
                </a>
              </div>
              <div className="input-with-icon">
                <Lock className="input-icon" />
                <input
                  type="password"
                  className="input"
                  style={{ paddingLeft: 38 }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '11px 16px', fontSize: '0.9rem' }}>
              Se connecter <ArrowRight size={16} />
            </button>
          </form>

          {/* Divider */}
          <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
            <hr className="divider" />
            <span style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(15,23,42,0.8)', padding: '0 10px',
              color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem'
            }}>Connexion rapide (démo)</span>
          </div>

          {/* Quick Demo Logins */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { key: 'EMPLOYEE', label: 'Salarié', name: 'Ahmed Ben Ali', email: 'ahmed@company.com', icon: User, color: '#3B82F6', bg: '#DBEAFE' },
              { key: 'MANAGER', label: 'Manager', name: 'Sarah Martin', email: 'sarah@company.com', icon: Briefcase, color: '#22C55E', bg: '#DCFCE7' },
              { key: 'HR', label: 'RH / Admin', name: 'Marie Laurent', email: 'marie@company.com', icon: ShieldCheck, color: '#8B5CF6', bg: '#EDE9FE' },
            ].map((demo) => {
              const Icon = demo.icon;
              return (
                <button
                  key={demo.key}
                  onClick={() => handleDemoLogin(demo.key)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: 'rgba(255,255,255,0.08)',
                    border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 10,
                    cursor: 'pointer', transition: 'all 0.15s ease',
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = demo.color; e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 8,
                      background: demo.bg, color: demo.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <Icon size={16} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>{demo.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>{demo.label} · {demo.email}</div>
                    </div>
                  </div>
                  <ArrowRight size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
