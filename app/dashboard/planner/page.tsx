'use client';

import { useState } from 'react';
import NewPostModal from '@/components/NewPostModal';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Planner() {
  const [showModal, setShowModal] = useState(false);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const today = new Date();
  const [current, setCurrent] = useState({ month: today.getMonth(), year: today.getFullYear() });

  const firstDay = new Date(current.year, current.month, 1).getDay();
  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : i - firstDay + 1);

  function prevMonth() {
    setCurrent(c => c.month === 0 ? { month: 11, year: c.year - 1 } : { month: c.month - 1, year: c.year });
  }
  function nextMonth() {
    setCurrent(c => c.month === 11 ? { month: 0, year: c.year + 1 } : { month: c.month + 1, year: c.year });
  }

  return (
    <div style={{ padding: '40px 48px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5, marginBottom: 4 }}>Planner</h1>
          <p style={{ color: 'var(--text-sub)', fontSize: 15 }}>Schedule and manage your posts.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            {(['calendar', 'list'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '8px 16px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                backgroundColor: view === v ? 'var(--primary-alpha)' : 'transparent',
                color: view === v ? 'var(--primary)' : 'var(--text-sub)',
              }}>
                {v === 'calendar' ? 'Calendar' : 'List'}
              </button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)} style={{
            backgroundColor: 'var(--primary)', color: '#000',
            padding: '10px 20px', borderRadius: 10, fontSize: 14,
            fontWeight: 800, border: 'none', cursor: 'pointer',
            boxShadow: '0 0 20px rgba(34,197,94,0.2)',
          }}>
            + New Post
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', fontSize: 18 }}>‹</button>
            <span style={{ fontWeight: 800, fontSize: 16 }}>{MONTHS[current.month]} {current.year}</span>
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', fontSize: 18 }}>›</button>
          </div>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
            {DAYS.map(d => (
              <div key={d} style={{ padding: '10px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>{d}</div>
            ))}
          </div>
          {/* Cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {cells.map((day, i) => {
              const isToday = day === today.getDate() && current.month === today.getMonth() && current.year === today.getFullYear();
              return (
                <div key={i} style={{
                  minHeight: 90, padding: '10px 12px',
                  borderRight: '1px solid var(--border)',
                  borderBottom: '1px solid var(--border)',
                  backgroundColor: day ? 'transparent' : 'var(--surface-light)',
                }}>
                  {day && (
                    <span style={{
                      fontSize: 13, fontWeight: isToday ? 800 : 500,
                      color: isToday ? '#000' : 'var(--text-sub)',
                      backgroundColor: isToday ? 'var(--primary)' : 'transparent',
                      width: 24, height: 24, borderRadius: '50%',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}>{day}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '48px 24px', textAlign: 'center',
        }}>
          <p style={{ fontWeight: 700, marginBottom: 6 }}>No posts scheduled</p>
          <p style={{ color: 'var(--text-sub)', fontSize: 14, marginBottom: 20 }}>Click &ldquo;+ New Post&rdquo; to schedule your first post.</p>
          <button onClick={() => setShowModal(true)} style={{
            backgroundColor: 'var(--primary)', color: '#000',
            padding: '10px 20px', borderRadius: 10, fontSize: 14,
            fontWeight: 800, border: 'none', cursor: 'pointer',
          }}>
            + New Post
          </button>
        </div>
      )}

      {showModal && <NewPostModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
