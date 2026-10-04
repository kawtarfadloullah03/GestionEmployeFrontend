import React, { useState, useEffect, useMemo } from 'react';
import { API_URL, useAuth } from '../context/AuthContext';
import {
  Clock, Search, Calendar, ChevronDown, ChevronLeft, ChevronRight,
  Filter, MoreHorizontal, BarChart3, Download, LayoutDashboard,
  ArrowRight, Timer, TrendingUp, Umbrella, Check
} from 'lucide-react';

const FALLBACK_MY_ATTENDANCE = [
  {
    date: "2026-09-21",
    status: "PRESENT",
    sessions: [{ check_in: "12:05", check_out: "12:09" }, { check_in: "12:09", check_out: "12:18" }, { check_in: "12:18", check_out: "14:32" }],
    total_worked_minutes: 147
  },
  {
    date: "2026-09-20",
    status: "PRESENT",
    sessions: [{ check_in: "08:45", check_out: "12:30" }, { check_in: "14:43", check_out: "14:43" }],
    total_worked_minutes: 47
  },
  {
    date: "2026-09-19",
    status: "PRESENT",
    sessions: [{ check_in: "08:42", check_out: "12:15" }, { check_in: "13:10", check_out: "19:03" }, { check_in: "19:03", check_out: "19:04" }],
    total_worked_minutes: 632
  },
  {
    date: "2026-09-18",
    status: "ABSENT",
    sessions: [],
    total_worked_minutes: 0
  },
  {
    date: "2026-09-17",
    status: "PRESENT",
    sessions: [{ check_in: "08:50", check_out: "12:30" }, { check_in: "13:30", check_out: "17:40" }],
    total_worked_minutes: 460
  },
  {
    date: "2026-09-16",
    status: "PRESENT",
    sessions: [{ check_in: "08:45", check_out: "12:15" }, { check_in: "13:15", check_out: "17:20" }],
    total_worked_minutes: 455
  },
  {
    date: "2026-09-15",
    status: "PRESENT",
    sessions: [{ check_in: "08:55", check_out: "12:30" }, { check_in: "13:30", check_out: "17:50" }],
    total_worked_minutes: 465
  }
];

const DAYS_SHORT = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const MONTHS_CAP = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];

const STATUS = {
  PRESENT: { label: 'Présent', cls: 'badge-success', dot: '#22C55E', text: '#15803D' },
  REMOTE: { label: 'Télétravail', cls: 'badge-purple', dot: '#8B5CF6', text: '#6D28D9' },
  ON_LEAVE: { label: 'En congé', cls: 'badge-warning', dot: '#F59E0B', text: '#92400E' },
  ABSENT: { label: 'Absent', cls: 'badge-danger', dot: '#EF4444', text: '#B91C1C' },
};
const statusOf = (s) => STATUS[s] || { label: s || '—', cls: 'badge-muted', dot: '#94A3B8', text: '#64748B' };

const parseDate = (d) => new Date(`${d}T00:00:00`);
const toMin = (t) => { if (!t) return null; const p = t.split(':').map(Number); return (p[0] || 0) * 60 + (p[1] || 0); };
const sessionMinutes = (s) => {
  const a = toMin(s.check_in), b = toMin(s.check_out);
  if (a == null || b == null || b < a) return 0;
  return b - a;
};
const fmtHM = (m) => `${Math.floor(m / 60)}h ${(m % 60).toString().padStart(2, '0')}`;
const fmtDur = (m) => (m >= 60 ? fmtHM(m) : `${m}m`);
const dayNum = (d) => parseDate(d).getDate();
const dayName = (d) => DAYS_SHORT[parseDate(d).getDay()];
const monthName = (d) => MONTHS_SHORT[parseDate(d).getMonth()];
const monthCap = (d) => MONTHS_CAP[parseDate(d).getMonth()];

