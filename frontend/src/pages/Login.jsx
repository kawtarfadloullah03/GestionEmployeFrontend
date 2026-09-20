import React, { useState } from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, User, Briefcase, ShieldCheck, CheckCircle } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const roleKey = Object.keys(DEMO_USERS).find(
      (key) => DEMO_USERS[key].user.email === email
    );
    if (roleKey && password === 'password123') {
      login(roleKey);
    } else {
      setError('Email ou mot de passe incorrect. Essayez les comptes démo ci-dessous.');
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
      <div className="login-left">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '3rem' }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', lineHeight: 1 }}>WorkFlow HR</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', marginTop: 2, letterSpacing: '0.05em' }}>ENTERPRISE SUITE</div>
          </div>
        </div>

        {/* Headline */}
        <div style={{ flex: 1 }}>
          <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '1.25rem' }}>
            Pilotez vos RH avec<br />
            <span style={{ color: 'var(--primary)' }}>clarté & efficacité</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            Plateforme tout-en-un pour la gestion des employés, des présences et des congés.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle style={{ color: 'var(--primary)', width: 16, height: 16, flexShrink: 0 }} />
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: '2rem' }}>
          © 2026 WorkFlow Enterprise Solutions
        </p>
      </div>

      {/* Right Panel - Login Form */}
      <div className="login-right">
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Mobile logo */}
          <div style={{ display: 'none', marginBottom: '2rem' }}>
            <span style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-primary)' }}>WorkFlow HR</span>
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            Connexion
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '2rem' }}>
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
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
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
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
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
              background: 'white', padding: '0 10px',
              color: 'var(--text-muted)', fontSize: '0.78rem'
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
                  onClick={() => login(demo.key)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: 'white',
                    border: '1.5px solid var(--border)', borderRadius: 10,
                    cursor: 'pointer', transition: 'all 0.15s ease',
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = demo.color; e.currentTarget.style.background = '#FAFAFA'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'white'; }}
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
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{demo.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 1 }}>{demo.label} · {demo.email}</div>
                    </div>
                  </div>
                  <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
