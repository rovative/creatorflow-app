'use client';

import { useState, useEffect } from 'react';
import { CreatorProfile, getProfiles, createProfile, updateProfile, deleteProfile, getActiveProfile, setActiveProfile } from '@/lib/profiles';
import EditProfileModal from '@/components/EditProfileModal';

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: '#FF004F', instagram: '#E1306C', youtube: '#FF0000',
};

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<CreatorProfile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CreatorProfile | null>(null);

  useEffect(() => {
    setProfiles(getProfiles());
    setActiveId(getActiveProfile()?.id ?? null);
  }, []);

  function refresh() {
    setProfiles(getProfiles());
    setActiveId(getActiveProfile()?.id ?? null);
  }

  function handleSave(data: Omit<CreatorProfile, 'id' | 'createdAt'>) {
    if (editing) updateProfile({ ...editing, ...data });
    else createProfile(data);
    refresh();
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this profile?')) return;
    deleteProfile(id);
    refresh();
  }

  function handleSwitch(id: string) {
    setActiveProfile(id);
    refresh();
  }

  function openEdit(p: CreatorProfile) { setEditing(p); setShowModal(true); }
  function openNew() { setEditing(null); setShowModal(true); }
  function closeModal() { setShowModal(false); setEditing(null); }

  const active = profiles.find(p => p.id === activeId);

  return (
    <div style={{ padding: '40px 48px', maxWidth: 900, margin: '0 auto' }}>
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
    </div>
  );
}

const actionBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 13, fontWeight: 600, color: 'var(--text-sub)', padding: 0,
};
