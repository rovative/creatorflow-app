'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AIToolId, TOOL_LABELS, SavedGeneration, getGenerations, saveGeneration, deleteGeneration } from '@/lib/generations';
import { getActiveProfile, CreatorProfile } from '@/lib/profiles';

const TOOLS: { id: AIToolId; desc: string }[] = [
  { id: 'ideas', desc: '10 content ideas tailored to your niche and goal' },
  { id: 'hooks', desc: '15 scroll-stopping opening lines for your content' },
  { id: 'script', desc: 'Full short-form script with hook, body, and CTA' },
  { id: 'caption', desc: '5 captions with niche-specific hashtags' },
];

const TOOL_FIELDS: Record<AIToolId, { key: string; label: string; placeholder: string; required?: boolean; multiline?: boolean }[]> = {
  ideas: [
    { key: 'goal', label: 'Goal', placeholder: 'e.g. Get more followers, sell my course, go viral', multiline: false },
    { key: 'style', label: 'Content style', placeholder: 'e.g. Talking head, B-roll, carousel' },
    { key: 'struggle', label: 'Current struggle', placeholder: 'e.g. My videos get views but no followers' },
    { key: 'extra', label: 'Extra context', placeholder: 'Anything else the AI should know' },
  ],
  hooks: [
    { key: 'topic', label: 'Topic', placeholder: 'What is the content about?', required: true },
    { key: 'vibe', label: 'Vibe', placeholder: 'e.g. Bold and confrontational, soft and relatable' },
  ],
  script: [
    { key: 'topic', label: 'Topic', placeholder: 'What is the video about?', required: true },
    { key: 'length', label: 'Target length', placeholder: 'e.g. 30 seconds, 60 seconds, 3 minutes' },
    { key: 'notes', label: 'Style notes', placeholder: 'e.g. Start mid-action, no intro, use POV framing' },
  ],
  caption: [
    { key: 'topic', label: 'Post topic', placeholder: 'What is this post about?', required: true },
    { key: 'tone', label: 'Tone', placeholder: 'e.g. Funny, motivational, informative, casual' },
    { key: 'notes', label: 'Extra notes', placeholder: 'e.g. Include a question at the end, reference a trend' },
  ],
};

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function AIStudioPage() {
  const [activeTool, setActiveTool] = useState<AIToolId>('ideas');
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [vault, setVault] = useState<SavedGeneration[]>([]);
  const [vaultFilter, setVaultFilter] = useState<AIToolId | 'all'>('all');

  useEffect(() => {
    setProfile(getActiveProfile());
    setVault(getGenerations());
  }, []);

  function refreshVault() { setVault(getGenerations()); }

  function setInput(key: string, val: string) {
    setInputs(prev => ({ ...prev, [key]: val }));
  }

  function switchTool(id: AIToolId) {
    setActiveTool(id);
    setInputs({});
    setResult('');
    setError('');
    setCopied(false);
    setSaved(false);
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult('');
    setError('');
    setCopied(false);
    setSaved(false);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId: activeTool, inputs, profile }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? 'Something went wrong');
      else setResult(data.output ?? '');
    } catch {
      setError('Request failed. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSave() {
    saveGeneration({
      toolId: activeTool,
      toolLabel: TOOL_LABELS[activeTool],
      profileId: profile?.id ?? '',
      inputs,
      output: result,
    });
    setSaved(true);
    refreshVault();
  }

  function handleDeleteVault(id: string) {
    deleteGeneration(id);
    refreshVault();
  }

  const fields = TOOL_FIELDS[activeTool];
  const filteredVault = vaultFilter === 'all' ? vault : vault.filter(g => g.toolId === vaultFilter);

  return (
    <div style={{ padding: '40px 48px', maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5, marginBottom: 4 }}>AI Studio</h1>
        <p style={{ color: 'var(--text-sub)', fontSize: 15 }}>Generate content tailored to your exact niche and audience.</p>
      </div>

      {/* Profile context */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 18px', borderRadius: 12, marginBottom: 24,
        backgroundColor: profile ? 'rgba(34,197,94,0.06)' : 'var(--surface)',
        border: `1px solid ${profile ? 'rgba(34,197,94,0.25)' : 'var(--border)'}`,
      }}>
        {profile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{profile.emoji}</span>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{profile.name}</span>
              {profile.aiSummary && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1, lineHeight: 1.4 }}>{profile.aiSummary}</p>
              )}
            </div>
          </div>
        ) : (
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No profile selected — outputs will be generic</span>
        )}
        <Link href="/dashboard/profiles" style={{
          fontSize: 12, fontWeight: 700, color: 'var(--primary)',
          textDecoration: 'none', padding: '5px 12px', borderRadius: 7,
          border: '1px solid rgba(34,197,94,0.3)',
        }}>
          {profile ? 'Switch' : 'Set profile'}
        </Link>
      </div>

      {/* Tool tabs */}
      <div style={{
        display: 'flex', gap: 0,
        backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: 4, marginBottom: 28, width: 'fit-content',
      }}>
        {TOOLS.map(t => {
          const active = activeTool === t.id;
          return (
            <button key={t.id} onClick={() => switchTool(t.id)} style={{
              padding: '9px 20px', borderRadius: 9, fontSize: 14, fontWeight: active ? 700 : 500,
              border: 'none', cursor: 'pointer',
              backgroundColor: active ? 'var(--primary-alpha)' : 'transparent',
              color: active ? 'var(--primary)' : 'var(--text-muted)',
            }}>{TOOL_LABELS[t.id]}</button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'start' }}>

        {/* Form */}
        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            fontSize: 13, color: 'var(--text-muted)', marginBottom: 4,
            padding: '10px 14px', borderRadius: 8, backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
          }}>
            {TOOLS.find(t => t.id === activeTool)?.desc}
          </div>

          {fields.map(f => (
            <div key={f.key}>
              <label style={labelStyle}>
                {f.label}
                {f.required && <span style={{ color: 'var(--primary)', marginLeft: 4 }}>*</span>}
              </label>
              {f.multiline === false || !f.multiline ? (
                <input
                  type="text"
                  value={inputs[f.key] ?? ''}
                  onChange={e => setInput(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  required={f.required}
                  style={inputStyle}
                />
              ) : (
                <textarea
                  value={inputs[f.key] ?? ''}
                  onChange={e => setInput(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                />
              )}
            </div>
          ))}

          <button type="submit" disabled={loading} style={{
            backgroundColor: 'var(--primary)', color: '#000',
            padding: '13px', borderRadius: 10, fontSize: 14,
            fontWeight: 800, border: 'none', cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.7 : 1, marginTop: 4,
          }}>
            {loading ? 'Generating...' : `Generate ${TOOL_LABELS[activeTool]}`}
          </button>
        </form>

        {/* Result */}
        <div>
          {error && (
            <div style={{
              padding: '14px 18px', borderRadius: 12, marginBottom: 16,
              backgroundColor: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.25)',
              fontSize: 13, color: '#FF4757',
            }}>{error}</div>
          )}

          {result ? (
            <div style={{
              backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '20px',
            }}>
              <pre style={{
                fontSize: 13, color: 'var(--text)', lineHeight: 1.75,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
                fontFamily: 'inherit', marginBottom: 16,
              }}>{result}</pre>
              <div style={{ display: 'flex', gap: 8, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <button onClick={handleCopy} style={{
                  padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  border: '1px solid var(--border)', backgroundColor: 'transparent',
                  color: copied ? 'var(--primary)' : 'var(--text-sub)', cursor: 'pointer',
                }}>{copied ? 'Copied' : 'Copy'}</button>
                <button onClick={handleSave} disabled={saved} style={{
                  padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  border: `1px solid ${saved ? 'var(--border)' : 'var(--primary)'}`,
                  backgroundColor: saved ? 'transparent' : 'var(--primary-alpha)',
                  color: saved ? 'var(--text-muted)' : 'var(--primary)',
                  cursor: saved ? 'default' : 'pointer',
                }}>{saved ? 'Saved' : 'Save to vault'}</button>
              </div>
            </div>
          ) : !loading && (
            <div style={{
              backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '48px 24px', textAlign: 'center',
            }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                Fill in the form and click Generate to see results.
              </p>
            </div>
          )}

          {loading && (
            <div style={{
              backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '48px 24px', textAlign: 'center',
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', margin: '0 auto 12px',
                border: '2px solid var(--border)', borderTopColor: 'var(--primary)',
                animation: 'spin 0.7s linear infinite',
              }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Writing your content...</p>
            </div>
          )}
        </div>
      </div>

      {/* Vault */}
      {vault.length > 0 && (
        <div style={{ marginTop: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>Vault</h2>
            <div style={{ display: 'flex', gap: 4, backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 3 }}>
              {(['all', ...Object.keys(TOOL_LABELS)] as (AIToolId | 'all')[]).map(id => (
                <button key={id} onClick={() => setVaultFilter(id)} style={{
                  padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  backgroundColor: vaultFilter === id ? 'var(--primary-alpha)' : 'transparent',
                  color: vaultFilter === id ? 'var(--primary)' : 'var(--text-muted)',
                  textTransform: 'capitalize',
                }}>{id === 'all' ? 'All' : TOOL_LABELS[id as AIToolId]}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredVault.map(gen => (
              <div key={gen.id} style={{
                backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '16px 20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                      backgroundColor: 'var(--primary-alpha)', color: 'var(--primary)',
                    }}>{gen.toolLabel}</span>
                    {Object.entries(gen.inputs).filter(([, v]) => v).slice(0, 2).map(([k, v]) => (
                      <span key={k} style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {v.length > 30 ? v.slice(0, 30) + '…' : v}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatRelative(gen.createdAt)}</span>
                    <button onClick={() => { navigator.clipboard.writeText(gen.output); }} style={vaultBtnStyle}>Copy</button>
                    <button onClick={() => handleDeleteVault(gen.id)} style={{ ...vaultBtnStyle, color: '#FF4757' }}>Delete</button>
                  </div>
                </div>
                <pre style={{
                  fontSize: 12, color: 'var(--text-sub)', lineHeight: 1.6,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
                  fontFamily: 'inherit',
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 4, WebkitBoxOrient: 'vertical',
                }}>{gen.output}</pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-sub)',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 10, color: 'var(--text)', fontSize: 14, outline: 'none',
};
const vaultBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 12, fontWeight: 600, color: 'var(--text-sub)', padding: 0,
};
