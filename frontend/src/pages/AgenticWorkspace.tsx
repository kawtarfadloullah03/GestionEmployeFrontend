import React, { useCallback, useEffect, useState } from 'react';
import { Activity, BookOpen, CheckCircle2, History, Play, Search, ShieldCheck, Workflow } from 'lucide-react';
import { API_URL, apiFetch } from '../context/AuthContext';

const API_BASE = API_URL.replace(/\/api\/?$/, '');
const card = { background: 'var(--bg-card, #111827)', border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 20, marginBottom: 18 };
const button = { border: 0, borderRadius: 9, padding: '10px 14px', color: 'white', background: '#2563eb', cursor: 'pointer', fontWeight: 600 };

type WorkflowPlan = { name: string; description?: string; version: number; steps: Array<Record<string, unknown>> };
type PlanResponse = { plan: WorkflowPlan; is_valid: boolean; errors: string[]; warnings: string[]; execution_order: string[]; planner_source?: string; data_source?: string };
type RunRecord = { run_id: string; plan_name: string; plan_version: number; status: string };
type RunResponse = RunRecord & { results: Record<string, unknown>; was_executed: boolean };
type ToolInfo = { name: string; description: string; supports_dry_run: boolean };
type RagSource = { doc_id: string; title: string; source: string; score: number; snippet: string };
type RagResponse = { answer: string; confidence_score: number; retrieved_context: RagSource[] };
type SavedVersion = { id: number; name: string; version: number };

const errorText = (error: unknown): string => error instanceof Error ? error.message : 'Une erreur inattendue est survenue.';

