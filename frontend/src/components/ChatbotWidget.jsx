import React, { useState, useRef, useEffect } from 'react';
import { apiFetch, API_URL } from '../context/AuthContext';
import { Bot, MessageSquarePlus, Send, X } from 'lucide-react';

const GREETING = {
  role: 'assistant',
  content: "Bonjour 👋 Je suis l'assistant RH de WorkFlow HR. Posez-moi une question sur les congés, le pointage ou les employés.",
};

const SUGGESTIONS = [
  'Comment pointer ?',
  'Quels types de demandes de congé sont proposés ?',
  'Où consulter mon solde et demander un congé ?',
];

const FAB_SIZE = 54;
const FAB_MARGIN = 26;
const PANEL_W = 370;
const PANEL_H = 520;
const PANEL_GAP = 12;
const POS_KEY = 'workflowhr.chatFabPos';

const clampPos = (p) => ({
  x: Math.max(0, Math.min(p.x, window.innerWidth - FAB_SIZE)),
  y: Math.max(0, Math.min(p.y, window.innerHeight - FAB_SIZE)),
});

const defaultPos = () => ({
  x: window.innerWidth - FAB_MARGIN - FAB_SIZE,
  y: window.innerHeight - FAB_MARGIN - FAB_SIZE,
});

const loadSavedPos = () => {
  try {
    const p = JSON.parse(localStorage.getItem(POS_KEY) || 'null');
    if (p && typeof p.x === 'number' && typeof p.y === 'number') return clampPos(p);
  } catch {
    /* corrupted value, fall back to default */
  }
  return defaultPos();
};

export const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pos, setPos] = useState(loadSavedPos);
  const [dragging, setDragging] = useState(false);
  const [viewport, setViewport] = useState({
    w: typeof window !== 'undefined' ? window.innerWidth : 1440,
    h: typeof window !== 'undefined' ? window.innerHeight : 900,
  });
  const bodyRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    const onResize = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
      setPos(p => (p ? clampPos(p) : p));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, loading, open]);

  const handlePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
      moved: false,
    };
  };

  const handlePointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) < 5) return;
    d.moved = true;
    setDragging(true);
    setPos(clampPos({ x: d.origX + dx, y: d.origY + dy }));
  };

  const handlePointerUp = (e) => {
    const d = dragRef.current;
    dragRef.current = null;
    setDragging(false);
    if (!d) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
    if (d.moved) {
      localStorage.setItem(POS_KEY, JSON.stringify(pos));
    } else {
      setOpen(o => !o);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(o => !o);
    }
  };

  const startNewChat = () => {
    if (loading) return;
    setMessages([GREETING]);
    setInput('');
  };

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const history = messages.filter(m => m !== GREETING);
    const next = [...history, { role: 'user', content }];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const res = await apiFetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, history }),
      });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        if (res.status === 401) throw new Error('Votre session a expiré. Reconnectez-vous pour continuer.');
        throw new Error(errorBody.detail || `Le service RH a répondu avec le statut ${res.status}.`);
      }
      const data = await res.json();
      setMessages([...next, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      setMessages([...next, {
        role: 'assistant',
        content: error?.message || "Désolé, l'assistant est momentanément indisponible. Réessayez dans un instant.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Anchor the panel next to the button (above it, or below if no room)
  const panelH = Math.min(PANEL_H, viewport.h - 130);
  const panelLeft = Math.min(
    Math.max(pos.x + FAB_SIZE - PANEL_W, 12),
    Math.max(12, viewport.w - PANEL_W - 12),
  );
  const panelFitsAbove = pos.y - panelH - PANEL_GAP > 8;
  const panelTop = panelFitsAbove
    ? pos.y - panelH - PANEL_GAP
    : Math.min(pos.y + FAB_SIZE + PANEL_GAP, Math.max(8, viewport.h - panelH - 8));

  return (
    <>
      {/* Floating trigger button - draggable */}
      <button
        className={`chat-fab${dragging ? ' chat-fab-dragging' : ''}`}
        style={{ left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        title="Assistant RH (glissez pour déplacer)"
        aria-label="Ouvrir l'assistant RH"
      >
        {open ? <X size={22} /> : <Bot size={23} />}
      </button>

      {open && (
        <div
          className="chat-panel animate-in"
          style={{ left: panelLeft, top: panelTop, right: 'auto', bottom: 'auto', height: panelH }}
        >
          {/* Header */}
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #22C55E, #10B981)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(34,197,94,0.35)'
              }}>
                <Bot size={19} color="white" />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Assistant RH</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-icon" onClick={startNewChat} disabled={loading} title="Nouvelle conversation" aria-label="Démarrer une nouvelle conversation" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)' }}>
                <MessageSquarePlus size={16} />
              </button>
              <button className="btn-icon" onClick={() => setOpen(false)} aria-label="Fermer l’assistant" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)' }}>
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-body" ref={bodyRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chat-row ${m.role === 'user' ? 'chat-row-user' : ''}`}>
                <div className={`chat-bubble ${m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-row">
                <div className="chat-bubble chat-bubble-bot chat-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 14px 10px' }}>
              {SUGGESTIONS.map(s => (
                <button key={s} className="chat-chip" onClick={() => send(s)} disabled={loading}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            className="chat-footer"
            onSubmit={(e) => { e.preventDefault(); send(); }}
          >
            <input
              className="input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Posez votre question..."
              disabled={loading}
              style={{ flex: 1, height: 40, fontSize: '0.82rem', background: 'var(--bg-app)' }}
            />
            <button
              type="submit"
              className="chat-send"
              disabled={loading || !input.trim()}
              aria-label="Envoyer"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