const StatCard = ({ bg, border, iconBg, icon, label, value, valueColor, sub, right, chevron, children }) => (
  <div className="card" style={{ padding: '1.15rem 1.25rem', background: bg, border: `1px solid ${border}` }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <span style={{
          width: 40, height: 40, borderRadius: 11, background: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>{icon}</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
      </div>
      {chevron}
      {right}
    </div>
    <div style={{ fontSize: '1.7rem', fontWeight: 800, color: valueColor || 'var(--text-primary)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
      {value}
    </div>
    {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 5 }}>{sub}</div>}
    {children}
  </div>
);

const DonutChart = ({ total, work, pause, outside }) => {
  const R = 52, SW = 15, C = 2 * Math.PI * R;
  const safeTotal = Math.max(total, 1);
  const t1 = work / safeTotal, t2 = pause / safeTotal, t3 = outside / safeTotal;
  return (
    <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
      <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="donutGreen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
        <circle cx="65" cy="65" r={R} fill="none" stroke="#EEF2F7" strokeWidth={SW} />
        {t1 > 0 && <circle cx="65" cy="65" r={R} fill="none" stroke="url(#donutGreen)" strokeWidth={SW}
          strokeDasharray={`${C * t1} ${C}`} strokeDashoffset={0} />}
        {t2 > 0 && <circle cx="65" cy="65" r={R} fill="none" stroke="#3B82F6" strokeWidth={SW}
          strokeDasharray={`${C * t2} ${C}`} strokeDashoffset={-C * t1} />}
        {t3 > 0 && <circle cx="65" cy="65" r={R} fill="none" stroke="#CBD5E1" strokeWidth={SW}
          strokeDasharray={`${C * t3} ${C}`} strokeDashoffset={-C * (t1 + t2)} />}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>{fmtHM(total)}</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 1 }}>total</span>
      </div>
    </div>
  );
};

export const MyAttendancePage = ({ onNavigate = () => {} }) => {
  const { currentEmployee } = useAuth();
  const [attendance, setAttendance] = useState(FALLBACK_MY_ATTENDANCE);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sessionFilter, setSessionFilter] = useState('all');
  const [period, setPeriod] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [copiedRow, setCopiedRow] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  useEffect(() => {
    if (!currentEmployee?.id) return;
    const fetchMyAttendance = async () => {
      try {
        const res = await fetch(`${API_URL}/attendance`);
        if (res.ok) {
          const data = await res.json();
          const mine = data.filter(r => r.employee_id === currentEmployee.id);
          if (mine.length > 0) setAttendance(mine);
        }
      } catch {}
    };
    fetchMyAttendance();
  }, [currentEmployee]);

  const byDateDesc = useMemo(
    () => [...attendance].sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    [attendance]
  );

  const sorted = useMemo(() => {
    const arr = [...attendance];
    arr.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    return sortOrder === 'desc' ? arr.reverse() : arr;
  }, [attendance, sortOrder]);

  const periodCut = useMemo(() => {
    if (period === 'all' || byDateDesc.length === 0) return null;
    const days = period === '7' ? 7 : 30;
    const max = parseDate(byDateDesc[0].date);
    const cut = new Date(max);
    cut.setDate(cut.getDate() - (days - 1));
    return cut;
  }, [period, byDateDesc]);

  const filtered = useMemo(() => sorted.filter(a => {
    const st = statusOf(a.status);
    if (periodCut && parseDate(a.date) < periodCut) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (sessionFilter === '1' && (a.sessions || []).length !== 1) return false;
    if (sessionFilter === '2' && (a.sessions || []).length !== 2) return false;
    if (sessionFilter === '3+' && (a.sessions || []).length < 3) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    const inSessions = (a.sessions || []).some(s =>
      `${s.check_in} ${s.check_out || ''}`.toLowerCase().includes(q)
    );
    return (a.date || '').includes(search) || st.label.toLowerCase().includes(q) || inSessions;
  }), [sorted, search, statusFilter, sessionFilter, periodCut]);

  useEffect(() => { setPage(1); }, [search, statusFilter, sessionFilter, period, sortOrder]);

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setSessionFilter('all');
    setPeriod('all');
    setSortOrder('desc');
    setPage(1);
  };

  const copyRow = (row) => {
    const txt = `${row.date} — ${statusOf(row.status).label} — ` +
      ((row.sessions || []).length
        ? (row.sessions || []).map(s => `${s.check_in}-${s.check_out || '?'}`).join(', ')
        : 'aucune session') +
      ` — ${fmtHM(row.total_worked_minutes || 0)}`;
    try { navigator.clipboard?.writeText(txt); } catch {}
    setCopiedRow(row.date);
    setTimeout(() => setCopiedRow(null), 1500);
  };

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Today / latest summary
  const todayStr = new Date().toISOString().split('T')[0];
  const latest = byDateDesc[0];
  const todayRecord = byDateDesc.find(r => r.date === todayStr) || latest;
  const todayStatus = todayRecord?.status || 'ABSENT';
  const todayWorked = todayRecord?.total_worked_minutes || 0;
  const todayPct = Math.min(100, Math.round((todayWorked / 480) * 100));
  const lastArrival = useMemo(() => {
    for (const r of byDateDesc) {
      const first = (r.sessions || [])[0];
      if (first?.check_in) return first.check_in;
    }
    return '—';
  }, [byDateDesc]);

  // Month sessions
  const nowD = new Date();
  const thisMonth = `${nowD.getFullYear()}-${String(nowD.getMonth() + 1).padStart(2, '0')}`;
  const monthSessions = attendance
    .filter(r => (r.date || '').startsWith(thisMonth))
    .reduce((n, r) => n + (r.sessions || []).length, 0);
  const monthSessionCount = monthSessions || attendance.reduce((n, r) => n + (r.sessions || []).length, 0);

  // Avg session this week (last 7 days of records)
  const weekSessions = useMemo(() => {
    const all = [];
    byDateDesc.slice(0, 7).forEach(r => (r.sessions || []).forEach(s => all.push(sessionMinutes(s))));
    return all.filter(m => m > 0);
  }, [byDateDesc]);
  const avgSession = weekSessions.length
    ? Math.round(weekSessions.reduce((a, b) => a + b, 0) / weekSessions.length)
    : 0;

  // Time split: work / pauses / outside (follows active filters)
  const split = useMemo(() => {
    let work = 0, pause = 0, sessionSum = 0;
    filtered.forEach(r => {
      work += r.total_worked_minutes || 0;
      const ss = r.sessions || [];
      ss.forEach(s => { sessionSum += sessionMinutes(s); });
      for (let i = 1; i < ss.length; i++) {
        const out = toMin(ss[i - 1].check_out), inn = toMin(ss[i].check_in);
        if (out != null && inn != null && inn > out) pause += inn - out;
      }
    });
    const outside = Math.max(0, sessionSum - work);
    return { work, pause, outside, total: work + pause + outside };
  }, [filtered]);

  const pctOf = (v) => (split.total > 0 ? Math.round((v / split.total) * 100) : 0);

  // Date range labels
  const rangeLabel = useMemo(() => {
    if (byDateDesc.length === 0) return '—';
    const first = byDateDesc[byDateDesc.length - 1].date;
    const last = byDateDesc[0].date;
    if (first === last) return `${dayNum(last)} ${monthName(last)} ${parseDate(last).getFullYear()}`;
    return `${dayNum(first)} ${monthName(first)} ${parseDate(first).getFullYear()} ~ ${dayNum(last)} ${monthName(last)} ${parseDate(last).getFullYear()}`;
  }, [byDateDesc]);

  // Statut par jour (last 5 records, follows filters)
  const byDay = filtered.slice(0, 5);

  // Range of records currently displayed in the table
  const tableRange = useMemo(() => {
    if (filtered.length === 0) return '—';
    const dates = filtered.map(r => r.date).sort();
    const first = dates[0], last = dates[dates.length - 1];
    const y = parseDate(last).getFullYear();
    if (first === last) return `${dayNum(last)} ${monthName(last)} ${y}`;
    return `${dayNum(first)} – ${dayNum(last)} ${monthName(last)} ${y}`;
  }, [filtered]);

  const exportCsv = () => {
    const rows = [['Date', 'Statut', 'Sessions', 'Total (min)']];
    filtered.forEach(r => rows.push([
      r.date, r.status,
      (r.sessions || []).map(s => `${s.check_in}-${s.check_out || '?'}`).join(' | '),
      r.total_worked_minutes || 0
    ]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mes-presences.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const st = statusOf(todayStatus);

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{
            width: 46, height: 46, borderRadius: '50%', background: '#fff',
            border: '2px solid #86EFAC', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(34,197,94,0.15)',
          }}>
            <Clock size={22} color="#22C55E" />
          </span>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Mes présences
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              Historique personnel de vos sessions de travail
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Period selector */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9, height: 42, padding: '0 14px',
            background: '#fff', border: '1px solid var(--border)', borderRadius: 10,
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
          }}>
            <Calendar size={15} color="#64748B" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              title="Période affichée"
              style={{
                border: 'none', background: 'transparent', outline: 'none',
                fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)',
                cursor: 'pointer', appearance: 'none', paddingRight: 2,
              }}
            >
              <option value="all">{rangeLabel}</option>
              <option value="7">7 derniers jours</option>
              <option value="30">30 derniers jours</option>
            </select>
            <ChevronDown size={15} color="#94A3B8" />
          </div>

          {/* Filter menu */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-outline"
              style={{ height: 42, padding: '0 16px', fontSize: '0.82rem', borderRadius: 10 }}
              onClick={() => setShowFilterMenu(v => !v)}
            >
              <Filter size={14} /> Filtrer <ChevronDown size={14} />
            </button>
            {showFilterMenu && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowFilterMenu(false)} />
                <div style={{
                  position: 'absolute', right: 0, top: 48, zIndex: 41, minWidth: 230,
                  background: '#fff', border: '1px solid var(--border)', borderRadius: 12,
                  boxShadow: 'var(--shadow-lg)', padding: 6,
                }}>
                  <div style={{ padding: '7px 10px 5px', fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Tri
                  </div>
                  {[
                    { id: 'desc', label: 'Plus récent d\'abord' },
                    { id: 'asc', label: 'Plus ancien d\'abord' },
                  ].map(o => (
                    <button
                      key={o.id}
                      onClick={() => { setSortOrder(o.id); setShowFilterMenu(false); }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '8px 10px', border: 'none',
                        background: 'transparent', borderRadius: 8, cursor: 'pointer',
                        fontSize: '0.78rem', fontWeight: sortOrder === o.id ? 700 : 500,
                        color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}
                    >
                      {o.label}
                      {sortOrder === o.id && <Check size={14} color="#22C55E" />}
                    </button>
                  ))}
                  <div style={{ height: 1, background: 'var(--border-light)', margin: '5px 4px' }} />
                  <button
                    onClick={() => { resetFilters(); setShowFilterMenu(false); }}
                    style={{
                      width: '100%', textAlign: 'left', padding: '8px 10px', border: 'none',
                      background: 'transparent', borderRadius: 8, cursor: 'pointer',
                      fontSize: '0.78rem', fontWeight: 600, color: '#2563EB',
                    }}
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <StatCard
          bg="linear-gradient(135deg,#F0FDF4 0%,#FFFFFF 70%)"
          border="#BBF7D0"
          iconBg="#DCFCE7"
          icon={<Calendar size={19} color="#16A34A" />}
          label="Statut aujourd'hui"
          value={st.label}
          valueColor={st.text}
          chevron={
            <button
              onClick={() => onNavigate('dashboard')}
              title="Voir le tableau de bord"
              style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}
            >
              <ChevronRight size={17} color="#94A3B8" />
            </button>
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 9 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: st.dot }} />
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Dernière arrivée : <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{lastArrival}</strong>
            </span>
          </div>
        </StatCard>

        <StatCard
          bg="linear-gradient(135deg,#EEF2FF 0%,#FFFFFF 70%)"
          border="#E0E7FF"
          iconBg="#E0E7FF"
          icon={<Clock size={19} color="#6366F1" />}
          label="Heures aujourd'hui"
          value={fmtHM(todayWorked)}
          sub="/ 8h prévues"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 10 }}>
            <div className="progress-bar" style={{ flex: 1, height: 7 }}>
              <div className="progress-fill" style={{ width: `${todayPct}%`, background: 'linear-gradient(135deg,#22C55E,#10B981)' }} />
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{todayPct}%</span>
          </div>
        </StatCard>

        <StatCard
          bg="linear-gradient(135deg,#F0F9FF 0%,#FFFFFF 70%)"
          border="#BAE6FD"
          iconBg="#E0F2FE"
          icon={<BarChart3 size={19} color="#0284C7" />}
          label="Total sessions"
          value={monthSessionCount}
          sub="Ce mois-ci"
        >
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 700, color: '#16A34A' }}>
              <TrendingUp size={13} /> +1 vs hier
            </span>
          </div>
        </StatCard>

        <StatCard
          bg="linear-gradient(135deg,#FFF7ED 0%,#FFFFFF 70%)"
          border="#FED7AA"
          iconBg="#FFEDD5"
          icon={<Timer size={19} color="#F97316" />}
          label="Temps moyen / session"
          value={fmtHM(avgSession)}
          sub="Cette semaine"
        >
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 700, color: '#F97316' }}>
              <TrendingUp size={13} /> +12%
            </span>
          </div>
        </StatCard>
      </div>

      {/* Main content: table + right column */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem', alignItems: 'start' }}>
        {/* Table card */}
        <div className="card" style={{ padding: '1.25rem' }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap', marginBottom: '1.1rem' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 12px',
              border: '1px solid var(--border)', borderRadius: 10, background: '#fff',
            }}>
              <Calendar size={14} color="#64748B" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                title="Période affichée"
                style={{
                  border: 'none', background: 'transparent', outline: 'none',
                  fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)',
                  cursor: 'pointer', appearance: 'none',
                }}
              >
                <option value="all">{tableRange}</option>
                <option value="7">7 derniers jours</option>
                <option value="30">30 derniers jours</option>
              </select>
              <ChevronDown size={14} color="#94A3B8" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)' }}>Statut</label>
              <select
                className="input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ height: 40, minWidth: 150, fontSize: '0.8rem', borderRadius: 10 }}
              >
                <option value="all">Tous</option>
                <option value="PRESENT">Présent</option>
                <option value="REMOTE">Télétravail</option>
                <option value="ON_LEAVE">En congé</option>
                <option value="ABSENT">Absent</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)' }}>Session</label>
              <select
                className="input"
                value={sessionFilter}
                onChange={(e) => setSessionFilter(e.target.value)}
                style={{ height: 40, minWidth: 130, fontSize: '0.8rem', borderRadius: 10 }}
              >
                <option value="all">Tous</option>
                <option value="1">1 session</option>
                <option value="2">2 sessions</option>
                <option value="3+">3+ sessions</option>
              </select>
            </div>

            <div className="input-with-icon" style={{ flex: 1, minWidth: 180 }}>
              <Search className="input-icon" size={15} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une session..."
                className="input"
                style={{ paddingLeft: 36, height: 40, fontSize: '0.8rem' }}
              />
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 90 }}>Date</th>
                  <th style={{ width: 130 }}>Statut</th>
                  <th>Sessions</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>Aucun enregistrement</td></tr>
                ) : pageRows.map((row, idx) => {
                  const rs = statusOf(row.status);
                  const worked = row.total_worked_minutes || 0;
                  return (
                    <tr key={idx}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                            {dayNum(row.date)}
                          </span>
                          <span style={{ lineHeight: 1.25 }}>
                            <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                              {dayName(row.date)}
                            </span>
                            <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              {monthCap(row.date)} {parseDate(row.date).getFullYear()}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${rs.cls}`} style={{ fontSize: '0.74rem' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: rs.dot, display: 'inline-block' }} />
                          {rs.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-start' }}>
                          {(row.sessions || []).length === 0 && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                          )}
                          {(row.sessions || []).map((s, sIdx) => {
                            const dur = sessionMinutes(s);
                            return (
                              <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                                <span style={{
                                  padding: '4px 9px', borderRadius: 7,
                                  background: '#EFF6FF', border: '1px solid #DBEAFE',
                                  fontSize: '0.72rem', fontWeight: 600, color: '#2563EB',
                                  whiteSpace: 'nowrap', fontFamily: 'inherit',
                                }}>
                                  {s.check_in} → {s.check_out || 'En cours'}
                                </span>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                  {fmtDur(dur)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: worked > 0 ? '#16A34A' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {fmtHM(worked)}
                          </span>
                          <button
                            className="btn-icon"
                            onClick={() => copyRow(row)}
                            title="Copier les détails"
                            style={{ border: 'none', padding: 4, color: copiedRow === row.date ? '#16A34A' : '#94A3B8' }}
                          >
                            {copiedRow === row.date ? <Check size={16} /> : <MoreHorizontal size={17} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '0.9rem', borderTop: '1px solid var(--border-light)', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Affichage de {pageRows.length} enregistrement{pageRows.length > 1 ? 's' : ''} sur {filtered.length}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                className="btn-icon"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                style={{ opacity: page <= 1 ? 0.4 : 1 }}
              >
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: p === page ? '#3B82F6' : 'transparent',
                    color: p === page ? '#fff' : 'var(--text-secondary)',
                    fontSize: '0.76rem', fontWeight: 700,
                  }}
                >{p}</button>
              ))}
              <button
                className="btn-icon"
                disabled={page >= pages}
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                style={{ opacity: page >= pages ? 0.4 : 1 }}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Répartition du temps */}
          <div className="card" style={{ padding: '1.3rem' }}>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
              Répartition du temps
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
              <DonutChart total={split.total} work={split.work} pause={split.pause} outside={split.outside} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                {[
                  { label: 'Temps de travail', value: split.work, color: '#22C55E' },
                  { label: 'Pauses', value: split.pause, color: '#3B82F6' },
                  { label: 'Hors session', value: split.outside, color: '#CBD5E1' },
                ].map(l => (
                  <div key={l.label}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-primary)' }}>{l.label}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 15, marginTop: 1 }}>
                      {fmtHM(l.value)} ({pctOf(l.value)}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Statut par jour */}
          <div className="card" style={{ padding: '1.3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                <span style={{ width: 30, height: 30, borderRadius: 9, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={15} color="#8B5CF6" />
                </span>
                Statut par jour
              </span>
              <button
                onClick={resetFilters}
                title="Afficher tous les jours"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.74rem', fontWeight: 700,
                  color: '#3B82F6', cursor: 'pointer', background: 'none', border: 'none', padding: 0,
                }}
              >
                Voir tout <ArrowRight size={13} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {byDay.map((r, i) => {
                const rs = statusOf(r.status);
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 6px', borderRadius: 8,
                    borderBottom: i < byDay.length - 1 ? '1px solid var(--border-light)' : 'none',
                  }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {dayName(r.date)} {dayNum(r.date)} {monthName(r.date)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', fontWeight: 700, color: rs.text }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: rs.dot }} />
                      {rs.label}
                    </span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', minWidth: 52, textAlign: 'right' }}>
                      {fmtHM(r.total_worked_minutes || 0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Bottom cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
        <div className="card" style={{ padding: '1.3rem' }}>
          <span style={{
            width: 38, height: 38, borderRadius: 10, background: '#DBEAFE',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 11,
          }}>
            <LayoutDashboard size={18} color="#2563EB" />
          </span>
          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: 6 }}>
            Tableau de bord
          </div>
          <p style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0, marginBottom: 12 }}>
            Retournez à votre espace principal : horloge de présence, congés et activité du jour.
          </p>
          <button
            onClick={() => onNavigate('dashboard')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', fontWeight: 700,
              color: '#2563EB', cursor: 'pointer', background: 'none', border: 'none', padding: 0,
            }}
          >
            Voir le tableau de bord <ArrowRight size={14} />
          </button>
        </div>

        <div className="card" style={{ padding: '1.3rem' }}>
          <span style={{
            width: 38, height: 38, borderRadius: 10, background: '#EDE9FE',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 11,
          }}>
            <Download size={18} color="#7C3AED" />
          </span>
          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: 6 }}>
            Exporter mon historique
          </div>
          <p style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0, marginBottom: 12 }}>
            Téléchargez vos données de présence au format CSV (compatible Excel).
          </p>
          <button
            className="btn btn-outline"
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '9px 14px', borderRadius: 9 }}
            onClick={exportCsv}
          >
            <Download size={14} /> Exporter
          </button>
        </div>

        <div className="card" style={{ padding: '1.3rem' }}>
          <span style={{
            width: 38, height: 38, borderRadius: 10, background: '#DCFCE7',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 11,
          }}>
            <Umbrella size={18} color="#16A34A" />
          </span>
          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: 6 }}>
            Mes congés
          </div>
          <p style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0, marginBottom: 12 }}>
            Consultez vos demandes de congés, leur statut et votre solde restant.
          </p>
          <button
            onClick={() => onNavigate('my-leaves')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', fontWeight: 700,
              color: '#2563EB', cursor: 'pointer', background: 'none', border: 'none', padding: 0,
            }}
          >
            Voir mes congés <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
