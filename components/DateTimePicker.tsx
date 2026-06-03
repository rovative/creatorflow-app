'use client';

import { useState, useEffect, useRef } from 'react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function toDateVal(d: Date) { return d.toISOString().split('T')[0]; }

const navBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--text-sub)', fontSize: 20, padding: '2px 10px', borderRadius: 6,
};

function Stepper({ value, onUp, onDown, onCommit }: {
  value: string; onUp: () => void; onDown: () => void; onCommit: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  const [focused, setFocused] = useState(false);
  const holdTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const onUpRef = useRef(onUp);
  const onDownRef = useRef(onDown);
  useEffect(() => { onUpRef.current = onUp; }, [onUp]);
  useEffect(() => { onDownRef.current = onDown; }, [onDown]);

  useEffect(() => { if (!focused) setLocal(value); }, [value, focused]);

  function startHold(dir: 'up' | 'down') {
    const action = () => dir === 'up' ? onUpRef.current() : onDownRef.current();
    action();
    holdTimeout.current = setTimeout(() => {
      holdInterval.current = setInterval(action, 60);
    }, 350);
  }

  function stopHold() {
    if (holdTimeout.current) clearTimeout(holdTimeout.current);
    if (holdInterval.current) clearInterval(holdInterval.current);
  }

  const btnStyle: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-sub)', fontSize: 18, lineHeight: 1,
    padding: '6px 12px', borderRadius: 8, display: 'block', width: '100%',
    userSelect: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <button
        type="button"
        onMouseDown={() => startHold('up')}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
        onTouchStart={e => { e.preventDefault(); startHold('up'); }}
        onTouchEnd={stopHold}
        style={btnStyle}
      >▲</button>
      <input
        type="text"
        inputMode="numeric"
        value={local}
        onFocus={() => setFocused(true)}
        onChange={e => setLocal(e.target.value)}
        onBlur={() => { setFocused(false); onCommit(local); }}
        style={{
          width: 60, textAlign: 'center', padding: '10px 4px',
          backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, color: 'var(--text)', fontSize: 22, fontWeight: 700,
          lineHeight: 1, outline: 'none',
        }}
      />
      <button
        type="button"
        onMouseDown={() => startHold('down')}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
        onTouchStart={e => { e.preventDefault(); startHold('down'); }}
        onTouchEnd={stopHold}
        style={btnStyle}
      >▼</button>
    </div>
  );
}

