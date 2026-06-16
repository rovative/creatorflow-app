'use client';

import { useState, useEffect, useMemo } from 'react';
import { ScheduledPost, getPosts, createPost, updatePost, deletePost } from '@/lib/posts';
import PostModal from '@/components/PostModal';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  tiktok: '#FF004F',
  youtube: '#FF0000',
};

const STATUS_DOT: Record<string, string> = {
  scheduled: '#22c55e',
  draft: '#FFB020',
  published: '#22c55e',
  publishing: '#4ade80',
  failed: '#FF4757',
};

export default function Planner() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledPost | undefined>();
  const [limitError, setLimitError] = useState(false);
  const today = new Date();
  const [current, setCurrent] = useState({ month: today.getMonth(), year: today.getFullYear() });

  useEffect(() => { getPosts().then(setPosts); }, []);

  async function refresh() { setPosts(await getPosts()); }

  async function handleSave(data: Omit<ScheduledPost, 'id' | 'createdAt'>) {
    try {
      if (editingPost) await updatePost({ ...editingPost, ...data });
      else await createPost(data);
      setLimitError(false);
    } catch (e) {
      if (e instanceof Error && e.message === 'POST_LIMIT_REACHED') { setLimitError(true); return; }
    }
    await refresh();
  }

  async function handleDelete(id: string) {
    if (confirm('Delete this post?')) { await deletePost(id); await refresh(); }
  }

  function openEdit(post: ScheduledPost) { setEditingPost(post); setShowModal(true); }
  function closeModal() { setShowModal(false); setEditingPost(undefined); }

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

  const sortedPosts = useMemo(() =>
    [...posts].sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()),
    [posts]
  );

  function prevMonth() {
    setCurrent(c => c.month === 0 ? { month: 11, year: c.year - 1 } : { month: c.month - 1, year: c.year });
  }
  function nextMonth() {
    setCurrent(c => c.month === 11 ? { month: 0, year: c.year + 1 } : { month: c.month + 1, year: c.year });
  }

  return (
    <div style={{ padding: '40px 48px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5, marginBottom: 4 }}>Planner</h1>
          <p style={{ color: 'var(--text-sub)', fontSize: 15 }}>Your content calendar.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            {(['calendar', 'list'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '8px 16px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                backgroundColor: view === v ? 'var(--primary-alpha)' : 'transparent',
                color: view === v ? 'var(--primary)' : 'var(--text-sub)',
              }}>
                {v === 'calendar' ? 'Calendar' : 'List'}
              </button>
            ))}
          </div>
          <button onClick={() => { setEditingPost(undefined); setShowModal(true); }} style={{
            backgroundColor: 'var(--primary)', color: '#000',
            padding: '10px 20px', borderRadius: 10, fontSize: 14,
            fontWeight: 800, border: 'none', cursor: 'pointer',
            boxShadow: '0 0 20px rgba(34,197,94,0.2)',
          }}>
            + New Post
          </button>
        </div>
      </div>

      {limitError && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', borderRadius: 12, marginBottom: 20,
          backgroundColor: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.3)',
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#FF4757' }}>
            Free plan limit reached — max 3 active posts.
          </p>
          <a href="/dashboard/settings" style={{
            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800,
            backgroundColor: 'var(--primary)', color: '#000', textDecoration: 'none',
          }}>Upgrade</a>
        </div>
      )}

      {view === 'calendar' ? (
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>‹</button>
            <span style={{ fontWeight: 800, fontSize: 16 }}>{MONTHS[current.month]} {current.year}</span>
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>›</button>
          </div>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
            {DAYS.map(d => (
              <div key={d} style={{ padding: '10px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>{d}</div>
            ))}
          </div>
          {/* Cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {cells.map((day, i) => {
              const isToday = day === today.getDate() && current.month === today.getMonth() && current.year === today.getFullYear();
              const dayPosts = day ? (postsByDay[day] ?? []) : [];
              return (
                <div key={i} style={{
                  minHeight: 90, padding: '8px 10px',
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
                            <span style={{
                              width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                              backgroundColor: STATUS_DOT[post.status] ?? '#666',
                            }} />
                            <span style={{
                              fontSize: 10, fontWeight: 600, color: 'var(--text)',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
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
      ) : (
        /* List view */
        sortedPosts.length === 0 ? (
          <div style={{
            backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '56px 24px', textAlign: 'center',
          }}>
            <p style={{ fontWeight: 700, marginBottom: 6 }}>No posts yet</p>
            <p style={{ color: 'var(--text-sub)', fontSize: 14, marginBottom: 20 }}>Click &ldquo;+ New Post&rdquo; to schedule your first post.</p>
            <button onClick={() => setShowModal(true)} style={{
              backgroundColor: 'var(--primary)', color: '#000',
              padding: '10px 20px', borderRadius: 10, fontSize: 14,
              fontWeight: 800, border: 'none', cursor: 'pointer',
            }}>+ New Post</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sortedPosts.map(post => {
              const d = new Date(post.scheduledDate);
              return (
                <div key={post.id} style={{
                  backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 14, padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: 16,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, backgroundColor: STATUS_DOT[post.status] ?? '#666' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 14, fontWeight: 600, marginBottom: 4,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {post.caption || `${post.contentType} post`}
                    </p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {post.platforms.map(p => (
                        <span key={p} style={{
                          fontSize: 10, fontWeight: 700, textTransform: 'capitalize',
                          color: PLATFORM_COLORS[p] ?? 'var(--text-muted)',
                          backgroundColor: `${PLATFORM_COLORS[p] ?? '#666'}18`,
                          padding: '1px 7px', borderRadius: 100,
                          border: `1px solid ${PLATFORM_COLORS[p] ?? '#666'}40`,
                        }}>{p}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>
                      {d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-sub)' }}>
                      {d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </div>
                  </div>
                  <button onClick={() => openEdit(post)} style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    border: '1px solid var(--border)', backgroundColor: 'transparent',
                    color: 'var(--text-sub)', cursor: 'pointer', flexShrink: 0,
                  }}>Edit</button>
                  <button onClick={() => handleDelete(post.id)} style={{
                    padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    border: '1px solid rgba(255,71,87,0.3)', backgroundColor: 'transparent',
                    color: '#FF4757', cursor: 'pointer', flexShrink: 0,
                  }}>✕</button>
                </div>
              );
            })}
          </div>
        )
      )}

      {showModal && (
        <PostModal post={editingPost} onSave={handleSave} onClose={closeModal} />
      )}
    </div>
  );
}
