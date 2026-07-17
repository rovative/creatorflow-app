'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/onboarding');
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
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, marginBottom: 6 }}>Create your account</h1>
          <p style={{ color: 'var(--text-sub)', fontSize: 15 }}>Start scheduling in minutes — it&apos;s free</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-sub)' }}>Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              style={inputStyle}
            />
          </div>
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
              placeholder="Min. 6 characters"
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
            {loading ? 'Creating account...' : 'Get Started — Free'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 16, lineHeight: 1.6 }}>
          By signing up, you agree to our{' '}
          <a href="https://createaflow.app/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-sub)', textDecoration: 'underline' }}>Terms of Service</a>
          {' '}and{' '}
          <a href="https://createaflow.app/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-sub)', textDecoration: 'underline' }}>Privacy Policy</a>.
        </p>

        <p style={{ textAlign: 'center', color: 'var(--text-sub)', fontSize: 14, marginTop: 16 }}>
          Already have an account?{' '}
          <Link href="/sign-in" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px',
  backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 10, color: 'var(--text)', fontSize: 15, outline: 'none',
};
