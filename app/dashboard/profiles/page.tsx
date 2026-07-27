'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CreatorProfile, getProfiles, createProfile, updateProfile, deleteProfile, getActiveProfile, setActiveProfile } from '@/lib/profiles';
import EditProfileModal from '@/components/EditProfileModal';
import { supabase } from '@/lib/supabase';

type PlatformConnection = { id: string; platform: string; platform_username: string | null };

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: '#FF004F', instagram: '#E1306C', youtube: '#FF0000',
};

const PLATFORM_META: Record<string, { bg: string; icon: React.ReactNode }> = {
  tiktok: {
    bg: '#010101',
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="15" height="15">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.16 8.16 0 0 0 4.77 1.52V6.76a4.85 4.85 0 0 1-1-.07z"/>
      </svg>
    ),
  },
  instagram: {
    bg: 'linear-gradient(45deg, #f09433, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888)',
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="15" height="15">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  youtube: {
    bg: '#FF0000',
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
        <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.55 12 3.55 12 3.55s-7.54 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.46 20.45 12 20.45 12 20.45s7.54 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z"/>
      </svg>
    ),
  },
};

function SearchParamToast({ setToast }: { setToast: (msg: string) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    if (connected === 'tiktok') setToast('TikTok connected successfully!');
    if (connected === 'instagram') setToast('Instagram connected successfully!');
    if (error) setToast(`Connection failed: ${error.replace(/_/g, ' ')}`);
    if (connected || error) window.history.replaceState({}, '', '/dashboard/profiles');
  }, [searchParams, setToast]);
  return null;
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<CreatorProfile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CreatorProfile | null>(null);
  const [connections, setConnections] = useState<PlatformConnection[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [openPopup, setOpenPopup] = useState<string | null>(null);

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }
  }, [toast]);

  useEffect(() => {
    (async () => {
      const [ps, active] = await Promise.all([getProfiles(), getActiveProfile()]);
      setProfiles(ps);
      setActiveId(active?.id ?? null);
    })();
  }, []);

  useEffect(() => {
    if (!activeId) return;
    supabase.from('platform_connections')
      .select('id, platform, platform_username')
      .eq('profile_id', activeId)
      .then(({ data }) => setConnections(data ?? []));
  }, [activeId]);

  async function refresh() {
    const [ps, active] = await Promise.all([getProfiles(), getActiveProfile()]);
    setProfiles(ps);
    setActiveId(active?.id ?? null);
  }

  async function handleSave(data: Omit<CreatorProfile, 'id' | 'createdAt'>) {
    if (editing) await updateProfile({ ...editing, ...data });
    else await createProfile(data);
    await refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this profile?')) return;
    await deleteProfile(id);
    await refresh();
  }

  function handleSwitch(id: string) {
    setActiveProfile(id);
    refresh();
  }

  async function handleDisconnect(platform: string) {
    if (!activeId) return;
    await supabase.from('platform_connections').delete().eq('profile_id', activeId).eq('platform', platform);
    setConnections(prev => prev.filter(c => c.platform !== platform));
  }

  function openEdit(p: CreatorProfile) { setEditing(p); setShowModal(true); }
  function openNew() { setEditing(null); setShowModal(true); }
  function closeModal() { setShowModal(false); setEditing(null); }

  const active = profiles.find(p => p.id === activeId);

  return (
    <div style={{ padding: '40px 48px', maxWidth: 900, margin: '0 auto' }}>
      <Suspense>
        <SearchParamToast setToast={(msg) => setToast(msg)} />
      </Suspense>
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 1000,
          backgroundColor: toast.includes('failed') ? '#ff4757' : '#22c55e',
          color: '#000', padding: '12px 20px', borderRadius: 12,
          fontSize: 14, fontWeight: 700, boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>{toast}</div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5, marginBottom: 4 }}>Profiles</h1>
          <p style={{ color: 'var(--text-sub)', fontSize: 15 }}>
            {profiles.length === 0 ? 'Create a profile to personalise AI outputs' : `${profiles.length} profile${profiles.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={openNew} style={{
          backgroundColor: 'var(--primary)', color: '#000',
          padding: '10px 22px', borderRadius: 10, fontSize: 14,
          fontWeight: 800, border: 'none', cursor: 'pointer',
          boxShadow: '0 0 20px rgba(34,197,94,0.2)',
        }}>+ New Profile</button>
      </div>

      {profiles.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '56px 24px', textAlign: 'center',
        }}>
          <p style={{ fontWeight: 700, marginBottom: 8 }}>No profiles yet</p>
          <p style={{ color: 'var(--text-sub)', fontSize: 14, marginBottom: 24 }}>
            Profiles tell the AI who you are — your niche, style, and audience — so every output is specific to you, not generic.
          </p>
          <button onClick={openNew} style={{
            backgroundColor: 'var(--primary)', color: '#000',
            padding: '10px 22px', borderRadius: 10, fontSize: 14,
            fontWeight: 800, border: 'none', cursor: 'pointer',
          }}>Create your first profile</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {active && (
            <div style={{
              backgroundColor: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: 16, padding: '20px 24px', marginBottom: 4,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', letterSpacing: 0.5, marginBottom: 14 }}>ACTIVE PROFILE</div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14, fontSize: 26, flexShrink: 0,
                  backgroundColor: 'var(--surface)', border: '1px solid rgba(34,197,94,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{active.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 8 }}>{active.name}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {active.platforms.map(p => (
                      <span key={p} style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                        backgroundColor: `${PLATFORM_COLORS[p]}18`, color: PLATFORM_COLORS[p],
                        border: `1px solid ${PLATFORM_COLORS[p]}40`, textTransform: 'capitalize',
                      }}>{p}</span>
                    ))}
                    {active.niches.map(n => (
                      <span key={n} style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 100,
                        backgroundColor: 'rgba(34,197,94,0.08)', color: '#4ade80',
                        border: '1px solid rgba(34,197,94,0.2)',
                      }}>{n}</span>
                    ))}
                  </div>
                  {active.aiSummary && (
                    <p style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.6 }}>{active.aiSummary}</p>
                  )}
                </div>
                <button onClick={() => openEdit(active)} style={actionBtnStyle}>Edit</button>
              </div>

              {/* Platform connections — always visible */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(34,197,94,0.15)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 }}>
                  Connected accounts
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(['tiktok', 'instagram', 'youtube'] as const).map(platform => {
                    const conn = connections.find(c => c.platform === platform);
                    const meta = PLATFORM_META[platform];
                    return (
                      <div key={platform} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* Brand icon */}
                        <div style={{
                          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                          background: meta.bg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {meta.icon}
                        </div>

                        {/* Name */}
                        <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{platform}</span>

                        {/* Spacer */}
                        <div style={{ flex: 1 }} />

                        {/* Right side */}
                        {conn ? (
                          <button
                            onClick={() => setOpenPopup(platform)}
                            style={{
                              fontSize: 11, fontWeight: 700, color: '#22c55e',
                              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
                              borderRadius: 6, padding: '3px 10px', cursor: 'pointer',
                            }}
                          >Connected</button>
                        ) : platform === 'tiktok' ? (
                          <a href={`/api/auth/tiktok?profileId=${active.id}`} style={{
                            fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 7,
                            backgroundColor: 'transparent', color: 'var(--text-sub)',
                            border: '1px solid var(--border)', textDecoration: 'none',
                          }}>Connect</a>
                        ) : platform === 'instagram' ? (
                          <a href={`/api/auth/instagram?profileId=${active.id}`} style={{
                            fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 7,
                            backgroundColor: 'transparent', color: 'var(--text-sub)',
                            border: '1px solid var(--border)', textDecoration: 'none',
                          }}>Connect</a>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Coming soon</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {profiles.filter(p => p.id !== activeId).map(profile => (
            <div key={profile.id} style={{
              backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, fontSize: 22, flexShrink: 0,
                backgroundColor: 'var(--bg)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{profile.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 5 }}>{profile.name}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {profile.platforms.map(p => (
                    <span key={p} style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100,
                      backgroundColor: `${PLATFORM_COLORS[p]}18`, color: PLATFORM_COLORS[p],
                      border: `1px solid ${PLATFORM_COLORS[p]}40`, textTransform: 'capitalize',
                    }}>{p}</span>
                  ))}
                  {profile.niches.slice(0, 3).map(n => (
                    <span key={n} style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 100,
                      backgroundColor: 'var(--surface-light)', color: 'var(--text-muted)',
                      border: '1px solid var(--border)',
                    }}>{n}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button onClick={() => handleSwitch(profile.id)} style={{
                  padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  border: '1px solid var(--primary)', backgroundColor: 'var(--primary-alpha)',
                  color: 'var(--primary)', cursor: 'pointer',
                }}>Set active</button>
                <button onClick={() => openEdit(profile)} style={actionBtnStyle}>Edit</button>
                <button onClick={() => handleDelete(profile.id)} style={{ ...actionBtnStyle, color: '#FF4757' }}>Delete</button>
              </div>
            </div>
          ))}

          <button onClick={openNew} style={{
            padding: '16px', borderRadius: 14, fontSize: 14, fontWeight: 600,
            border: '2px dashed rgba(34,197,94,0.3)', backgroundColor: 'transparent',
            color: 'var(--primary)', cursor: 'pointer', marginTop: 4,
          }}>+ Add another profile</button>
        </div>
      )}

      {showModal && (
        <EditProfileModal profile={editing} onSave={handleSave} onClose={closeModal} />
      )}

      {openPopup && (() => {
        const platform = openPopup;
        const conn = connections.find(c => c.platform === platform);
        const meta = PLATFORM_META[platform];
        if (!conn) return null;
        return (
          <div
            onClick={() => setOpenPopup(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 300,
              backgroundColor: 'rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 20, width: '100%', maxWidth: 340, padding: '28px 28px 24px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
              }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: meta.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 14,
              }}>
                <div style={{ transform: 'scale(2)' }}>{meta.icon}</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, textTransform: 'capitalize', marginBottom: 4 }}>{platform}</div>
              {conn.platform_username && (
                <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 6 }}>@{conn.platform_username}</div>
              )}
              <div style={{
                fontSize: 11, fontWeight: 700, color: '#22c55e',
                backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: 100, padding: '3px 12px', marginBottom: 24,
              }}>Connected</div>
              <button
                onClick={async () => {
                  if (confirm(`Disconnect ${platform}?`)) {
                    await handleDisconnect(platform);
                    setOpenPopup(null);
                  }
                }}
                style={{
                  width: '100%', padding: '11px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                  backgroundColor: 'rgba(255,71,87,0.08)', color: '#FF4757',
                  border: '1px solid rgba(255,71,87,0.25)', cursor: 'pointer', marginBottom: 8,
                }}
              >Disconnect</button>
              <button
                onClick={() => setOpenPopup(null)}
                style={{
                  width: '100%', padding: '11px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                  backgroundColor: 'transparent', color: 'var(--text-muted)',
                  border: '1px solid var(--border)', cursor: 'pointer',
                }}
              >Close</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

const actionBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 13, fontWeight: 600, color: 'var(--text-sub)', padding: 0,
};
