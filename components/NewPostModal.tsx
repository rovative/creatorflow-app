'use client';

import { useState } from 'react';

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
];

export default function NewPostModal({ onClose }: { onClose: () => void }) {
  const [caption, setCaption] = useState('');
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [mediaName, setMediaName] = useState('');

  function togglePlatform(id: string) {
    setPlatforms(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }

  function handleMediaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setMediaName(file.name);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: wire up to Supabase publish_queue
    onClose();
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 20, width: '100%', maxWidth: 560,
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>New Post</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Media */}
          <div>
            <label style={labelStyle}>Media</label>
            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 8,
              backgroundColor: 'var(--surface-light)', border: '2px dashed var(--border)',
              borderRadius: 12, padding: '28px', cursor: 'pointer', textAlign: 'center',
            }}>
              <input type="file" accept="image/*,video/*" onChange={handleMediaChange} style={{ display: 'none' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: mediaName ? 'var(--primary)' : 'var(--text-sub)' }}>
                {mediaName || 'Click to upload photo or video'}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>JPG, PNG, MP4, MOV</span>
            </label>
          </div>

          {/* Caption */}
          <div>
            <label style={labelStyle}>Caption</label>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Write your caption..."
              rows={4}
              style={{
                width: '100%', padding: '12px 16px',
                backgroundColor: 'var(--bg)', border: '1px solid var(--border)',
                borderRadius: 10, color: 'var(--text)', fontSize: 14,
                outline: 'none', resize: 'vertical', fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Platforms */}
          <div>
            <label style={labelStyle}>Platforms</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlatform(p.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 16px', borderRadius: 10, cursor: 'pointer',
                    fontSize: 14, fontWeight: 600, border: '1px solid',
                    borderColor: platforms.includes(p.id) ? 'var(--primary)' : 'var(--border)',
                    backgroundColor: platforms.includes(p.id) ? 'var(--primary-alpha)' : 'var(--bg)',
                    color: platforms.includes(p.id) ? 'var(--primary)' : 'var(--text-sub)',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Time</label>
              <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 700,
              backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-sub)', cursor: 'pointer',
            }}>
              Cancel
            </button>
            <button type="submit" style={{
              flex: 2, padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 800,
              backgroundColor: 'var(--primary)', color: '#000', border: 'none', cursor: 'pointer',
            }}>
              Schedule Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600,
  marginBottom: 8, color: 'var(--text-sub)',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  backgroundColor: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: 10, color: 'var(--text)', fontSize: 14, outline: 'none',
};
