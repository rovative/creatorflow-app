'use client';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Settings() {
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/sign-in');
  }

  return (
    <div style={{ padding: '40px 48px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5, marginBottom: 4 }}>Settings</h1>
        <p style={{ color: 'var(--text-sub)', fontSize: 15 }}>Manage your account.</p>
      </div>

      <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{
          backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '20px 24px',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Version</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Creator Flow Web — Early Access</div>
        </div>

        <div style={{
          backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Sign out</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>You&apos;ll be returned to the sign in page</div>
          </div>
          <button onClick={handleSignOut} style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
            cursor: 'pointer', border: '1px solid var(--border)',
            backgroundColor: 'transparent', color: 'var(--text-sub)',
          }}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
