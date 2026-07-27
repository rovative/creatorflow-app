'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Props {
  file: File;
  onSave: (file: File) => void;
  onClose: () => void;
}

type DragHandle = 'move' | 'nw' | 'ne' | 'sw' | 'se';
type CropBox = { x: number; y: number; w: number; h: number }; // percentages 0-100

const ASPECTS = [
  { label: '9:16', value: 9 / 16 },
  { label: '1:1', value: 1 },
  { label: '16:9', value: 16 / 9 },
  { label: 'Free', value: null as number | null },
];

export default function MediaEditor({ file, onSave, onClose }: Props) {
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [cropBox, setCropBox] = useState<CropBox>({ x: 10, y: 10, w: 80, h: 80 });
  const [lockedAspect, setLockedAspect] = useState<number | null>(null);
  const [url, setUrl] = useState('');
  const isVideo = file.type.startsWith('video/');
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ handle: DragHandle; startX: number; startY: number; startBox: CropBox } | null>(null);

  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const transform = [
    rotation !== 0 ? `rotate(${rotation}deg)` : '',
    flipH ? 'scaleX(-1)' : '',
    flipV ? 'scaleY(-1)' : '',
  ].filter(Boolean).join(' ') || 'none';

  // Crop drag handlers
  const onPointerDown = useCallback((handle: DragHandle, e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { handle, startX: e.clientX, startY: e.clientY, startBox: { ...cropBox } };
  }, [cropBox]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current || !containerRef.current) return;
    const { handle, startX, startY, startBox } = dragRef.current;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - startX) / rect.width) * 100;
    const dy = ((e.clientY - startY) / rect.height) * 100;

    setCropBox(prev => {
      let { x, y, w, h } = startBox;

      if (handle === 'move') {
        x = Math.max(0, Math.min(100 - w, x + dx));
        y = Math.max(0, Math.min(100 - h, y + dy));
      } else {
        if (handle === 'nw') { x = Math.min(x + w - 10, x + dx); w = Math.max(10, w - dx); y = Math.min(y + h - 10, y + dy); h = Math.max(10, h - dy); }
        if (handle === 'ne') { w = Math.max(10, Math.min(100 - x, w + dx)); y = Math.min(y + h - 10, y + dy); h = Math.max(10, h - dy); }
        if (handle === 'sw') { x = Math.min(x + w - 10, x + dx); w = Math.max(10, w - dx); h = Math.max(10, Math.min(100 - y, h + dy)); }
        if (handle === 'se') { w = Math.max(10, Math.min(100 - x, w + dx)); h = Math.max(10, Math.min(100 - y, h + dy)); }

        if (lockedAspect !== null) {
          h = w / lockedAspect;
          if (y + h > 100) { h = 100 - y; w = h * lockedAspect; }
        }

        x = Math.max(0, Math.min(100 - w, x));
        y = Math.max(0, Math.min(100 - h, y));
        w = Math.min(w, 100 - x);
        h = Math.min(h, 100 - y);
      }

      return { x, y, w, h };
    });
  }, [lockedAspect]);

  const onPointerUp = useCallback(() => { dragRef.current = null; }, []);

  function setAspectRatio(aspect: number | null) {
    setLockedAspect(aspect);
    if (aspect !== null) {
      const w = 80;
      const h = Math.min(80, w / aspect);
      setCropBox({ x: (100 - w) / 2, y: (100 - h) / 2, w, h });
    }
  }

  async function handleSave() {
    if (isVideo || (rotation === 0 && !flipH && !flipV && !cropMode)) {
      onSave(file);
      return;
    }

    const img = new Image();
    img.src = url;
    await new Promise<void>(r => { img.onload = () => r(); });

    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    const isRotated90 = rotation === 90 || rotation === 270;

    // Crop region in source pixels
    const cx = cropMode ? (cropBox.x / 100) * natW : 0;
    const cy = cropMode ? (cropBox.y / 100) * natH : 0;
    const cw = cropMode ? (cropBox.w / 100) * natW : natW;
    const ch = cropMode ? (cropBox.h / 100) * natH : natH;

    const canvas = document.createElement('canvas');
    canvas.width = isRotated90 ? ch : cw;
    canvas.height = isRotated90 ? cw : ch;

    const ctx = canvas.getContext('2d')!;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    if (flipH) ctx.scale(-1, 1);
    if (flipV) ctx.scale(1, -1);
    ctx.drawImage(img, cx, cy, cw, ch, -cw / 2, -ch / 2, cw, ch);
    ctx.restore();

    canvas.toBlob(blob => {
      if (!blob) return;
      const newFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
      onSave(newFile);
    }, 'image/jpeg', 0.92);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, backgroundColor: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #1f1f1f', flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Cancel</button>
        <span style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>Edit media</span>
        <button onClick={handleSave} style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer', fontSize: 14, fontWeight: 800 }}>Apply</button>
      </div>

      {/* Preview */}
      <div
        ref={containerRef}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflow: 'hidden', position: 'relative' }}
      >
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          {url && (isVideo ? (
            <video src={url} controls style={{ maxHeight: '55vh', maxWidth: '80vw', objectFit: 'contain', transform, display: 'block' }} />
          ) : (
            <img src={url} alt="" style={{ maxHeight: '55vh', maxWidth: '80vw', objectFit: 'contain', transform, display: 'block' }} />
          ))}

          {/* Crop overlay */}
          {cropMode && (
            <div style={{ position: 'absolute', inset: 0, userSelect: 'none' }}>
              {/* Dark overlay outside crop */}
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% ${cropBox.y}%, ${cropBox.x}% ${cropBox.y}%, ${cropBox.x}% ${cropBox.y + cropBox.h}%, ${cropBox.x + cropBox.w}% ${cropBox.y + cropBox.h}%, ${cropBox.x + cropBox.w}% ${cropBox.y}%, 0% ${cropBox.y}%)` }} />

              {/* Crop box */}
              <div
                onPointerDown={e => onPointerDown('move', e)}
                style={{
                  position: 'absolute',
                  left: `${cropBox.x}%`, top: `${cropBox.y}%`,
                  width: `${cropBox.w}%`, height: `${cropBox.h}%`,
                  border: '2px solid #fff', cursor: 'move', boxSizing: 'border-box',
                }}
              >
                {/* Rule of thirds grid */}
                {['33%', '66%'].map(p => (
                  <div key={p}>
                    <div style={{ position: 'absolute', left: p, top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                    <div style={{ position: 'absolute', top: p, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                  </div>
                ))}

                {/* Corner handles */}
                {(['nw', 'ne', 'sw', 'se'] as const).map(h => (
                  <div key={h} onPointerDown={e => onPointerDown(h, e)} style={{
                    position: 'absolute',
                    width: 14, height: 14,
                    backgroundColor: '#fff',
                    borderRadius: 2,
                    cursor: `${h}-resize`,
                    ...(h === 'nw' ? { top: -4, left: -4 } : h === 'ne' ? { top: -4, right: -4 } : h === 'sw' ? { bottom: -4, left: -4 } : { bottom: -4, right: -4 }),
                  }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding: '16px 24px 28px', borderTop: '1px solid #1f1f1f', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 16 }}>
          {/* Rotate */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#555', letterSpacing: 0.5, textTransform: 'uppercase' }}>Rotate</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <ToolBtn label="↺" title="Left" onClick={() => setRotation(r => (r - 90 + 360) % 360)} />
              <ToolBtn label="↻" title="Right" onClick={() => setRotation(r => (r + 90) % 360)} />
            </div>
          </div>

          {/* Flip */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#555', letterSpacing: 0.5, textTransform: 'uppercase' }}>Flip</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <ToolBtn label="↔" title="Horizontal" onClick={() => setFlipH(f => !f)} active={flipH} />
              <ToolBtn label="↕" title="Vertical" onClick={() => setFlipV(f => !f)} active={flipV} />
            </div>
          </div>

          {/* Crop */}
          {!isVideo && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#555', letterSpacing: 0.5, textTransform: 'uppercase' }}>Crop</span>
              <ToolBtn label="Crop" title="Toggle crop" onClick={() => setCropMode(c => !c)} active={cropMode} wide />
            </div>
          )}
        </div>

        {/* Aspect ratio lock (only when cropping) */}
        {cropMode && !isVideo && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
            {ASPECTS.map(a => (
              <button key={a.label} onClick={() => setAspectRatio(a.value)} style={{
                padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                border: '1px solid',
                borderColor: lockedAspect === a.value ? '#22c55e' : '#2a2a2a',
                backgroundColor: lockedAspect === a.value ? 'rgba(34,197,94,0.1)' : '#161616',
                color: lockedAspect === a.value ? '#22c55e' : '#666',
                cursor: 'pointer',
              }}>{a.label}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolBtn({ label, title, onClick, active, wide }: { label: string; title: string; onClick: () => void; active?: boolean; wide?: boolean }) {
  return (
    <button onClick={onClick} title={title} style={{
      padding: wide ? '10px 20px' : '10px 14px',
      borderRadius: 10, fontSize: wide ? 13 : 18,
      border: '1px solid',
      borderColor: active ? '#22c55e' : '#2a2a2a',
      backgroundColor: active ? 'rgba(34,197,94,0.12)' : '#161616',
      color: active ? '#22c55e' : '#ccc',
      cursor: 'pointer', fontWeight: wide ? 700 : 400,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>{label}</button>
  );
}
