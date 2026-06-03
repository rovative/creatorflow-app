'use client';

import { useState, useEffect } from 'react';
import { CreatorProfile, SocialPlatform } from '@/lib/profiles';

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

const FORMAT_OPTIONS = [
  'Talking Head','Tutorial / How-to','B-Roll / Cinematic',
  'Voiceover','POV / Immersive','Text on Screen','Mixed',
];

interface Props {
  profile: CreatorProfile | null;
  onSave: (data: Omit<CreatorProfile, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export default function EditProfileModal({ profile, onSave, onClose }: Props) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🌟');
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([]);
  const [niches, setNiches] = useState<string[]>([]);
  const [specificNiche, setSpecificNiche] = useState('');
  const [audienceDescription, setAudienceDescription] = useState('');
  const [creatorStyle, setCreatorStyle] = useState('');
  const [contentFormat, setContentFormat] = useState('');
  const [growthGoal, setGrowthGoal] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [summarising, setSummarising] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setEmoji(profile.emoji);
      setPlatforms(profile.platforms);
      setNiches(profile.niches);
      setSpecificNiche(profile.specificNiche ?? '');
      setAudienceDescription(profile.audienceDescription ?? '');
      setCreatorStyle(profile.creatorStyle ?? '');
      setContentFormat(profile.contentFormat ?? '');
      setGrowthGoal(profile.growthGoal ?? '');
      setAiSummary(profile.aiSummary ?? '');
    } else {
      setName(''); setEmoji('🌟'); setPlatforms([]); setNiches([]);
      setSpecificNiche(''); setAudienceDescription(''); setCreatorStyle('');
      setContentFormat(''); setGrowthGoal(''); setAiSummary('');
    }
    setShowAdvanced(false);
  }, [profile]);

  async function generateSummary() {
    setSummarising(true);
    try {
      const res = await fetch('/api/profile-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, emoji, platforms, niches, specificNiche, audienceDescription, creatorStyle, contentFormat, growthGoal }),
      });
      const data = await res.json();
      if (data.summary) setAiSummary(data.summary);
    } finally {
      setSummarising(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return alert('Add a profile name.');
    onSave({ name, emoji, platforms, niches, specificNiche, audienceDescription, creatorStyle, contentFormat, growthGoal, aiSummary });
    onClose();
  }

  const chipStyle = (active: boolean, color?: string): React.CSSProperties => ({
    padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', border: '1px solid',
    borderColor: active ? (color ?? 'var(--primary)') : 'var(--border)',
    backgroundColor: active ? (color ? `${color}18` : 'var(--primary-alpha)') : 'transparent',
    color: active ? (color ?? 'var(--primary)') : 'var(--text-sub)',
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      backgroundColor: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 20, width: '100%', maxWidth: 600,
        maxHeight: '92vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 28px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 17, fontWeight: 800 }}>{profile ? 'Edit Profile' : 'New Profile'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', fontSize: 22 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* Emoji + Name */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div>
              <label style={labelStyle}>Avatar</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, width: 180 }}>
                {PROFILE_EMOJIS.map(e => (
                  <button key={e} type="button" onClick={() => setEmoji(e)} style={{
                    width: 38, height: 38, borderRadius: 8, fontSize: 18,
                    border: `2px solid ${emoji === e ? 'var(--primary)' : 'transparent'}`,
                    backgroundColor: emoji === e ? 'var(--primary-alpha)' : 'var(--bg)',
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
              />
              {name && (
                <div style={{
                  marginTop: 10, display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 10,
                  backgroundColor: 'var(--bg)', border: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: 22 }}>{emoji}</span>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Platforms */}
          <div>
            <label style={labelStyle}>Platforms</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {PLATFORMS.map(p => (
                <button key={p.id} type="button" onClick={() => setPlatforms(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])} style={chipStyle(platforms.includes(p.id), p.color)}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* What do you make */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>What do you make?</label>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Most important field</span>
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
                <button key={n} type="button" onClick={() => setNiches(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n])} style={chipStyle(niches.includes(n))}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* AI Understanding */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>AI understanding</label>
              <button type="button" onClick={generateSummary} disabled={summarising} style={{
                padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700,
                border: '1px solid var(--primary)', backgroundColor: 'var(--primary-alpha)',
                color: 'var(--primary)', cursor: summarising ? 'default' : 'pointer', opacity: summarising ? 0.6 : 1,
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
                backgroundColor: 'var(--bg)', border: '1px solid var(--border)',
                fontSize: 13, color: 'var(--text-muted)',
              }}>Fill in your profile details, then generate to see how the AI understands your brand.</div>
            )}
          </div>

          {/* Advanced toggle */}
          <button type="button" onClick={() => setShowAdvanced(s => !s)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 13, fontWeight: 600,
            textAlign: 'left', padding: 0, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {showAdvanced ? '▼' : '▶'} Advanced options
          </button>

          {showAdvanced && (
            <>
              {/* Creator style */}
              <div>
                <label style={labelStyle}>Creator style</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {STYLE_OPTIONS.map(s => (
                    <button key={s} type="button" onClick={() => setCreatorStyle(creatorStyle === s ? '' : s)} style={chipStyle(creatorStyle === s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content format */}
              <div>
                <label style={labelStyle}>Content format</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {FORMAT_OPTIONS.map(f => (
                    <button key={f} type="button" onClick={() => setContentFormat(contentFormat === f ? '' : f)} style={chipStyle(contentFormat === f)}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audience */}
              <div>
                <label style={labelStyle}>Target audience</label>
                <input
                  value={audienceDescription}
                  onChange={e => setAudienceDescription(e.target.value)}
                  placeholder="e.g. Busy professionals 25–35 who want to get fit without a gym"
                  style={inputStyle}
                />
              </div>

              {/* Growth goal */}
              <div>
                <label style={labelStyle}>Growth goal</label>
                <input
                  value={growthGoal}
                  onChange={e => setGrowthGoal(e.target.value)}
                  placeholder="e.g. Reach 10k followers, get brand deals, sell my course"
                  style={inputStyle}
                />
              </div>
            </>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 700,
              backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-sub)', cursor: 'pointer',
            }}>Cancel</button>
            <button type="submit" style={{
              flex: 2, padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 800,
              backgroundColor: 'var(--primary)', color: '#000', border: 'none', cursor: 'pointer',
            }}>Save Profile</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-sub)',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  backgroundColor: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: 10, color: 'var(--text)', fontSize: 14, outline: 'none',
};
