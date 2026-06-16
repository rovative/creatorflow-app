'use client';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Settings() {
  const router = useRouter();
  const [resetting, setResetting] = useState(false);
  const [email, setEmail] = useState('');
  const [tier, setTier] = useState<string>('free');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setEmail(user.email ?? '');
      supabase.from('user_tiers').select('tier').eq('user_id', user.id).single()
        .then(({ data }) => { if (data?.tier) setTier(data.tier); });
    });
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/sign-in');
  }

  async function handleResetOnboarding() {
    if (!confirm('Delete all profiles and restart onboarding?')) return;
    setResetting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from('profiles').delete().eq('user_id', user.id);
    localStorage.removeItem('cf_active_profile');
    router.push('/onboarding');
  }

  return (
    <div style={{ padding: '40px 48px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5, marginBottom: 4 }}>Settings</h1>
        <p style={{ color: 'var(--text-sub)', fontSize: 15 }}>Manage your account.</p>
      </div>

      <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Account */}
        <div style={{
          backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>Account</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{email || '—'}</div>
          </div>
          <div style={{ height: 1, backgroundColor: 'var(--border)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>Plan</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 13, fontWeight: 800, padding: '3px 10px', borderRadius: 100,
                  backgroundColor: tier === 'pro' ? 'var(--primary-alpha)' : 'rgba(255,255,255,0.06)',
                  color: tier === 'pro' ? 'var(--primary)' : 'var(--text-muted)',
                  border: `1px solid ${tier === 'pro' ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                }}>
                  {tier === 'pro' ? 'Pro' : 'Free'}
                </span>
                {tier === 'free' && (
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>3 posts · No AI</span>
                )}
                {tier === 'pro' && (
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Unlimited posts · AI included</span>
                )}
              </div>
            </div>
            {tier === 'free' && (
              <button style={{
                padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 800,
                border: 'none', backgroundColor: 'var(--primary)', color: '#000', cursor: 'pointer',
              }}>
                Upgrade
              </button>
            )}
          </div>
        </div>

        {/* Sign out */}
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

        {/* Reset onboarding */}
        <div style={{
          backgroundColor: 'rgba(255,176,32,0.05)', border: '1px solid rgba(255,176,32,0.2)',
          borderRadius: 16, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Reset onboarding</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Deletes all profiles — for testing only</div>
          </div>
          <button onClick={handleResetOnboarding} disabled={resetting} style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
            cursor: resetting ? 'default' : 'pointer', border: '1px solid rgba(255,176,32,0.4)',
            backgroundColor: 'transparent', color: '#FFB020', opacity: resetting ? 0.5 : 1,
          }}>
            {resetting ? 'Resetting…' : 'Reset'}
          </button>
        </div>
      </div>
    </div>
  );
}
