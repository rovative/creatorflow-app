'use client';

import { useState, useEffect } from 'react';
import { getActiveProfile, CreatorProfile } from '@/lib/profiles';
import { getTopics, addTopic, removeTopic, getSavedIdeas, saveIdea, deleteSavedIdea, OpportunityCard } from '@/lib/research';

type Mode = 'brainstorm' | 'research';

export default function ResearchPage() {
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [savedIdeas, setSavedIdeas] = useState<OpportunityCard[]>([]);
  const [cards, setCards] = useState<OpportunityCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getActiveProfile().then(setProfile);
    setTopics(getTopics());
    setSavedIdeas(getSavedIdeas());
  }, []);

  function refreshSaved() {
    setSavedIdeas(getSavedIdeas());
  }

  async function generate(mode: Mode, topic?: string) {
    setLoading(true);
    setError('');
    setCards([]);
    setSavedIds(new Set());

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, topic: topic ?? null, mode }),
      });
      const data = await res.json();
      if (res.status === 403) { setError('upgrade_required'); return; }
      if (!res.ok) { setError(data.error ?? 'Something went wrong'); return; }
      setCards(data.cards ?? []);
    } catch {
      setError('Request failed. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  function handleAddTopic() {
    const t = topicInput.trim();
    if (!t) return;
    addTopic(t);
    setTopics(getTopics());
    setTopicInput('');
  }

  function handleRemoveTopic(t: string) {
    removeTopic(t);
    setTopics(getTopics());
    if (activeTopic === t) setActiveTopic(null);
  }

  function handleTopicClick(t: string) {
    setActiveTopic(t);
    generate('research', t);
  }

  function handleSaveIdea(card: OpportunityCard) {
    saveIdea({
      opportunity: card.opportunity,
      whyItWorks: card.whyItWorks,
      contentIdea: card.contentIdea,
      hook: card.hook,
      angle: card.angle,
      platform: card.platform,
    });
    setSavedIds(prev => new Set(prev).add(card.opportunity));
    refreshSaved();
  }

  function handleDeleteSaved(id: string) {
    deleteSavedIdea(id);
    refreshSaved();
  }

  function handleSchedule(card: OpportunityCard) {
    const params = new URLSearchParams({
      idea: card.contentIdea,
      hook: card.hook,
      notes: card.angle,
    });
    window.location.href = `/dashboard/schedule?${params.toString()}`;
  }

  return (
    <div style={{ padding: '40px 48px', maxWidth: 860, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5, marginBottom: 4 }}>Research</h1>
        <p style={{ color: 'var(--text-sub)', fontSize: 15 }}>Find content opportunities tailored to your audience.</p>
      </div>

      {/* Coming soon banner */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '14px 18px', borderRadius: 12, marginBottom: 28,
        backgroundColor: 'rgba(255,176,32,0.06)',
        border: '1px solid rgba(255,176,32,0.25)',
      }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>🔬</span>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#FFB020', marginBottom: 2 }}>Live Trend Research — Coming Soon</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            We&apos;re building real-time trend detection across TikTok, Instagram, and YouTube. For now, Research uses your creator profile and AI to generate content opportunities specific to your niche.
          </p>
        </div>
      </div>

      {/* No profile warning */}
      {!profile && (
        <div style={{
          padding: '14px 18px', borderRadius: 12, marginBottom: 28,
          backgroundColor: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.25)',
          fontSize: 13, color: '#FF4757',
        }}>
          No profile set — <a href="/dashboard/profiles" style={{ color: '#FF4757', fontWeight: 700 }}>create a profile</a> for personalised results.
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        <button
          onClick={() => { setActiveTopic(null); generate('brainstorm'); }}
          disabled={loading}
          style={{
            padding: '11px 22px', borderRadius: 10, fontSize: 14, fontWeight: 700,
            border: '1px solid var(--border)', backgroundColor: 'var(--surface)',
            color: 'var(--text)', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1,
          }}
        >
          💡 Brainstorm Ideas
        </button>
        <button
          onClick={() => { setActiveTopic(null); generate('research'); }}
          disabled={loading}
          style={{
            padding: '11px 22px', borderRadius: 10, fontSize: 14, fontWeight: 800,
            border: 'none', backgroundColor: 'var(--primary)', color: '#000',
            cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1,
            boxShadow: '0 0 20px rgba(34,197,94,0.2)',
          }}
        >
          🔍 Refresh Research
        </button>
      </div>

      {/* My Topics */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>My Research Topics</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {topics.length === 0 && (
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No topics yet — add one below</span>
          )}
          {topics.map(t => (
            <div key={t} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 100,
              backgroundColor: activeTopic === t ? 'var(--primary-alpha)' : 'var(--surface)',
              border: `1px solid ${activeTopic === t ? 'rgba(34,197,94,0.4)' : 'var(--border)'}`,
              cursor: 'pointer',
            }}>
              <span
                onClick={() => handleTopicClick(t)}
                style={{ fontSize: 13, fontWeight: 600, color: activeTopic === t ? 'var(--primary)' : 'var(--text)' }}
              >{t}</span>
              <span
                onClick={() => handleRemoveTopic(t)}
                style={{ fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 1 }}
              >✕</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={topicInput}
            onChange={e => setTopicInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddTopic()}
            placeholder="e.g. Football nostalgia, Gaming comedy..."
            style={{
              flex: 1, maxWidth: 340, padding: '9px 14px',
              backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, color: 'var(--text)', fontSize: 13, outline: 'none',
            }}
          />
          <button onClick={handleAddTopic} style={{
            padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            border: '1px solid var(--border)', backgroundColor: 'var(--surface)',
            color: 'var(--text)', cursor: 'pointer',
          }}>+ Add</button>
        </div>
      </div>

      {/* Error / Upgrade prompt */}
      {error === 'upgrade_required' ? (
        <div style={{
          padding: '28px 24px', borderRadius: 16, marginBottom: 20, textAlign: 'center',
          backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>🔒</div>
          <p style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>Pro Feature</p>
          <p style={{ fontSize: 14, color: 'var(--text-sub)', marginBottom: 16, lineHeight: 1.5 }}>
            AI-powered research is available on the Pro plan. Upgrade to unlock unlimited opportunity cards, brainstorm sessions, and caption generation.
          </p>
          <a href="/dashboard/settings" style={{
            display: 'inline-block', padding: '10px 24px', borderRadius: 10,
            backgroundColor: 'var(--primary)', color: '#000', fontWeight: 800,
            fontSize: 14, textDecoration: 'none',
          }}>Upgrade to Pro</a>
        </div>
      ) : error ? (
        <div style={{
          padding: '14px 18px', borderRadius: 12, marginBottom: 20,
          backgroundColor: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.25)',
          fontSize: 13, color: '#FF4757',
        }}>{error}</div>
      ) : null}

      {/* Loading */}
      {loading && (
        <div style={{
          backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '56px 24px', textAlign: 'center', marginBottom: 28,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', margin: '0 auto 14px',
            border: '2px solid var(--border)', borderTopColor: 'var(--primary)',
            animation: 'spin 0.7s linear infinite',
          }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 600 }}>Finding opportunities for your niche...</p>
        </div>
      )}

      {/* Opportunity cards */}
      {!loading && cards.length > 0 && (
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>
            Opportunities {activeTopic && <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>for &quot;{activeTopic}&quot;</span>}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {cards.map((card, i) => (
              <OpportunityCardView
                key={i}
                card={card}
                isSaved={savedIds.has(card.opportunity)}
                onSave={() => handleSaveIdea(card)}
                onSchedule={() => handleSchedule(card)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Saved Ideas */}
      {savedIdeas.length > 0 && (
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>Saved Ideas</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {savedIdeas.map(idea => (
              <div key={idea.id} style={{
                backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '16px 20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{idea.contentIdea}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{idea.opportunity}</p>
                    <div style={{
                      fontSize: 12, color: 'var(--text-sub)', fontStyle: 'italic',
                      padding: '8px 12px', borderRadius: 8, backgroundColor: 'var(--surface-light)',
                      borderLeft: '2px solid var(--primary)',
                    }}>
                      &ldquo;{idea.hook}&rdquo;
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => handleSchedule(idea)} style={{
                      padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                      border: 'none', backgroundColor: 'var(--primary)', color: '#000', cursor: 'pointer',
                    }}>Schedule</button>
                    <button onClick={() => handleDeleteSaved(idea.id)} style={{
                      padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                      border: '1px solid var(--border)', backgroundColor: 'transparent',
                      color: '#FF4757', cursor: 'pointer',
                    }}>✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OpportunityCardView({ card, isSaved, onSave, onSchedule }: {
  card: OpportunityCard;
  isSaved: boolean;
  onSave: () => void;
  onSchedule: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 16, padding: '20px 24px',
    }}>
      {/* Opportunity + platform */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: 'var(--primary)',
            textTransform: 'uppercase', display: 'block', marginBottom: 4,
          }}>Opportunity</span>
          <p style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.4 }}>{card.opportunity}</p>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, flexShrink: 0,
          backgroundColor: 'var(--primary-alpha)', color: 'var(--primary)',
        }}>{card.platform}</span>
      </div>

      {/* Content idea — the main thing */}
      <div style={{
        padding: '12px 16px', borderRadius: 10, marginBottom: 12,
        backgroundColor: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)',
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', display: 'block', marginBottom: 4 }}>POST THIS</span>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{card.contentIdea}</p>
      </div>

      {/* Hook */}
      <div style={{
        fontSize: 13, color: 'var(--text-sub)', fontStyle: 'italic',
        padding: '10px 14px', borderRadius: 8, marginBottom: 12,
        backgroundColor: 'var(--surface-light)', borderLeft: '2px solid var(--primary)',
      }}>
        &ldquo;{card.hook}&rdquo;
      </div>

      {/* Expandable details */}
      {expanded && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>WHY IT WORKS</span>
            <p style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.5 }}>{card.whyItWorks}</p>
          </div>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>ANGLE</span>
            <p style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.5 }}>{card.angle}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
        <button onClick={() => setExpanded(e => !e)} style={{
          padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
          border: '1px solid var(--border)', backgroundColor: 'transparent',
          color: 'var(--text-sub)', cursor: 'pointer',
        }}>{expanded ? 'Less' : 'Why it works'}</button>
        <button
          onClick={onSave}
          disabled={isSaved}
          style={{
            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
            border: `1px solid ${isSaved ? 'var(--border)' : 'rgba(34,197,94,0.4)'}`,
            backgroundColor: isSaved ? 'transparent' : 'var(--primary-alpha)',
            color: isSaved ? 'var(--text-muted)' : 'var(--primary)',
            cursor: isSaved ? 'default' : 'pointer',
          }}
        >{isSaved ? 'Saved' : 'Save Idea'}</button>
        <button onClick={onSchedule} style={{
          padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800,
          border: 'none', backgroundColor: 'var(--primary)', color: '#000', cursor: 'pointer',
        }}>Schedule →</button>
      </div>
    </div>
  );
}