function TimeInput({ timeVal, onChange }: { timeVal: string; onChange: (v: string) => void }) {
  const [h, m] = timeVal.split(':').map(n => parseInt(n, 10) || 0);
  const isAM = h < 12;
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;

  function setHour12(val: number) {
    const wrapped = val < 1 ? 12 : val > 12 ? 1 : val;
    const h24 = isAM ? (wrapped === 12 ? 0 : wrapped) : (wrapped === 12 ? 12 : wrapped + 12);
    onChange(`${String(h24).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
  }

  function setMinute(val: number) {
    const wrapped = val < 0 ? 59 : val >= 60 ? 0 : val;
    onChange(`${String(h).padStart(2,'0')}:${String(wrapped).padStart(2,'0')}`);
  }

  function toggleAmPm() {
    const newH = isAM ? (h === 0 ? 12 : h + 12) : (h === 12 ? 0 : h - 12);
    onChange(`${String(newH).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
  }

return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {/* Hour : Minute */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Stepper
          value={String(hour12)}
          onUp={() => setHour12(hour12 + 1)}
          onDown={() => setHour12(hour12 - 1)}
          onCommit={v => setHour12(parseInt(v) || 1)}
        />
        <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-sub)', marginTop: -4 }}>:</span>
        <Stepper
          value={String(m).padStart(2,'0')}
          onUp={() => setMinute(m + 1)}
          onDown={() => setMinute(m - 1)}
          onCommit={v => setMinute(parseInt(v) || 0)}
        />
      </div>

      {/* AM / PM segmented control */}
      <div style={{
        display: 'flex',
        backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: 3, gap: 2,
      }}>
        {(['AM', 'PM'] as const).map(period => {
          const active = (period === 'AM') === isAM;
          return (
            <button key={period} type="button" onClick={() => { if (!active) toggleAmPm(); }} style={{
              padding: '6px 22px', borderRadius: 8, fontSize: 13, fontWeight: 700,
              border: 'none', cursor: 'pointer',
              backgroundColor: active ? 'var(--primary)' : 'transparent',
              color: active ? '#000' : 'var(--text-muted)',
            }}>{period}</button>
          );
        })}
      </div>
    </div>
  );
}

interface Props {
  dateVal: string;
  timeVal: string;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
}

export default function DateTimePicker({ dateVal, timeVal, onDateChange, onTimeChange }: Props) {
  const selected = dateVal ? new Date(dateVal + 'T12:00:00') : new Date();
  const [view, setView] = useState({ month: selected.getMonth(), year: selected.getFullYear() });

  const today = new Date();
  const firstDay = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : i - firstDay + 1);

  function prev() { setView(v => v.month === 0 ? { month: 11, year: v.year - 1 } : { month: v.month - 1, year: v.year }); }
  function next() { setView(v => v.month === 11 ? { month: 0, year: v.year + 1 } : { month: v.month + 1, year: v.year }); }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Use current date & time */}
      {(() => {
        const n = new Date();
        const nh = n.getHours(); const nm = n.getMinutes();
        const ap = nh < 12 ? 'AM' : 'PM';
        const h12 = nh === 0 ? 12 : nh > 12 ? nh - 12 : nh;
        const label = `Use current date & time · Today, ${h12}:${String(nm).padStart(2,'0')} ${ap}`;
        return (
          <button type="button" onClick={() => {
            onDateChange(toDateVal(n));
            onTimeChange(`${String(nh).padStart(2,'0')}:${String(nm).padStart(2,'0')}`);
            setView({ month: n.getMonth(), year: n.getFullYear() });
          }} style={{
            padding: '9px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700,
            border: '1px solid var(--border)', backgroundColor: 'transparent',
            color: 'var(--text-sub)', cursor: 'pointer', textAlign: 'left',
          }}>
            {label}
          </button>
        );
      })()}

      {/* Calendar — always inline */}
      <div style={{
        backgroundColor: 'var(--bg)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '16px 16px 12px',
      }}>
        {/* Quick presets */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {[
            { label: 'Today', d: new Date() },
            { label: 'Tomorrow', d: (() => { const d = new Date(); d.setDate(d.getDate()+1); return d; })() },
            { label: 'Next week', d: (() => { const d = new Date(); d.setDate(d.getDate()+7); return d; })() },
          ].map(p => {
            const val = toDateVal(p.d);
            const active = dateVal === val;
            return (
              <button key={p.label} type="button" onClick={() => {
                onDateChange(val);
                setView({ month: p.d.getMonth(), year: p.d.getFullYear() });
              }} style={{
                flex: 1, padding: '7px 4px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', border: '1px solid',
                borderColor: active ? 'var(--primary)' : 'var(--border)',
                backgroundColor: active ? 'var(--primary-alpha)' : 'transparent',
                color: active ? 'var(--primary)' : 'var(--text-sub)',
              }}>{p.label}</button>
            );
          })}
        </div>

        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <button type="button" onClick={prev} style={navBtnStyle}>‹</button>
          <span style={{ fontSize: 14, fontWeight: 700 }}>{MONTHS[view.month]} {view.year}</span>
          <button type="button" onClick={next} style={navBtnStyle}>›</button>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
          {DAYS.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, padding: '2px 0' }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const d = new Date(view.year, view.month, day);
            const val = toDateVal(d);
            const isSelected = val === dateVal;
            const isToday = val === toDateVal(today);
            const isPast = d < new Date(today.toDateString());
            return (
              <button key={i} type="button" onClick={() => { if (!isPast) onDateChange(val); }} style={{
                padding: '7px 0', borderRadius: 7, fontSize: 13, fontWeight: isSelected || isToday ? 700 : 400,
                border: isToday && !isSelected ? '1px solid rgba(34,197,94,0.4)' : '1px solid transparent',
                cursor: isPast ? 'default' : 'pointer',
                backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                color: isSelected ? '#000' : isPast ? 'var(--text-muted)' : 'var(--text)',
                opacity: isPast ? 0.35 : 1,
              }}>{day}</button>
            );
          })}
        </div>
      </div>

      {/* Time — custom styled, no native browser colours */}
      <div style={{
        backgroundColor: 'var(--bg)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '16px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Time</div>
        <TimeInput timeVal={timeVal} onChange={onTimeChange} />
      </div>

    </div>
  );
}
