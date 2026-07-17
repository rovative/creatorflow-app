'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createProfile, getProfiles, SocialPlatform } from '@/lib/profiles';
import { supabase } from '@/lib/supabase';

const PROFILE_EMOJIS = [
  '💪','🎮','💄','💰','🎵','💻','👗','🔥',
  '🌟','📸','✈️','🍜','🐾','🎨','📚','🏋️','🎬','🧠',
];

const PLATFORMS: { id: SocialPlatform; label: string; color: string }[] = [
  { id: 'tiktok', label: 'TikTok', color: '#FF004F' },
  { id: 'instagram', label: 'Instagram', color: '#E1306C' },
  { id: 'youtube', label: 'YouTube', color: '#FF0000' },
];

const NICHE_OPTIONS = [
  'Fitness','Gaming','Beauty','Finance','Music','Coding',
  'Fashion','Motivation','Food','Travel','Pets','Art & Design',
  'Education','Sports','Comedy','Lifestyle',
];

const STYLE_OPTIONS = [
  'High Energy','Calm & Educational','Funny / Comedy',
  'Raw & Authentic','Inspirational','Aesthetic','Storytelling','Tutorial-focused',
];

type Step = 1 | 2;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Profile form state
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🌟');
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([]);
  const [niches, setNiches] = useState<string[]>([]);
  const [specificNiche, setSpecificNiche] = useState('');
  const [creatorStyle, setCreatorStyle] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [summarising, setSummarising] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  // If user already has a profile, skip onboarding
  useEffect(() => {
    getProfiles().then(ps => {
      if (ps.length > 0) router.replace('/dashboard');
      else setChecking(false);
    });
  }, [router]);

  async function generateSummary() {
    setSummarising(true);
    try {
      const res = await fetch('/api/profile-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, emoji, platforms, niches, specificNiche, creatorStyle }),
      });
      const data = await res.json();
      if (data.summary) setAiSummary(data.summary);
    } finally {
      setSummarising(false);
    }
  }

  async function handleProfileNext(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return alert('Add a profile name.');
    if (platforms.length === 0) return alert('Select at least one platform.');
    setLoading(true);
    await createProfile({ name, emoji, platforms, niches, specificNiche, creatorStyle, aiSummary });
    setLoading(false);
    setStep(2);
  }

  function togglePlatform(id: SocialPlatform) {
    setPlatforms(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  if (checking) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      </main>
    );
  }

  return (
    <main style={{
      minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '48px 24px 80px',
    }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
        <img src="/logo.svg" alt="Creator Flow" width={36} height={36} />
        <span style={{ fontWeight: 800, fontSize: 16 }}>Creator Flow</span>
      </div>

      {/* Step indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 40 }}>
        {([1, 2] as Step[]).map((s, i) => (
          <>
            <div key={s} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', fontSize: 12, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: step >= s ? 'var(--primary)' : 'var(--surface)',
                border: `2px solid ${step >= s ? 'var(--primary)' : 'var(--border)'}`,
                color: step >= s ? '#000' : 'var(--text-muted)',
              }}>{s}</div>
              <span style={{ fontSize: 11, color: step >= s ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600 }}>
                {s === 1 ? 'Profile' : 'Connect'}
              </span>
            </div>
            {i < 1 && (
              <div key={`line-${s}`} style={{
                width: 48, height: 2, borderRadius: 1, marginBottom: 18,
                backgroundColor: step > s ? 'var(--primary)' : 'var(--border)',
              }} />
            )}
          </>
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: 580 }}>

        {/* ── STEP 1: Profile ── */}
        {step === 1 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.5, marginBottom: 8 }}>Set up your creator profile</h1>
              <p style={{ color: 'var(--text-sub)', fontSize: 15 }}>This tells the AI who you are so every output is tailored to you.</p>
            </div>

            <form onSubmit={handleProfileNext} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Emoji + Name */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div>
                  <label style={labelStyle}>Avatar</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, width: 170 }}>
                    {PROFILE_EMOJIS.map(e => (
                      <button key={e} type="button" onClick={() => setEmoji(e)} style={{
                        width: 36, height: 36, borderRadius: 8, fontSize: 17,
                        border: `2px solid ${emoji === e ? 'var(--primary)' : 'transparent'}`,
                        backgroundColor: emoji === e ? 'var(--primary-alpha)' : 'var(--surface)',
                        cursor: 'pointer',
                      }}>{e}</button>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Profile name</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Fitness Creator"
                    style={inputStyle}
                    required
                  />
                  {name && (
                    <div style={{
                      marginTop: 10, display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 10,
                      backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
                    }}>
                      <span style={{ fontSize: 20 }}>{emoji}</span>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Platforms */}
              <div>
                <label style={labelStyle}>Which platforms do you post on?</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {PLATFORMS.map(p => (
                    <button key={p.id} type="button" onClick={() => togglePlatform(p.id)} style={{
                      padding: '9px 18px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                      cursor: 'pointer', border: '1px solid',
                      borderColor: platforms.includes(p.id) ? p.color : 'var(--border)',
                      backgroundColor: platforms.includes(p.id) ? `${p.color}18` : 'transparent',
                      color: platforms.includes(p.id) ? p.color : 'var(--text-sub)',
                    }}>{p.label}</button>
                  ))}
                </div>
              </div>

              {/* What do you make */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>What do you make?</label>
                  <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>Most important</span>
                </div>
                <textarea
                  value={specificNiche}
                  onChange={e => setSpecificNiche(e.target.value)}
                  placeholder="e.g. Gym transformation reels for people who work 9–5 jobs and can only train 3x a week"
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                />
              </div>

              {/* Niche categories */}
              <div>
                <label style={labelStyle}>Niche categories</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {NICHE_OPTIONS.map(n => (
                    <button key={n} type="button" onClick={() => setNiches(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n])} style={{
                      padding: '6px 13px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', border: '1px solid',
                      borderColor: niches.includes(n) ? 'var(--primary)' : 'var(--border)',
                      backgroundColor: niches.includes(n) ? 'var(--primary-alpha)' : 'transparent',
                      color: niches.includes(n) ? 'var(--primary)' : 'var(--text-sub)',
                    }}>{n}</button>
                  ))}
                </div>
              </div>

              {/* Advanced toggle */}
              <button type="button" onClick={() => setShowAdvanced(s => !s)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', fontSize: 13, fontWeight: 600,
                textAlign: 'left', padding: 0, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {showAdvanced ? '▼' : '▶'} More options
              </button>

              {showAdvanced && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <label style={labelStyle}>Creator style</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {STYLE_OPTIONS.map(s => (
                        <button key={s} type="button" onClick={() => setCreatorStyle(creatorStyle === s ? '' : s)} style={{
                          padding: '6px 13px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                          cursor: 'pointer', border: '1px solid',
                          borderColor: creatorStyle === s ? 'var(--primary)' : 'var(--border)',
                          backgroundColor: creatorStyle === s ? 'var(--primary-alpha)' : 'transparent',
                          color: creatorStyle === s ? 'var(--primary)' : 'var(--text-sub)',
                        }}>{s}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* AI Understanding */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>AI understanding</label>
                  <button type="button" onClick={generateSummary} disabled={summarising || !name} style={{
                    padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700,
                    border: '1px solid var(--primary)', backgroundColor: 'var(--primary-alpha)',
                    color: 'var(--primary)', cursor: summarising || !name ? 'default' : 'pointer',
                    opacity: summarising || !name ? 0.5 : 1,
                  }}>
                    {summarising ? 'Generating...' : aiSummary ? 'Regenerate' : 'Generate'}
                  </button>
                </div>
                {aiSummary ? (
                  <div style={{
                    padding: '12px 16px', borderRadius: 10,
                    backgroundColor: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)',
                    fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.6,
                  }}>{aiSummary}</div>
                ) : (
                  <div style={{
                    padding: '12px 16px', borderRadius: 10,
                    backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
                    fontSize: 13, color: 'var(--text-muted)',
                  }}>Fill in your details above, then generate to see how the AI understands your brand.</div>
                )}
              </div>

              <button type="submit" disabled={loading} style={{
                padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 800,
                backgroundColor: 'var(--primary)', color: '#000', border: 'none',
                cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1,
                boxShadow: '0 0 24px rgba(34,197,94,0.2)', marginTop: 4,
              }}>
                {loading ? 'Saving...' : 'Next — Connect your accounts →'}
              </button>
            </form>
          </>
        )}

        {/* ── STEP 2: Connect accounts ── */}
        {step === 2 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.5, marginBottom: 8 }}>Connect your accounts</h1>
              <p style={{ color: 'var(--text-sub)', fontSize: 15 }}>
                Each profile connects one account per platform. Want to manage a different account? Create a separate profile.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              {PLATFORMS.filter(p => platforms.includes(p.id)).map(p => (
                <div key={p.id} style={{
                  backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 16, padding: '20px 24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 12,
                      backgroundColor: `${p.color}18`,
                      border: `1px solid ${p.color}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 900, fontSize: 13, color: p.color,
                    }}>{p.label[0]}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{p.label}</div>
                      {connectingPlatform === p.id ? (
                        <div style={{ fontSize: 12, color: '#FFB020', marginTop: 2 }}>
                          API approval in progress — connection coming soon
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Not connected</div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setConnectingPlatform(connectingPlatform === p.id ? null : p.id)}
                    style={{
                      padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 700,
                      border: `1px solid ${p.color}`,
                      backgroundColor: connectingPlatform === p.id ? `${p.color}18` : 'transparent',
                      color: p.color, cursor: 'pointer',
                    }}
                  >
                    {connectingPlatform === p.id ? 'Coming soon' : 'Connect'}
                  </button>
                </div>
              ))}

              {PLATFORMS.filter(p => !platforms.includes(p.id)).map(p => (
                <div key={p.id} style={{
                  backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 16, padding: '20px 24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  opacity: 0.4,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 12,
                      backgroundColor: 'var(--bg)', border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 900, fontSize: 13, color: 'var(--text-muted)',
                    }}>{p.label[0]}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{p.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Not in your profile</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              backgroundColor: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 12, padding: '14px 18px', marginBottom: 28,
              fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.6,
            }}>
              We&apos;re currently awaiting API approval from TikTok, Instagram and YouTube. Platform connections will be enabled once approved — you&apos;ll be notified. You can still plan and schedule content in the meantime.
            </div>

            <button onClick={() => router.push('/dashboard')} style={{
              width: '100%', padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 800,
              backgroundColor: 'var(--primary)', color: '#000', border: 'none',
              cursor: 'pointer', boxShadow: '0 0 24px rgba(34,197,94,0.2)',
            }}>
              Go to Dashboard →
            </button>

            <button onClick={() => setStep(1)} style={{
              width: '100%', marginTop: 12, padding: '12px', borderRadius: 12,
              fontSize: 14, fontWeight: 600, backgroundColor: 'transparent',
              border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer',
            }}>
              ← Back to profile
            </button>
          </>
        )}
      </div>

      <button
        onClick={async () => { await supabase.auth.signOut(); router.push('/sign-in'); }}
        style={{
          marginTop: 32, background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 12, color: 'var(--text-muted)',
        }}
      >
        Sign out
      </button>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-sub)',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 10, color: 'var(--text)', fontSize: 14, outline: 'none',
};