export const AgenticWorkspace = () => {
  const [prompt, setPrompt] = useState('Analyse les rémunérations publiques agrégées de la Ville de Norfolk et calcule le salaire annuel moyen pondéré par le nombre d’employés');
  const [plan, setPlan] = useState<WorkflowPlan | null>(null);
  const [planReport, setPlanReport] = useState<PlanResponse | null>(null);
  const [preview, setPreview] = useState<unknown>(null);
  const [run, setRun] = useState<RunResponse | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [history, setHistory] = useState<RunRecord[]>([]);
  const [versions, setVersions] = useState<SavedVersion[]>([]);
  const [replayParameters, setReplayParameters] = useState('{}');
  const [question, setQuestion] = useState('Quelle est la source du jeu public de rémunérations et quelles sont ses limites ?');
  const [answer, setAnswer] = useState<RagResponse | null>(null);
  const [tools, setTools] = useState<ToolInfo[]>([]);
  const [toolsLoading, setToolsLoading] = useState(true);
  const [toolsError, setToolsError] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const request = useCallback(async <T,>(path: string, body?: unknown): Promise<T> => {
    const response = await apiFetch(`${API_BASE}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => ({})) as T & { detail?: string };
    if (response.status === 401) throw new Error('Votre session a expiré. Reconnectez-vous.');
    if (!response.ok) throw new Error(data.detail || `Erreur API ${response.status}`);
    return data;
  }, []);

  const refreshHistory = useCallback(async () => {
    const data = await request<{ runs: RunRecord[] }>('/workflows/runs');
    setHistory(data.runs || []);
  }, [request]);

  const refreshTools = useCallback(async () => {
    setToolsLoading(true);
    setToolsError('');
    try {
      const data = await request<{ tools: ToolInfo[] }>('/mcp/tools');
      setTools(data.tools || []);
    } catch (e) {
      setToolsError(errorText(e));
      setTools([]);
    } finally {
      setToolsLoading(false);
    }
  }, [request]);

  useEffect(() => {
    void refreshTools();
    refreshHistory().catch(e => setError(e.message));
  }, [refreshTools, refreshHistory]);

  const planWorkflow = async () => {
    setBusy(true); setError(''); setPreview(null); setRun(null);
    try { const data = await request<PlanResponse>('/workflows/plan', { prompt }); setPlan(data.plan); setPlanReport(data); setIdempotencyKey(crypto.randomUUID()); }
    catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  };
  const previewWorkflow = async () => {
    if (!plan) return;
    setBusy(true); setError(''); setNotice('');
    try { setPreview(await request<unknown>('/workflows/dry-run', plan)); }
    catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  };
  const saveWorkflow = async () => {
    if (!plan) return;
    setBusy(true); setError('');
    try {
      const saved = await request<{ name: string; version: number }>('/workflows/save', plan);
      setPlan(current => current ? { ...current, version: saved.version } : current);
      setNotice(`Plan ${saved.name}, version ${saved.version}, sauvegardé.`);
      const versionData = await request<{ versions: SavedVersion[] }>(`/workflows/${encodeURIComponent(saved.name)}/versions`);
      setVersions(versionData.versions || []);
    } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  };
  const executeWorkflow = async () => {
    if (!plan) return;
    setBusy(true); setError(''); setNotice('');
    try {
      setRun(await request<RunResponse>('/workflows/runs', { plan, idempotency_key: idempotencyKey, parameters: {} }));
      const data = await request<{ runs: RunRecord[] }>('/workflows/runs'); setHistory(data.runs || []);
    } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  };
  const replay = async runId => {
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await request<{ new_run_id: string }>(`/workflows/runs/${runId}/replay`, { parameters: JSON.parse(replayParameters || '{}') as Record<string, Record<string, unknown>> });
      setNotice(`Rejeu créé : ${result.new_run_id}`);
      const data = await request<{ runs: RunRecord[] }>('/workflows/runs'); setHistory(data.runs || []);
    } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  };
  const askRag = async () => {
    setBusy(true); setError('');
    try { setAnswer(await request<RagResponse>('/rag/query', { question, top_k: 4 })); }
    catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  };

  return <div>
    <header style={{ marginBottom: 22 }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Workflow /> Workflows RH agentiques</h1>
      <p>Le modèle propose un plan ; validation, simulation et exécution restent contrôlées par le backend.</p>
    </header>
    {error && <div role="alert" style={{ ...card, background: '#fef2f2', borderColor: '#ef4444', color: '#991b1b' }}>{error}</div>}
    {notice && <div role="status" style={{ ...card, borderColor: '#22c55e' }}>{notice}</div>}
    <section style={card}>
      <h2>1. Décrire une demande RH</h2>
      <p>Jeu public réel et agrégé de la Ville de Norfolk (États-Unis), montants USD. Les fiches RH locales sont des données synthétiques de démonstration et ne sont pas utilisées dans cette analyse.</p>
      <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} style={{ width: '100%', padding: 12, borderRadius: 8, margin: '8px 0 12px' }} />
      <button style={button} disabled={busy} onClick={planWorkflow}>{busy ? 'Traitement…' : 'Générer le plan'}</button>
    </section>
    {plan && <section style={card}>
      <h2>Plan structuré</h2><pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{JSON.stringify(plan, null, 2)}</pre>
      {planReport && <div role="status"><strong>Validation : {planReport.is_valid ? 'valide' : 'invalide'}</strong><p>Ordre : {(planReport.execution_order || []).join(' → ')}</p>{planReport.planner_source && <p>Planificateur : {planReport.planner_source}</p>}{planReport.data_source && <p>Source : {planReport.data_source}</p>}{(planReport.errors || []).map((item, index) => <p key={`error-${index}`} style={{ color: '#ef4444' }}>{item}</p>)}{(planReport.warnings || []).map((item, index) => <p key={`warning-${index}`}>{item}</p>)}</div>}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button style={{ ...button, background: '#a16207' }} disabled={busy || planReport?.is_valid === false} onClick={previewWorkflow}><ShieldCheck size={16} /> Prévisualiser (dry-run)</button>
        <button style={{ ...button, background: '#475569' }} disabled={busy || planReport?.is_valid === false} onClick={saveWorkflow}>Sauvegarder une version</button>
        <button style={{ ...button, background: '#15803d' }} disabled={busy || planReport?.is_valid === false} onClick={executeWorkflow}><Play size={16} /> Exécuter et tracer</button>
      </div>
    </section>}
    {preview !== null && <section style={card}><h2><ShieldCheck /> Résultat dry-run</h2><pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(preview, null, 2)}</pre></section>}
    {run && <section style={card}><h2><CheckCircle2 /> Exécution persistée : {run.status}</h2><pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(run, null, 2)}</pre></section>}
    <section style={card}><h2><History /> Versions des plans ({versions.length})</h2>{versions.map(version => <div key={version.id || `${version.name}-${version.version}`}>{version.name} · v{version.version}</div>)}</section>
    <section style={card}><h2><History /> Historique et rejeu ({history.length})</h2><label>Paramètres à remplacer au rejeu (JSON par identifiant d'étape)<textarea value={replayParameters} onChange={e => setReplayParameters(e.target.value)} rows={2} style={{ display: 'block', width: '100%', padding: 10, margin: '8px 0' }} placeholder={'{"step_2":{"bonus_pct":8}}'} /></label>{history.map(item => <div key={item.run_id} style={{ padding: 10, borderTop: '1px solid rgba(148,163,184,.2)' }}><strong>{item.plan_name}</strong> · {item.status} · v{item.plan_version} <button style={{ ...button, background: '#475569' }} disabled={busy} onClick={() => replay(item.run_id)}>Rejouer</button></div>)}</section>
    <section style={card}>
      <h2><BookOpen /> Assistant documentaire RH et données publiques</h2>
      <p>La base contient une référence publique de rémunérations de Norfolk et les limites des données synthétiques locales. Elle ne contient pas de règlement interne RH officiel ni de droit français.</p>
      <textarea value={question} onChange={e => setQuestion(e.target.value)} rows={2} style={{ width: '100%', padding: 12, borderRadius: 8, margin: '8px 0 12px' }} />
      <button style={button} disabled={busy} onClick={askRag}><Search size={16} /> Interroger le RAG</button>
      {answer && <div style={{ marginTop: 14 }}><p>{answer.answer}</p><p>Score de pertinence : {answer.confidence_score}</p><ul>{(answer.retrieved_context || []).map(source => <li key={source.doc_id}>{source.title} — {source.source} ({source.score})<br />{source.snippet}</li>)}</ul></div>}
    </section>
    <section style={card}>
      <h2><Activity /> Outils MCP découverts{!toolsLoading && !toolsError ? ` (${tools.length})` : ''}</h2>
      {toolsLoading ? <p role="status">Connexion au serveur MCP et découverte des outils…</p> : toolsError ? <div role="alert" style={{ color: '#991b1b' }}>{toolsError} <button style={{ ...button, marginLeft: 8 }} onClick={refreshTools}>Réessayer</button></div> : tools.length === 0 ? <p>Aucun outil n’est actuellement exposé par le serveur MCP.</p> : <ul>{tools.map(tool => <li key={tool.name}><strong>{tool.name}</strong> — {tool.description} {tool.supports_dry_run && <span>(dry-run)</span>}</li>)}</ul>}
      {!toolsLoading && <button style={{ ...button, background: '#475569' }} onClick={refreshTools}>Actualiser le catalogue</button>}
    </section>
  </div>;
};
