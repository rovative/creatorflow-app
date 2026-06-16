'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/dashboard', label: 'Home' },
  { href: '/dashboard/schedule', label: 'Schedule' },
  { href: '/dashboard/research', label: 'Research' },
  { href: '/dashboard/profiles', label: 'Profiles' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: 220, flexShrink: 0,
      backgroundColor: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      padding: '24px 16px', position: 'sticky', top: 0, height: '100vh',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36, paddingLeft: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          backgroundColor: 'var(--primary)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 900, color: '#000',
        }}>CF</div>
        <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: -0.3 }}>Creator Flow</span>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex', alignItems: 'center',
                padding: '10px 12px', borderRadius: 10,
                textDecoration: 'none', fontSize: 14, fontWeight: active ? 700 : 500,
                color: active ? 'var(--primary)' : 'var(--text-sub)',
                backgroundColor: active ? 'var(--primary-alpha)' : 'transparent',
                transition: 'all 0.15s',
              }}
            >
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
