'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { getProfiles, getActiveProfile, setActiveProfile, CreatorProfile } from '@/lib/profiles';

const NAV = [
  { href: '/dashboard', label: 'Home' },
  { href: '/dashboard/schedule', label: 'Schedule' },
  { href: '/dashboard/research', label: 'Research' },
  { href: '/dashboard/profiles', label: 'Profiles' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profiles, setProfiles] = useState<CreatorProfile[]>([]);
  const [active, setActive] = useState<CreatorProfile | null>(null);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([getProfiles(), getActiveProfile()]).then(([ps, a]) => {
      setProfiles(ps);
      setActive(a);
    });
  }, [pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function switchProfile(p: CreatorProfile) {
    setActiveProfile(p.id);
    setActive(p);
    setOpen(false);
    router.refresh();
  }

  return (
    <aside style={{
      width: 220, flexShrink: 0,
      backgroundColor: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      padding: '24px 16px', position: 'sticky', top: 0, height: '100vh',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, paddingLeft: 8 }}>
        <img src="/logo.svg" alt="Creator Flow" width={32} height={32} />
        <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: -0.3 }}>Creator Flow</span>
      </div>

      {/* Profile switcher */}
      {active && (
        <div ref={dropdownRef} style={{ position: 'relative', marginBottom: 20 }}>
          <button onClick={() => setOpen(o => !o)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
            border: '1px solid var(--border)', backgroundColor: 'var(--bg)',
            textAlign: 'left',
          }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>{active.emoji}</span>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {active.name}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{open ? '▲' : '▼'}</span>
          </button>

          {open && profiles.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
              marginTop: 4, backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 10,
              overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            }}>
              {profiles.map(p => (
                <button key={p.id} onClick={() => switchProfile(p)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                  backgroundColor: p.id === active.id ? 'var(--primary-alpha)' : 'transparent',
                }}>
                  <span style={{ fontSize: 16, lineHeight: 1 }}>{p.emoji}</span>
                  <span style={{
                    flex: 1, fontSize: 13, fontWeight: 600,
                    color: p.id === active.id ? 'var(--primary)' : 'var(--text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{p.name}</span>
                  {p.id === active.id && <span style={{ fontSize: 10, color: 'var(--primary)' }}>✓</span>}
                </button>
              ))}
              <div style={{ height: 1, backgroundColor: 'var(--border)' }} />
              <Link href="/dashboard/profiles" onClick={() => setOpen(false)} style={{
                display: 'block', padding: '10px 14px', fontSize: 12, fontWeight: 600,
                color: 'var(--text-muted)', textDecoration: 'none',
              }}>
                + Manage profiles
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center',
              padding: '10px 12px', borderRadius: 10,
              textDecoration: 'none', fontSize: 14, fontWeight: active ? 700 : 500,
              color: active ? 'var(--primary)' : 'var(--text-sub)',
              backgroundColor: active ? 'var(--primary-alpha)' : 'transparent',
            }}>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <Link href="/dashboard/settings" style={{
          display: 'flex', alignItems: 'center',
          padding: '10px 12px', borderRadius: 10,
          textDecoration: 'none', fontSize: 14, fontWeight: 500,
          color: 'var(--text-sub)',
        }}>
          Settings
        </Link>
      </div>
    </aside>
  );
}
