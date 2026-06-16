'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ScheduledPost, getPosts, formatScheduledDate } from '@/lib/posts';
import { getProfiles, getActiveProfile } from '@/lib/profiles';

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  tiktok: '#FF004F',
  youtube: '#FF0000',
};

export default function Dashboard() {
  const router = useRouter();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfiles().then(ps => {
      if (ps.length === 0) { router.replace('/onboarding'); return; }
    });
    getActiveProfile().then(p => {
      if (p) getPosts(p.id).then(data => { setPosts(data); setLoading(false); });
      else setLoading(false);
    });
  }, [router]);

  const now = new Date();
  const weekEnd = new Date(now); weekEnd.setDate(now.getDate() + 7);

  const scheduledThisWeek = posts.filter(p =>
    p.status === 'scheduled' &&
    new Date(p.scheduledDate) >= now &&
    new Date(p.scheduledDate) <= weekEnd
  ).length;

  const publishedAllTime = posts.filter(p => p.status === 'published').length;

  const upcoming = posts
    .filter(p => p.status === 'scheduled' && new Date(p.scheduledDate) >= now)
    .slice(0, 5);

  return (
    <div style={{ padding: '40px 48px' }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5, marginBottom: 6 }}>Home</h1>
        <p style={{ color: 'var(--text-sub)', fontSize: 15 }}>Here&apos;s an overview of your content.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
        {[
          { label: 'Scheduled posts', value: loading ? '—' : String(scheduledThisWeek), sub: 'This week' },
          { label: 'Published posts', value: loading ? '—' : String(publishedAllTime), sub: 'All time' },
          { label: 'Drafts', value: loading ? '—' : String(posts.filter(p => p.status === 'draft').length), sub: 'In progress' },
        ].map((s) => (
          <div key={s.label} style={{
            backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '24px',
          }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--primary)', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Quick actions</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { href: '/dashboard/schedule', label: '+ New post' },
            { href: '/dashboard/profiles', label: 'Manage profiles' },
            { href: '/dashboard/research', label: 'Research ideas' },
          ].map(a => (
            <Link key={a.href} href={a.href} style={{
              display: 'flex', alignItems: 'center',
              backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '12px 20px', textDecoration: 'none',
              color: 'var(--text)', fontSize: 14, fontWeight: 600,
            }}>
              {a.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Upcoming posts */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800 }}>Upcoming posts</h2>
          {upcoming.length > 0 && (
            <Link href="/dashboard/schedule" style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
              View all →
            </Link>
          )}
        </div>

        {loading ? (
          <div style={{
            backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '48px 24px', textAlign: 'center',
          }}>
            <p style={{ color: 'var(--text-sub)', fontSize: 14 }}>Loading...</p>
          </div>
        ) : upcoming.length === 0 ? (
          <div style={{
            backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '48px 24px', textAlign: 'center',
          }}>
            <p style={{ fontWeight: 700, marginBottom: 6 }}>No posts scheduled</p>
            <p style={{ color: 'var(--text-sub)', fontSize: 14, marginBottom: 20 }}>
              Head to Schedule to plan your first post.
            </p>
            <Link href="/dashboard/schedule" style={{
              display: 'inline-block',
              backgroundColor: 'var(--primary)', color: '#000',
              padding: '10px 22px', borderRadius: 10, fontSize: 14,
              fontWeight: 800, textDecoration: 'none',
            }}>
              + New Post
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upcoming.map(post => (
              <div key={post.id} style={{
                backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  backgroundColor: '#22c55e', boxShadow: '0 0 6px #22c55e', flexShrink: 0,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 13, color: 'var(--text)', fontWeight: 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4,
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
                <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
                  {formatScheduledDate(post.scheduledDate)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
