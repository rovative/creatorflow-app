import { Suspense } from 'react';
import { ReadonlyURLSearchParams } from 'next/navigation';

function Content({ searchParams }: { searchParams: ReadonlyURLSearchParams }) {
  const code = (searchParams as unknown as Record<string, string>).code;

  return (
    <main style={{
      minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '48px 24px', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14, backgroundColor: '#22c55e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 900, color: '#000', margin: '0 auto 28px',
        }}>CF</div>

        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 12 }}>Data Deletion Request</h1>

        {code ? (
          <>
            <p style={{ color: '#a1a1aa', fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
              Your data deletion request has been received. All personal data associated with your Creator Flow account connected via Facebook/Instagram will be permanently deleted within 30 days.
            </p>
            <div style={{
              backgroundColor: '#141414', border: '1px solid #27272a',
              borderRadius: 12, padding: '18px 24px', marginBottom: 28, textAlign: 'left',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#71717a', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>
                Confirmation code
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#22c55e', fontFamily: 'monospace' }}>{code}</div>
            </div>
            <p style={{ color: '#52525b', fontSize: 13 }}>
              Save this confirmation code for your records. If you have questions, contact us at{' '}
              <a href="mailto:support@createaflow.app" style={{ color: '#22c55e' }}>support@createaflow.app</a>.
            </p>
          </>
        ) : (
          <>
            <p style={{ color: '#a1a1aa', fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
              To request deletion of your personal data associated with Creator Flow, you can:
            </p>
            <ul style={{ color: '#a1a1aa', fontSize: 15, lineHeight: 2, textAlign: 'left', marginBottom: 28, paddingLeft: 24 }}>
              <li>Delete your account from within the app (Settings → Delete account)</li>
              <li>Email us at <a href="mailto:support@createaflow.app" style={{ color: '#22c55e' }}>support@createaflow.app</a> with your request</li>
            </ul>
            <p style={{ color: '#52525b', fontSize: 13 }}>
              All data will be permanently deleted within 30 days of your request.
            </p>
          </>
        )}
      </div>
    </main>
  );
}

export default function DataDeletionPage({ searchParams }: { searchParams: Record<string, string> }) {
  return (
    <Suspense>
      <Content searchParams={searchParams as unknown as ReadonlyURLSearchParams} />
    </Suspense>
  );
}
