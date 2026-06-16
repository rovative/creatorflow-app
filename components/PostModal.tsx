'use client';

import { useState, useEffect } from 'react';
import { ScheduledPost, ContentType, SocialPlatform } from '@/lib/posts';
import { getActiveProfile } from '@/lib/profiles';
import { supabase } from '@/lib/supabase';
import DateTimePicker from '@/components/DateTimePicker';

const PLATFORMS: { id: SocialPlatform; label: string; color: string }[] = [
  { id: 'instagram', label: 'Instagram', color: '#E1306C' },
  { id: 'tiktok', label: 'TikTok', color: '#FF004F' },
];

const CONTENT_TYPES: { id: ContentType; label: string }[] = [
  { id: 'video', label: 'Video' },
  { id: 'image', label: 'Image' },
  { id: 'carousel', label: 'Carousel' },
];

interface Props {
  post?: ScheduledPost;
  onSave: (data: Omit<ScheduledPost, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export default function PostModal({ post, onSave, onClose }: Props) {
  const [caption, setCaption] = useState(post?.caption ?? '');
  const [platforms, setPlatforms] = useState<SocialPlatform[]>(post?.platforms ?? []);
  const [contentType, setContentType] = useState<ContentType>(post?.contentType ?? 'video');
  const [mediaName, setMediaName] = useState(post?.mediaName ?? '');
  const [mediaUrl, setMediaUrl] = useState(post?.mediaUrl ?? '');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'draft' | 'scheduled'>(
    post?.status === 'draft' ? 'draft' : 'scheduled'
  );
  const [dateVal, setDateVal] = useState('');
  const [timeVal, setTimeVal] = useState('');
  const [captionLoading, setCaptionLoading] = useState(false);
  const [captionError, setCaptionError] = useState('');

  useEffect(() => {
    if (post?.scheduledDate) {
      const d = new Date(post.scheduledDate);
      setDateVal(d.toISOString().split('T')[0]);
      setTimeVal(d.toTimeString().slice(0, 5));
    } else {
      const now = new Date();
      setDateVal(now.toISOString().split('T')[0]);
      setTimeVal(now.toTimeString().slice(0, 5));
    }
  }, [post]);

  function togglePlatform(id: SocialPlatform) {
    setPlatforms(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }

  async function handleCaptionAI(action: 'generate' | 'improve' | 'hashtags') {
    setCaptionLoading(true);
    setCaptionError('');
    const profile = await getActiveProfile();
    const prompts = {
      generate: `Write a single engaging social media caption for a ${contentType} post${caption ? ` about: "${caption}"` : ''}. Return only the caption text, no explanation.`,
      improve: `Improve this social media caption to make it more engaging and compelling:\n\n"${caption}"\n\nReturn only the improved caption, no explanation.`,
      hashtags: `Add 8-12 relevant hashtags to this caption:\n\n"${caption}"\n\nReturn the caption with hashtags appended, no explanation.`,
    };
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: 'caption',
          inputs: { topic: prompts[action] },
          profile,
          customPrompt: prompts[action],
        }),
      });
      const data = await res.json();
      if (res.status === 403) { setCaptionError('Caption AI is a Pro feature. Upgrade to unlock it.'); return; }
      if (!res.ok) { setCaptionError(data.error ?? 'Something went wrong'); return; }
      if (data.output) setCaption(data.output.trim());
    } catch {
      setCaptionError('Request failed.');
    } finally {
      setCaptionLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaName(file.name);
    setMediaUrl('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (platforms.length === 0) return alert('Select at least one platform.');

    let uploadedUrl = mediaUrl;
    if (mediaFile) {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const path = `${user?.id ?? 'anon'}/${Date.now()}_${mediaFile.name}`;
      const { data, error } = await supabase.storage.from('post-media').upload(path, mediaFile, { upsert: false });
      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage.from('post-media').getPublicUrl(data.path);
        uploadedUrl = publicUrl;
      }
      setUploading(false);
    }

    const scheduledDate = new Date(`${dateVal}T${timeVal}`).toISOString();
    onSave({ caption, platforms, contentType, mediaName, mediaUrl: uploadedUrl, scheduledDate, status });
    onClose();
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      backgroundColor: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 20, width: '100%', maxWidth: 580,
        maxHeight: '92vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 28px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 17, fontWeight: 800 }}>{post ? 'Edit Post' : 'New Post'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* Content type */}
          <div>
            <label style={labelStyle}>Content type</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {CONTENT_TYPES.map(ct => (
                <button key={ct.id} type="button" onClick={() => setContentType(ct.id)} style={{
                  padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', border: '1px solid',
                  borderColor: contentType === ct.id ? 'var(--primary)' : 'var(--border)',
                  backgroundColor: contentType === ct.id ? 'var(--primary-alpha)' : 'transparent',
                  color: contentType === ct.id ? 'var(--primary)' : 'var(--text-sub)',
                }}>{ct.label}</button>
              ))}
            </div>
          </div>

          {/* Media upload */}
          <div>
            <label style={labelStyle}>Media</label>
            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'var(--bg)', border: `2px dashed ${mediaName ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 12, padding: '24px', cursor: 'pointer', textAlign: 'center',
              flexDirection: 'column', gap: 6,
            }}>
              <input type="file" accept="image/*,video/*" onChange={handleFileChange} style={{ display: 'none' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: mediaName ? 'var(--primary)' : 'var(--text-sub)' }}>
                {mediaName || 'Click to upload photo or video'}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>JPG, PNG, MP4, MOV</span>
            </label>
          </div>

          {/* Caption */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Caption</label>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{caption.length} chars</span>
            </div>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Write your caption..."
              rows={4}
              style={{
                width: '100%', padding: '12px 16px',
                backgroundColor: 'var(--bg)', border: '1px solid var(--border)',
                borderRadius: 10, color: 'var(--text)', fontSize: 14,
                outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6,
              }}
            />
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {([
                { key: 'generate', label: '✨ Generate' },
                { key: 'improve', label: '⚡ Improve' },
                { key: 'hashtags', label: '# Add Hashtags' },
              ] as const).map(btn => (
                <button
                  key={btn.key}
                  type="button"
                  onClick={() => handleCaptionAI(btn.key)}
                  disabled={captionLoading || (btn.key !== 'generate' && !caption)}
                  style={{
                    padding: '6px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                    border: '1px solid rgba(34,197,94,0.3)',
                    backgroundColor: 'var(--primary-alpha)', color: 'var(--primary)',
                    cursor: captionLoading || (btn.key !== 'generate' && !caption) ? 'default' : 'pointer',
                    opacity: captionLoading || (btn.key !== 'generate' && !caption) ? 0.4 : 1,
                  }}
                >{captionLoading ? '...' : btn.label}</button>
              ))}
            </div>
            {captionError && (
              <p style={{ fontSize: 12, color: '#FF4757', marginTop: 6 }}>{captionError}</p>
            )}
          </div>

          {/* Platforms */}
          <div>
            <label style={labelStyle}>Platforms</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {PLATFORMS.map(p => (
                <button key={p.id} type="button" onClick={() => togglePlatform(p.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  border: '1px solid',
                  borderColor: platforms.includes(p.id) ? p.color : 'var(--border)',
                  backgroundColor: platforms.includes(p.id) ? `${p.color}18` : 'transparent',
                  color: platforms.includes(p.id) ? p.color : 'var(--text-sub)',
                }}>
                  {p.label}
                  {platforms.includes(p.id) && <span style={{ fontSize: 12 }}>✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Date & time */}
          <div>
            <label style={labelStyle}>When to post</label>
            <DateTimePicker
              dateVal={dateVal}
              timeVal={timeVal}
              onDateChange={setDateVal}
              onTimeChange={setTimeVal}
            />
          </div>

          {/* Status */}
          <div>
            <label style={labelStyle}>Save as</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['scheduled', 'draft'] as const).map(s => (
                <button key={s} type="button" onClick={() => setStatus(s)} style={{
                  padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', border: '1px solid',
                  borderColor: status === s ? 'var(--primary)' : 'var(--border)',
                  backgroundColor: status === s ? 'var(--primary-alpha)' : 'transparent',
                  color: status === s ? 'var(--primary)' : 'var(--text-sub)',
                }}>{s === 'scheduled' ? 'Scheduled' : 'Draft'}</button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 700,
              backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-sub)', cursor: 'pointer',
            }}>Cancel</button>
            <button type="submit" disabled={uploading} style={{
              flex: 2, padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 800,
              backgroundColor: 'var(--primary)', color: '#000', border: 'none',
              cursor: uploading ? 'default' : 'pointer', opacity: uploading ? 0.7 : 1,
            }}>
              {uploading ? 'Uploading media…' : post ? 'Save Changes' : status === 'scheduled' ? 'Schedule Post' : 'Save Draft'}
            </button>
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
