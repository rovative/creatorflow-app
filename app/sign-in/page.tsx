'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <main style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '24px',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.08) 0%, transparent 60%)',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img src="/logo.svg" alt="Creator Flow" width={44} height={44} style={{ display: 'block', margin: '0 auto 20px' }} />
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, marginBottom: 6 }}>Sign in</h1>
          <p style={{ color: 'var(--text-sub)', fontSize: 15 }}>Continue to Creator Flow</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-sub)' }}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-sub)' }}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>

          {error && (
            <p style={{ color: 'var(--error)', fontSize: 13, backgroundColor: 'rgba(255,71,87,0.1)', padding: '10px 14px', borderRadius: 8 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: 'var(--primary)', color: '#000',
              padding: '14px', borderRadius: 12, fontSize: 15,
              fontWeight: 800, border: 'none', cursor: 'pointer',
              marginTop: 4, opacity: loading ? 0.7 : 1,
              boxShadow: '0 0 30px rgba(34,197,94,0.2)',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'var(--text-sub)', fontSize: 14, marginTop: 24 }}>
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Sign up
          </Link>
        </p>

        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <Link href="/dashboard" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>
            Skip for now →
          </Link>
        </div>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px',
  backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 10, color: 'var(--text)', fontSize: 15, outline: 'none',
};
