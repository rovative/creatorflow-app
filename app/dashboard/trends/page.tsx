'use client';

import { useState } from 'react';

const SAMPLE_TRENDS = [
  { title: 'Morning routine aesthetic', platform: 'TikTok', category: 'Lifestyle', heat: 98 },
  { title: 'Silent vlog', platform: 'Instagram', category: 'Lifestyle', heat: 94 },
  { title: '5am club challenge', platform: 'TikTok', category: 'Fitness', heat: 91 },
  { title: 'Day in my life (realistic)', platform: 'TikTok', category: 'Vlog', heat: 89 },
  { title: 'Outfit of the week', platform: 'Instagram', category: 'Fashion', heat: 86 },
  { title: 'Talking to camera, no edit', platform: 'TikTok', category: 'Commentary', heat: 83 },
];

export default function Trends() {
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState<string[]>([]);

  const filtered = SAMPLE_TRENDS.filter(t =>
    !query || t.title.toLowerCase().includes(query.toLowerCase()) || t.category.toLowerCase().includes(query.toLowerCase())
  );

  function toggleSave(title: string) {
    setSaved(s => s.includes(title) ? s.filter(x => x !== title) : [...s, title]);
  }

  return (
    <div style={{ padding: '40px 48px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5, marginBottom: 4 }}>Trends</h1>
        <p style={{ color: 'var(--text-sub)', fontSize: 15 }}>What&apos;s trending in your niche right now.</p>
      </div>

      <input
        type="text"
        placeholder="Search by topic or category..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={{
          width: '100%', maxWidth: 480, padding: '12px 18px',
          backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, color: 'var(--text)', fontSize: 15, outline: 'none',
          marginBottom: 28,
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((t, i) => (
          <div key={t.title} style={{
            backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', minWidth: 24 }}>#{i + 1}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{t.title}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                    backgroundColor: 'var(--primary-alpha)', color: 'var(--primary)',
                  }}>{t.platform}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                    backgroundColor: 'var(--surface-light)', color: 'var(--text-sub)',
                  }}>{t.category}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)' }}>{t.heat}%</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>trending</div>
              </div>
              <button
                onClick={() => toggleSave(t.title)}
                style={{
                  padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', border: '1px solid',
                  borderColor: saved.includes(t.title) ? 'var(--primary)' : 'var(--border)',
                  backgroundColor: saved.includes(t.title) ? 'var(--primary-alpha)' : 'transparent',
                  color: saved.includes(t.title) ? 'var(--primary)' : 'var(--text-sub)',
                }}
              >
                {saved.includes(t.title) ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
