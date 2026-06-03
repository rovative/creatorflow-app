export default function Dashboard() {
  return (
    <div style={{ padding: '40px 48px' }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5, marginBottom: 6 }}>Home</h1>
        <p style={{ color: 'var(--text-sub)', fontSize: 15 }}>Here&apos;s an overview of your content.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
        {[
          { label: 'Scheduled posts', value: '0', sub: 'This week' },
          { label: 'Published posts', value: '0', sub: 'All time' },
          { label: 'Connected platforms', value: '0', sub: 'Accounts' },
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
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Quick actions</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { href: '/dashboard/planner', label: 'Schedule a post' },
            { href: '/dashboard/profiles', label: 'Connect an account' },
            { href: '/dashboard/ai-studio', label: 'Generate a caption' },
          ].map(a => (
            <a key={a.href} href={a.href} style={{
              display: 'flex', alignItems: 'center',
              backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '12px 20px', textDecoration: 'none',
              color: 'var(--text)', fontSize: 14, fontWeight: 600,
            }}>
              {a.label}
            </a>
          ))}
        </div>
      </div>

      {/* Upcoming posts */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Upcoming posts</h2>
        <div style={{
          backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '48px 24px', textAlign: 'center',
        }}>
          <p style={{ fontWeight: 700, marginBottom: 6 }}>No posts scheduled</p>
          <p style={{ color: 'var(--text-sub)', fontSize: 14 }}>Head to the Planner to schedule your first post.</p>
        </div>
      </div>
    </div>
  );
}
