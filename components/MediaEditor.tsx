'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Props {
  file: File;
  onSave: (file: File) => void;
  onClose: () => void;
}

type DragHandle = 'move' | 'nw' | 'ne' | 'sw' | 'se';
type CropBox = { x: number; y: number; w: number; h: number };

const ASPECTS = [
  { label: '9:16', value: 9 / 16 },
  { label: '1:1', value: 1 },
  { label: '16:9', value: 16 / 9 },
  { label: 'Free', value: null as number | null },
];

export default function MediaEditor({ file, onSave, onClose }: Props) {
  const isVideo = file.type.startsWith('video/');
  const [url, setUrl] = useState('');

  // Image states
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [cropBox, setCropBox] = useState<CropBox>({ x: 10, y: 10, w: 80, h: 80 });
  const [lockedAspect, setLockedAspect] = useState<number | null>(null);

  // Video trim states
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [trimming, setTrimming] = useState(false);
  const [trimProgress, setTrimProgress] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dragRef = useRef<{ handle: DragHandle; startX: number; startY: number; startBox: CropBox } | null>(null);
  const trimDragRef = useRef<{ handle: 'start' | 'end' } | null>(null);

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

  // Crop drag
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

    setCropBox(() => {
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

  // Timeline trim drag
  const onTrimPointerDown = useCallback((handle: 'start' | 'end', e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    trimDragRef.current = { handle };
  }, []);

  const onTrimPointerMove = useCallback((e: React.PointerEvent) => {
    if (!trimDragRef.current || !timelineRef.current || duration === 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const t = ratio * duration;
    const { handle } = trimDragRef.current;

    if (handle === 'start') {
      const newStart = Math.min(t, trimEnd - 0.5);
      setTrimStart(newStart);
      if (videoRef.current) videoRef.current.currentTime = newStart;
    } else {
      const newEnd = Math.max(t, trimStart + 0.5);
      setTrimEnd(newEnd);
      if (videoRef.current) videoRef.current.currentTime = newEnd;
    }
  }, [duration, trimStart, trimEnd]);

  const onTrimPointerUp = useCallback(() => { trimDragRef.current = null; }, []);

  function setAspectRatio(aspect: number | null) {
    setLockedAspect(aspect);
    if (aspect !== null) {
      const w = 80;
      const h = Math.min(80, w / aspect);
      setCropBox({ x: (100 - w) / 2, y: (100 - h) / 2, w, h });
    }
  }

  function fmt(s: number) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  async function handleSave() {
    if (isVideo) {
      const noTrim = trimStart === 0 && trimEnd >= duration - 0.1;
      if (noTrim) { onSave(file); return; }
      await trimVideo();
      return;
    }

    if (rotation === 0 && !flipH && !flipV && !cropMode) { onSave(file); return; }

    const img = new Image();
    img.src = url;
    await new Promise<void>(r => { img.onload = () => r(); });

    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    const isRotated90 = rotation === 90 || rotation === 270;
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
      onSave(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.92);
  }

  async function trimVideo() {
    setTrimming(true);
    setTrimProgress(0);

    const video = document.createElement('video');
    video.src = url;
    video.muted = false;
    video.style.cssText = 'position:fixed;opacity:0;pointer-events:none;width:1px;height:1px;top:0;left:0';
    document.body.appendChild(video);

    await new Promise<void>(r => { video.onloadedmetadata = () => r(); });
    video.currentTime = trimStart;
    await new Promise<void>(r => { video.onseeked = () => r(); });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stream = (video as any).captureStream();
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : '';

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      document.body.removeChild(video);
      const blob = new Blob(chunks, { type: 'video/webm' });
      const ext = file.name.match(/\.[^.]+$/) ? '.webm' : '.webm';
      onSave(new File([blob], file.name.replace(/\.[^.]+$/, ext), { type: 'video/webm' }));
      setTrimming(false);
    };

    recorder.start(200);
    video.play();

    const clipLen = trimEnd - trimStart;
    const interval = setInterval(() => {
      const elapsed = video.currentTime - trimStart;
      setTrimProgress(Math.min(100, Math.round((elapsed / clipLen) * 100)));
      if (video.currentTime >= trimEnd - 0.1) {
        clearInterval(interval);
        recorder.stop();
        video.pause();
      }
    }, 200);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, backgroundColor: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #1f1f1f', flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Cancel</button>
        <span style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>Edit media</span>
        <button onClick={handleSave} disabled={trimming} style={{ background: 'none', border: 'none', color: trimming ? '#555' : '#22c55e', cursor: trimming ? 'default' : 'pointer', fontSize: 14, fontWeight: 800 }}>
          {trimming ? `${trimProgress}%` : 'Apply'}
        </button>
      </div>

      {/* Preview */}
      <div
        ref={containerRef}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 24px 16px', overflow: 'hidden', position: 'relative' }}
      >
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          {url && (isVideo ? (
            <video
              ref={videoRef}
              src={url}
              controls
              style={{ maxHeight: '50vh', maxWidth: '80vw', objectFit: 'contain', display: 'block', borderRadius: 8 }}
              onLoadedMetadata={e => {
                const d = (e.target as HTMLVideoElement).duration;
                setDuration(d);
                setTrimEnd(d);
              }}
              onTimeUpdate={e => setCurrentTime((e.target as HTMLVideoElement).currentTime)}
            />
          ) : (
            <img src={url} alt="" style={{ maxHeight: '50vh', maxWidth: '80vw', objectFit: 'contain', transform, display: 'block' }} />
          ))}

          {/* Crop overlay (images only) */}
          {cropMode && !isVideo && (
            <div style={{ position: 'absolute', inset: 0, userSelect: 'none' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', clipPath: `polygon(0% 0%,100% 0%,100% 100%,0% 100%,0% ${cropBox.y}%,${cropBox.x}% ${cropBox.y}%,${cropBox.x}% ${cropBox.y + cropBox.h}%,${cropBox.x + cropBox.w}% ${cropBox.y + cropBox.h}%,${cropBox.x + cropBox.w}% ${cropBox.y}%,0% ${cropBox.y}%)` }} />
              <div
                onPointerDown={e => onPointerDown('move', e)}
                style={{ position: 'absolute', left: `${cropBox.x}%`, top: `${cropBox.y}%`, width: `${cropBox.w}%`, height: `${cropBox.h}%`, border: '2px solid #fff', cursor: 'move', boxSizing: 'border-box' }}
              >
                {['33%', '66%'].map(p => (
                  <div key={p}>
                    <div style={{ position: 'absolute', left: p, top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                    <div style={{ position: 'absolute', top: p, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                  </div>
                ))}
                {(['nw', 'ne', 'sw', 'se'] as const).map(h => (
                  <div key={h} onPointerDown={e => onPointerDown(h, e)} style={{
                    position: 'absolute', width: 14, height: 14, backgroundColor: '#fff', borderRadius: 2, cursor: `${h}-resize`,
                    ...(h === 'nw' ? { top: -4, left: -4 } : h === 'ne' ? { top: -4, right: -4 } : h === 'sw' ? { bottom: -4, left: -4 } : { bottom: -4, right: -4 }),
                  }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video trim timeline */}
      {isVideo && duration > 0 && (
        <div style={{ padding: '0 24px 8px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(trimStart)}</span>
            <span style={{ fontSize: 11, color: '#555', fontVariantNumeric: 'tabular-nums' }}>{fmt(trimEnd - trimStart)} selected</span>
            <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(trimEnd)}</span>
          </div>
          <div
            ref={timelineRef}
            onPointerMove={onTrimPointerMove}
            onPointerUp={onTrimPointerUp}
            style={{ position: 'relative', height: 36, backgroundColor: '#1a1a1a', borderRadius: 8, cursor: 'default', userSelect: 'none' }}
          >
            {/* Full bar */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: 8, overflow: 'hidden' }}>
              {/* Dimmed regions outside trim */}
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${(trimStart / duration) * 100}%`, backgroundColor: 'rgba(0,0,0,0.6)' }} />
              <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: `${((duration - trimEnd) / duration) * 100}%`, backgroundColor: 'rgba(0,0,0,0.6)' }} />
              {/* Selected range */}
              <div style={{
                position: 'absolute', top: 0, bottom: 0,
                left: `${(trimStart / duration) * 100}%`,
                width: `${((trimEnd - trimStart) / duration) * 100}%`,
                backgroundColor: 'rgba(34,197,94,0.25)',
                borderTop: '2px solid #22c55e',
                borderBottom: '2px solid #22c55e',
              }} />
              {/* Playhead */}
              <div style={{
                position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: '#fff',
                left: `${(currentTime / duration) * 100}%`,
                transition: 'left 0.1s linear',
              }} />
            </div>

            {/* Start handle */}
            <div
              onPointerDown={e => onTrimPointerDown('start', e)}
              style={{
                position: 'absolute', top: 0, bottom: 0,
                left: `${(trimStart / duration) * 100}%`,
                transform: 'translateX(-50%)',
                width: 18, cursor: 'ew-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
              }}
            >
              <div style={{ width: 4, height: 26, backgroundColor: '#22c55e', borderRadius: 3 }} />
            </div>

            {/* End handle */}
            <div
              onPointerDown={e => onTrimPointerDown('end', e)}
              style={{
                position: 'absolute', top: 0, bottom: 0,
                left: `${(trimEnd / duration) * 100}%`,
                transform: 'translateX(-50%)',
                width: 18, cursor: 'ew-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
              }}
            >
              <div style={{ width: 4, height: 26, backgroundColor: '#22c55e', borderRadius: 3 }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 10, color: '#333' }}>0:00</span>
            <span style={{ fontSize: 10, color: '#333' }}>{fmt(duration)}</span>
          </div>

          {trimming && (
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <div style={{ height: 3, backgroundColor: '#1f1f1f', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${trimProgress}%`, backgroundColor: '#22c55e', transition: 'width 0.2s' }} />
              </div>
              <p style={{ fontSize: 11, color: '#555', marginTop: 6 }}>Trimming video… {trimProgress}%</p>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div style={{ padding: '12px 24px 28px', borderTop: '1px solid #1f1f1f', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
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

          {/* Crop (images only) */}
          {!isVideo && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#555', letterSpacing: 0.5, textTransform: 'uppercase' }}>Crop</span>
              <ToolBtn label="Crop" title="Toggle crop" onClick={() => setCropMode(c => !c)} active={cropMode} wide />
            </div>
          )}
        </div>

        {cropMode && !isVideo && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 14 }}>
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
