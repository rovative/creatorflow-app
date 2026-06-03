'use client';

import { useRef, useEffect, useCallback } from 'react';

const ITEM_H = 40;

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

function ScrollColumn({
  items,
  selected,
  onSelect,
  format,
}: {
  items: number[];
  selected: number;
  onSelect: (val: number) => void;
  format: (n: number) => string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const ignoreScroll = useRef(false);

  const scrollTo = useCallback((val: number, smooth = true) => {
    const el = ref.current;
    if (!el) return;
    const idx = items.indexOf(val);
    if (idx === -1) return;
    ignoreScroll.current = true;
    el.scrollTo({ top: idx * ITEM_H, behavior: smooth ? 'smooth' : 'instant' });
    setTimeout(() => { ignoreScroll.current = false; }, 400);
  }, [items]);

  // Initial scroll without animation
  useEffect(() => { scrollTo(selected, false); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll when selected changes externally
  useEffect(() => { scrollTo(selected, true); }, [selected, scrollTo]);

  function handleScroll() {
    if (ignoreScroll.current) return;
    const el = ref.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / ITEM_H);
    const val = items[Math.min(idx, items.length - 1)];
    if (val !== selected) onSelect(val);
  }

  return (
    <div style={{ position: 'relative', width: 64 }}>
      {/* Selection highlight */}
      <div style={{
        position: 'absolute', top: '50%', left: 0, right: 0,
        height: ITEM_H, transform: 'translateY(-50%)',
        backgroundColor: 'var(--primary-alpha)',
        border: '1px solid rgba(34,197,94,0.3)',
        borderRadius: 8, pointerEvents: 'none', zIndex: 1,
      }} />
      {/* Fade top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_H,
        background: 'linear-gradient(to bottom, var(--surface), transparent)',
        pointerEvents: 'none', zIndex: 2,
      }} />
      {/* Fade bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_H,
        background: 'linear-gradient(to top, var(--surface), transparent)',
        pointerEvents: 'none', zIndex: 2,
      }} />
      <div
        ref={ref}
        onScroll={handleScroll}
        style={{
          height: ITEM_H * 3,
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <style>{`.scroll-col::-webkit-scrollbar{display:none}`}</style>
        {/* Padding items */}
        <div style={{ height: ITEM_H }} />
        {items.map(v => (
          <div
            key={v}
            onClick={() => onSelect(v)}
            style={{
              height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
              scrollSnapAlign: 'center', cursor: 'pointer',
              fontSize: 16, fontWeight: v === selected ? 700 : 400,
              color: v === selected ? 'var(--primary)' : 'var(--text-muted)',
              transition: 'color 0.15s',
            }}
          >
            {format(v)}
          </div>
        ))}
        <div style={{ height: ITEM_H }} />
      </div>
    </div>
  );
}

interface Props {
  value: string; // HH:MM
  onChange: (val: string) => void;
}

export default function TimePicker({ value, onChange }: Props) {
  const [hStr, mStr] = value.split(':');
  const hour = parseInt(hStr ?? '12', 10);
  const minute = Math.round(parseInt(mStr ?? '0', 10) / 5) * 5 % 60;

  function setHour(h: number) {
    onChange(`${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
  }
  function setMinute(m: number) {
    onChange(`${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }

  const display12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour < 12 ? 'AM' : 'PM';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 4,
      backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '8px 16px',
    }}>
      <ScrollColumn
        items={Array.from({ length: 12 }, (_, i) => i + 1)}
        selected={display12}
        onSelect={h => {
          const h24 = ampm === 'AM' ? (h === 12 ? 0 : h) : (h === 12 ? 12 : h + 12);
          onChange(`${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
        }}
        format={n => String(n)}
      />
      <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-sub)', marginBottom: 2 }}>:</span>
      <ScrollColumn
        items={MINUTES}
        selected={minute}
        onSelect={setMinute}
        format={n => String(n).padStart(2, '0')}
      />
      <ScrollColumn
        items={[0, 1]}
        selected={ampm === 'AM' ? 0 : 1}
        onSelect={v => {
          const newHour = v === 0
            ? (hour >= 12 ? hour - 12 : hour)
            : (hour < 12 ? hour + 12 : hour);
          setHour(newHour);
        }}
        format={n => n === 0 ? 'AM' : 'PM'}
      />
    </div>
  );
}
