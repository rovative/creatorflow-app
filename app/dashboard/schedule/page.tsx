'use client';

import { useState, useEffect, useMemo } from 'react';
import { ScheduledPost, getPosts, createPost, updatePost, deletePost, formatScheduledDate } from '@/lib/posts';
import PostModal from '@/components/PostModal';
import { supabase } from '@/lib/supabase';
import { getActiveProfile, CreatorProfile } from '@/lib/profiles';

type Filter = 'all' | 'scheduled' | 'draft' | 'published';
type View = 'list' | 'calendar';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'scheduled', label: 'Queue' },
  { id: 'draft', label: 'Drafts' },
  { id: 'published', label: 'Done' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  tiktok: '#FF004F',
  youtube: '#FF0000',
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  scheduled: { label: 'Scheduled', bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
  draft: { label: 'Draft', bg: 'rgba(255,176,32,0.12)', color: '#FFB020' },
  publishing: { label: 'Publishing', bg: 'rgba(34,197,94,0.12)', color: '#4ade80' },
  published: { label: 'Published', bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
  failed: { label: 'Failed', bg: 'rgba(255,71,87,0.12)', color: '#FF4757' },
};

const STATUS_DOT: Record<string, string> = {
  scheduled: '#22c55e',
  draft: '#FFB020',
  published: '#22c55e',
  publishing: '#4ade80',
  failed: '#FF4757',
};

export default function SchedulePage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [filter, setFilter] = useState<Filter>('scheduled');
  const [view, setView] = useState<View>('list');
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledPost | undefined>();
  const [limitError, setLimitError] = useState(false);
  const [tier, setTier] = useState<string>('free');
  const [tierLoading, setTierLoading] = useState(true);
  const [profile, setProfile] = useState<CreatorProfile | null>(null);

  const today = new Date();
  const [current, setCurrent] = useState({ month: today.getMonth(), year: today.getFullYear() });

  useEffect(() => {
    getActiveProfile().then(p => {
      setProfile(p);
      if (p) getPosts(p.id).then(setPosts);
    });
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('user_tiers').select('tier').eq('user_id', user.id).single()
        .then(({ data }) => { if (data?.tier) setTier(data.tier); setTierLoading(false); });
    });
  }, []);

  async function refresh() { if (profile) setPosts(await getPosts(profile.id)); }

  async function handleSave(data: Omit<ScheduledPost, 'id' | 'createdAt'>) {
    try {
      if (editingPost) { await updatePost({ ...editingPost, ...data }); }
      else { await createPost(data, profile?.id ?? ''); }
      setLimitError(false);
    } catch (e) {
      if (e instanceof Error && e.message === 'POST_LIMIT_REACHED') {
        setLimitError(true); return;
      }
    }
    await refresh();
  }

  async function handleDelete(id: string) {
    if (confirm('Delete this post?')) { await deletePost(id); await refresh(); }
  }

  async function handlePublish(id: string) {
    const res = await fetch('/api/publish/tiktok', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: id }),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error ?? 'Publish failed'); }
    await refresh();
  }

  async function handleDuplicate(post: ScheduledPost) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);
    try {
      await createPost({ ...post, status: 'draft', scheduledDate: tomorrow.toISOString() }, profile?.id ?? '');
      setLimitError(false);
    } catch (e) {
      if (e instanceof Error && e.message === 'POST_LIMIT_REACHED') { setLimitError(true); return; }
    }
    await refresh();
  }

  async function handleStatusToggle(post: ScheduledPost) {
    await updatePost({ ...post, status: post.status === 'draft' ? 'scheduled' : 'draft' });
    await refresh();
  }

  function openEdit(post: ScheduledPost) { setEditingPost(post); setShowModal(true); }
  function closeModal() { setShowModal(false); setEditingPost(undefined); }

  const scheduledCount = posts.filter(p => p.status === 'scheduled' || p.status === 'publishing').length;
  const draftCount = posts.filter(p => p.status === 'draft').length;
  const publishedCount = posts.filter(p => p.status === 'published' || p.status === 'failed').length;

  const nextPost = useMemo(() => {
    const now = new Date();
    return posts
      .filter(p => p.status === 'scheduled' && new Date(p.scheduledDate) > now)
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())[0];
  }, [posts]);

  const filtered = useMemo(() => {
    switch (filter) {
      case 'scheduled': return posts.filter(p => p.status === 'scheduled' || p.status === 'publishing');
      case 'draft': return posts.filter(p => p.status === 'draft');
      case 'published': return posts.filter(p => p.status === 'published' || p.status === 'failed');
      default: return posts;
    }
  }, [posts, filter]);

  const sorted = [...filtered].sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

  // Calendar
  const firstDay = new Date(current.year, current.month, 1).getDay();
  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : i - firstDay + 1);

  const postsByDay = useMemo(() => {
    const map: Record<number, ScheduledPost[]> = {};
    posts.forEach(p => {
      const d = new Date(p.scheduledDate);
      if (d.getMonth() === current.month && d.getFullYear() === current.year) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(p);
      }
    });
    return map;
  }, [posts, current]);

  return (
    <div style={{ padding: '40px 48px', maxWidth: view === 'calendar' ? 1100 : 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5, marginBottom: 4 }}>Schedule</h1>
          <p style={{ color: 'var(--text-sub)', fontSize: 15 }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            {(['list', 'calendar'] as View[]).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '8px 16px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                backgroundColor: view === v ? 'var(--primary-alpha)' : 'transparent',
                color: view === v ? 'var(--primary)' : 'var(--text-sub)',
              }}>
                {v === 'list' ? 'List' : 'Calendar'}
              </button>
            ))}
          </div>
          <button onClick={() => { setEditingPost(undefined); setShowModal(true); }} style={{
            backgroundColor: 'var(--primary)', color: '#000',
            padding: '10px 22px', borderRadius: 10, fontSize: 14,
            fontWeight: 800, border: 'none', cursor: 'pointer',
            boxShadow: '0 0 20px rgba(34,197,94,0.2)',
          }}>
            + New Post
          </button>
        </div>
      </div>

      {/* Free plan limit banner */}
      {limitError && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', borderRadius: 12, marginBottom: 20,
          backgroundColor: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.3)',
        }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#FF4757', marginBottom: 2 }}>3-post limit reached</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Free plan is limited to 3 scheduled or draft posts at a time.</p>
          </div>
          <a href="/dashboard/settings" style={{
            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800,
            backgroundColor: 'var(--primary)', color: '#000', textDecoration: 'none',
          }}>Upgrade</a>
        </div>
      )}

      {/* ── CALENDAR VIEW ── */}
      {view === 'calendar' && (
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <button onClick={() => setCurrent(c => c.month === 0 ? { month: 11, year: c.year - 1 } : { month: c.month - 1, year: c.year })}
              style={{ background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>‹</button>
            <span style={{ fontWeight: 800, fontSize: 16 }}>{MONTHS[current.month]} {current.year}</span>
            <button onClick={() => setCurrent(c => c.month === 11 ? { month: 0, year: c.year + 1 } : { month: c.month + 1, year: c.year })}
              style={{ background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>›</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
            {DAYS.map(d => (
              <div key={d} style={{ padding: '10px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {cells.map((day, i) => {
              const isToday = day === today.getDate() && current.month === today.getMonth() && current.year === today.getFullYear();
              const dayPosts = day ? (postsByDay[day] ?? []) : [];
              return (
                <div key={i} style={{
                  minHeight: 96, padding: '8px 10px',
                  borderRight: '1px solid var(--border)',
                  borderBottom: '1px solid var(--border)',
                  backgroundColor: day ? 'transparent' : 'var(--surface-light)',
                }}>
                  {day && (
                    <>
                      <span style={{
                        fontSize: 12, fontWeight: isToday ? 800 : 500,
                        color: isToday ? '#000' : 'var(--text-sub)',
                        backgroundColor: isToday ? 'var(--primary)' : 'transparent',
                        width: 22, height: 22, borderRadius: '50%',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: dayPosts.length > 0 ? 4 : 0,
                      }}>{day}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {dayPosts.slice(0, 3).map((post, j) => (
                          <button key={j} onClick={() => openEdit(post)} style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '2px 6px', borderRadius: 4, border: 'none',
                            backgroundColor: `${STATUS_DOT[post.status] ?? '#666'}18`,
                            cursor: 'pointer', width: '100%', textAlign: 'left',
                          }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, backgroundColor: STATUS_DOT[post.status] ?? '#666' }} />
                            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {new Date(post.scheduledDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                              {post.caption ? ` · ${post.caption}` : ` · ${post.contentType}`}
                            </span>
                          </button>
                        ))}
                        {dayPosts.length > 3 && (
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', paddingLeft: 6 }}>+{dayPosts.length - 3} more</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {view === 'list' && (
        <>
          {/* Stats row */}
          {(() => {
            const activeCount = scheduledCount + draftCount;
            const isFree = !tierLoading && tier === 'free';
            const atLimit = isFree && activeCount >= 3;
            return (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                backgroundColor: 'var(--surface)', border: `1px solid ${atLimit ? 'rgba(255,71,87,0.3)' : 'var(--border)'}`,
                borderRadius: 14, overflow: 'hidden', marginBottom: 20,
              }}>
                {[
                  { label: 'Active', value: activeCount, color: atLimit ? '#FF4757' : 'var(--text)', limit: isFree },
                  { label: 'Scheduled', value: scheduledCount, color: '#22c55e', limit: false },
                  { label: 'Drafts', value: draftCount, color: '#FFB020', limit: false },
                ].map((s, i) => (
                  <div key={s.label} style={{ padding: '18px 24px', textAlign: 'center', borderLeft: i > 0 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ fontSize: 26, fontWeight: 900, color: s.color, marginBottom: 2, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2 }}>
                      {s.value}
                      {s.limit && <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-muted)' }}>/3</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Up next banner */}
          {nextPost && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: 12, padding: '12px 18px', marginBottom: 20,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e', flexShrink: 0, boxShadow: '0 0 6px #22c55e' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', letterSpacing: 0.5 }}>UP NEXT</span>
              <span style={{ fontSize: 13, color: '#4ade80', fontWeight: 600 }}>{formatScheduledDate(nextPost.scheduledDate)}</span>
              {nextPost.caption && (
                <span style={{ fontSize: 13, color: 'var(--text-sub)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  — {nextPost.caption}
                </span>
              )}
            </div>
          )}

          {/* Filter tabs */}
          {posts.length > 0 && (
            <div style={{
              display: 'flex', gap: 4,
              backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, padding: 4, marginBottom: 20, width: 'fit-content',
            }}>
              {FILTERS.map(f => {
                const count = f.id === 'scheduled' ? scheduledCount : f.id === 'draft' ? draftCount : f.id === 'published' ? publishedCount : null;
                return (
                  <button key={f.id} onClick={() => setFilter(f.id)} style={{
                    padding: '7px 14px', borderRadius: 7, fontSize: 13, fontWeight: 600,
                    border: 'none', cursor: 'pointer',
                    backgroundColor: filter === f.id ? 'var(--primary-alpha)' : 'transparent',
                    color: filter === f.id ? 'var(--primary)' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    {f.label}
                    {count !== null && count > 0 && (
                      <span style={{
                        fontSize: 11, fontWeight: 700,
                        backgroundColor: filter === f.id ? 'rgba(34,197,94,0.25)' : 'var(--surface-light)',
                        color: filter === f.id ? 'var(--primary)' : 'var(--text-muted)',
                        padding: '1px 6px', borderRadius: 100,
                      }}>{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Post list */}
          {sorted.length === 0 ? (
            <div style={{
              backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 16, padding: '56px 24px', textAlign: 'center',
            }}>
              <p style={{ fontWeight: 700, marginBottom: 8 }}>
                {filter === 'all' ? 'No posts yet' : `No ${filter} posts`}
              </p>
              <p style={{ color: 'var(--text-sub)', fontSize: 14, marginBottom: 24 }}>
                {filter === 'all' ? 'Click "+ New Post" to schedule your first post.' : `You don't have any ${filter} posts.`}
              </p>
              {filter === 'all' && (
                <button onClick={() => setShowModal(true)} style={{
                  backgroundColor: 'var(--primary)', color: '#000',
                  padding: '10px 22px', borderRadius: 10, fontSize: 14,
                  fontWeight: 800, border: 'none', cursor: 'pointer',
                }}>+ New Post</button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sorted.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onEdit={() => openEdit(post)}
                  onDelete={() => handleDelete(post.id)}
                  onDuplicate={() => handleDuplicate(post)}
                  onToggleStatus={() => handleStatusToggle(post)}
                  onPublish={() => handlePublish(post.id)}
                />
              ))}
              <button onClick={() => setShowModal(true)} style={{
                padding: '16px', borderRadius: 14, fontSize: 14, fontWeight: 600,
                border: '2px dashed rgba(34,197,94,0.3)', backgroundColor: 'transparent',
                color: 'var(--primary)', cursor: 'pointer', marginTop: 4,
              }}>
                + Plan another post
              </button>
            </div>
          )}
        </>
      )}

      {showModal && (
        <PostModal post={editingPost} onSave={handleSave} onClose={closeModal} />
      )}
    </div>
  );
}

function PostCard({ post, onEdit, onDelete, onDuplicate, onToggleStatus, onPublish }: {
  post: ScheduledPost;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleStatus: () => void;
  onPublish: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const isEditable = post.status === 'draft' || post.status === 'scheduled';
  const statusColor: Record<string, string> = {
    scheduled: '#22c55e', draft: '#FFB020', publishing: '#4ade80', published: '#22c55e', failed: '#FF4757',
  };
  const accent = statusColor[post.status] ?? '#666';

  return (
    <>
    {/* Video lightbox */}
    {playing && post.mediaUrl && (
      <div
        onClick={() => setPlaying(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 400,
          backgroundColor: 'rgba(0,0,0,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <button onClick={() => setPlaying(false)} style={{
          position: 'absolute', top: 20, right: 24,
          background: 'rgba(255,255,255,0.12)', border: 'none',
          color: '#fff', fontSize: 22, cursor: 'pointer',
          width: 40, height: 40, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>×</button>
        <video
          src={post.mediaUrl}
          controls
          autoPlay
          onClick={e => e.stopPropagation()}
          style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 12 }}
        />
      </div>
    )}

    <div style={{
      backgroundColor: 'var(--surface)',
      border: '1px solid var(--border)',
      borderLeft: `3px solid ${accent}`,
      borderRadius: 12,
      padding: '14px 16px',
      display: 'flex', gap: 14, alignItems: 'flex-start',
    }}>
      {/* Media preview */}
      <div style={{
        width: 60, height: 78, borderRadius: 8, flexShrink: 0,
        backgroundColor: 'var(--bg)', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {post.mediaUrl ? (
          <div
            style={{ width: '100%', height: '100%', cursor: 'pointer' }}
            onClick={() => post.contentType === 'video' && setPlaying(true)}
          >
            {post.contentType === 'video' ? (
              <video src={post.mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} muted preload="metadata" />
            ) : (
              <img src={post.mediaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            )}
          </div>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{post.contentType}</span>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {post.platforms.map(p => (
              <span key={p} style={{
                width: 8, height: 8, borderRadius: '50%',
                backgroundColor: PLATFORM_COLORS[p] ?? '#666',
                display: 'inline-block',
              }} />
            ))}
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 2, textTransform: 'capitalize' }}>
              {post.platforms.join(', ')}
            </span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatScheduledDate(post.scheduledDate)}</span>
        </div>

        <p style={{
          fontSize: 13, lineHeight: 1.5, marginBottom: 12,
          color: post.caption ? 'var(--text)' : 'var(--text-muted)',
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {post.caption || `No caption · ${post.contentType}`}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isEditable && <button onClick={onEdit} style={actionBtnStyle}>Edit</button>}
          {isEditable && (
            <button onClick={onToggleStatus} style={{ ...actionBtnStyle, color: post.status === 'draft' ? '#22c55e' : '#FFB020' }}>
              {post.status === 'draft' ? 'Schedule' : 'Draft'}
            </button>
          )}
          {post.status === 'scheduled' && post.platforms.includes('tiktok') && (
            <button onClick={onPublish} style={{ ...actionBtnStyle, color: '#FF004F' }}>Post Now</button>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={onDelete} style={{ ...actionBtnStyle, color: 'var(--text-muted)', opacity: 0.5 }}>Delete</button>
        </div>
      </div>
    </div>
    </>
  );
}

const actionBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 12, fontWeight: 600, color: 'var(--text-sub)', padding: 0,
};
