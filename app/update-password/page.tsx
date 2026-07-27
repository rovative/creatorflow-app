'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setDone(true);
    setTimeout(() => router.push('/dashboard'), 2000);
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'var(--bg)', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 400,
        backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 20, padding: '40px 36px',
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Set new password</h1>
        <p style={{ fontSize: 14, color: 'var(--text-sub)', marginBottom: 28 }}>Enter a new password for your account.</p>

        {done ? (
          <p style={{ fontSize: 14, color: '#22c55e', fontWeight: 600 }}>Password updated! Redirecting…</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                padding: '12px 16px', borderRadius: 10, fontSize: 14,
                backgroundColor: 'var(--bg)', border: '1px solid var(--border)',
                color: 'var(--text)', outline: 'none', width: '100%',
              }}
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              style={{
                padding: '12px 16px', borderRadius: 10, fontSize: 14,
                backgroundColor: 'var(--bg)', border: '1px solid var(--border)',
                color: 'var(--text)', outline: 'none', width: '100%',
              }}
            />
            {error && <p style={{ fontSize: 13, color: '#FF4757' }}>{error}</p>}
            <button type="submit" disabled={loading} style={{
              padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 800,
              backgroundColor: 'var(--primary)', color: '#000', border: 'none',
              cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
