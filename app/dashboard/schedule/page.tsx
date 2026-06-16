'use client';

import { useState, useEffect, useMemo } from 'react';
import { ScheduledPost, getPosts, createPost, updatePost, deletePost, formatScheduledDate } from '@/lib/posts';
import PostModal from '@/components/PostModal';

type Filter = 'all' | 'scheduled' | 'draft' | 'published';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'scheduled', label: 'Queue' },
  { id: 'draft', label: 'Drafts' },
  { id: 'published', label: 'Done' },
];

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  tiktok: '#FF004F',
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  scheduled: { label: 'Scheduled', bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
  draft: { label: 'Draft', bg: 'rgba(255,176,32,0.12)', color: '#FFB020' },
  publishing: { label: 'Publishing', bg: 'rgba(34,197,94,0.12)', color: '#4ade80' },
  published: { label: 'Published', bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
  failed: { label: 'Failed', bg: 'rgba(255,71,87,0.12)', color: '#FF4757' },
};

export default function SchedulePage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledPost | undefined>();
  const [limitError, setLimitError] = useState(false);

  useEffect(() => { getPosts().then(setPosts); }, []);

  async function refresh() { setPosts(await getPosts()); }

  async function handleSave(data: Omit<ScheduledPost, 'id' | 'createdAt'>) {
    try {
      if (editingPost) { await updatePost({ ...editingPost, ...data }); }
      else { await createPost(data); }
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

  async function handleDuplicate(post: ScheduledPost) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);
    try {
      await createPost({ ...post, status: 'draft', scheduledDate: tomorrow.toISOString() });
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

  function openEdit(post: ScheduledPost) {
    setEditingPost(post);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingPost(undefined);
  }

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

  return (
    <div style={{ padding: '40px 48px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5, marginBottom: 4 }}>Schedule</h1>
          <p style={{ color: 'var(--text-sub)', fontSize: 15 }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          backgroundColor: 'var(--primary)', color: '#000',
          padding: '10px 22px', borderRadius: 10, fontSize: 14,
          fontWeight: 800, border: 'none', cursor: 'pointer',
          boxShadow: '0 0 20px rgba(34,197,94,0.2)',
        }}>
          + New Post
        </button>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 14, overflow: 'hidden', marginBottom: 20,
      }}>
        {[
          { label: 'Total', value: posts.length, color: 'var(--text)' },
          { label: 'Scheduled', value: scheduledCount, color: '#22c55e' },
          { label: 'Drafts', value: draftCount, color: '#FFB020' },
        ].map((s, i) => (
          <div key={s.label} style={{
            padding: '18px 24px', textAlign: 'center',
            borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: s.color, marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Up next banner */}
      {nextPost && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          backgroundColor: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.25)',
          borderRadius: 12, padding: '12px 18px', marginBottom: 20,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            backgroundColor: '#22c55e', flexShrink: 0,
            boxShadow: '0 0 6px #22c55e',
          }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', letterSpacing: 0.5 }}>UP NEXT</span>
          <span style={{ fontSize: 13, color: '#4ade80', fontWeight: 600 }}>{formatScheduledDate(nextPost.scheduledDate)}</span>
          {nextPost.caption && (
            <span style={{ fontSize: 13, color: 'var(--text-sub)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              — {nextPost.caption}
            </span>
          )}
        </div>
      )}

      {/* Free plan limit banner */}
      {limitError && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', borderRadius: 12, marginBottom: 20,
          backgroundColor: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.3)',
        }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#FF4757', marginBottom: 2 }}>
              3-post limit reached
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Free plan is limited to 3 scheduled or draft posts at a time.
            </p>
          </div>
          <a href="/dashboard/settings" style={{
            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800,
            backgroundColor: 'var(--primary)', color: '#000', textDecoration: 'none',
          }}>Upgrade</a>
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

      {showModal && (
        <PostModal post={editingPost} onSave={handleSave} onClose={closeModal} />
      )}
    </div>
  );
}

function PostCard({ post, onEdit, onDelete, onDuplicate, onToggleStatus }: {
  post: ScheduledPost;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleStatus: () => void;
}) {
  const status = STATUS_CONFIG[post.status];
  const isEditable = post.status === 'draft' || post.status === 'scheduled';

  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: '1px solid',
      borderColor: post.status === 'published' ? 'rgba(34,197,94,0.2)' : post.status === 'failed' ? 'rgba(255,71,87,0.2)' : 'var(--border)',
      borderRadius: 14, padding: '16px 20px',
      display: 'flex', gap: 16, alignItems: 'flex-start',
    }}>
      {/* Thumbnail placeholder */}
      <div style={{
        width: 72, height: 88, borderRadius: 10, flexShrink: 0,
        backgroundColor: 'var(--surface-light)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {post.mediaName ? (
          <span style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: 4, wordBreak: 'break-all' }}>
            {post.mediaName.split('.').pop()?.toUpperCase()}
          </span>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{post.contentType}</span>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'capitalize' }}>
              {post.contentType}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 0.3,
              padding: '2px 8px', borderRadius: 100,
              backgroundColor: status.bg, color: status.color,
            }}>{status.label.toUpperCase()}</span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatScheduledDate(post.scheduledDate)}</span>
        </div>

        {/* Platforms */}
        <div style={{ display: 'flex', gap: 6, marginBottom: post.caption ? 8 : 0 }}>
          {post.platforms.map(p => (
            <span key={p} style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
              backgroundColor: `${PLATFORM_COLORS[p]}18`,
              color: PLATFORM_COLORS[p],
              border: `1px solid ${PLATFORM_COLORS[p]}40`,
              textTransform: 'capitalize',
            }}>{p}</span>
          ))}
        </div>

        {/* Caption */}
        {post.caption && (
          <p style={{
            fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.5, marginBottom: 10,
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>{post.caption}</p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
          {isEditable && (
            <button onClick={onEdit} style={actionBtnStyle}>Edit</button>
          )}
          <button onClick={onDuplicate} style={actionBtnStyle}>Duplicate</button>
          {isEditable && (
            <button onClick={onToggleStatus} style={{
              ...actionBtnStyle,
              color: post.status === 'draft' ? '#22c55e' : '#FFB020',
            }}>
              {post.status === 'draft' ? 'Schedule' : 'Move to draft'}
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={onDelete} style={{ ...actionBtnStyle, color: '#FF4757' }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

const actionBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 12, fontWeight: 600, color: 'var(--text-sub)', padding: 0,
};
