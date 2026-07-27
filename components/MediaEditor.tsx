'use client';

import { useState, useEffect } from 'react';

interface Props {
  file: File;
  onSave: (file: File) => void;
  onClose: () => void;
}

const ASPECTS = [
  { label: '9:16', value: 9 / 16 },
  { label: '1:1', value: 1 },
  { label: '16:9', value: 16 / 9 },
  { label: 'Original', value: null as number | null },
];

export default function MediaEditor({ file, onSave, onClose }: Props) {
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [aspect, setAspect] = useState<number | null>(null);
  const [url, setUrl] = useState('');
  const isVideo = file.type.startsWith('video/');

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

  async function handleSave() {
    if (isVideo || (rotation === 0 && !flipH && !flipV && aspect === null)) {
      onSave(file);
      return;
    }

    const img = new Image();
    img.src = url;
    await new Promise<void>(r => { img.onload = () => r(); });

    const isRotated90 = rotation === 90 || rotation === 270;
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;

    // Output size based on aspect ratio
    let outW: number, outH: number;
    if (aspect !== null) {
      if (isRotated90) {
        outH = natH;
        outW = Math.round(outH * aspect);
      } else {
        outW = natW;
        outH = Math.round(outW / aspect);
      }
    } else {
      outW = isRotated90 ? natH : natW;
      outH = isRotated90 ? natW : natH;
    }

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d')!;

    ctx.save();
    ctx.translate(outW / 2, outH / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    if (flipH) ctx.scale(-1, 1);
    if (flipV) ctx.scale(1, -1);
    ctx.drawImage(img, -natW / 2, -natH / 2, natW, natH);
    ctx.restore();

    canvas.toBlob(blob => {
      if (!blob) return;
      const newFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
      onSave(newFile);
    }, 'image/jpeg', 0.92);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      backgroundColor: '#0a0a0a',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', borderBottom: '1px solid #1f1f1f',
      }}>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 14, fontWeight: 600,
        }}>Cancel</button>
        <span style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>Edit media</span>
        <button onClick={handleSave} style={{
          background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer', fontSize: 14, fontWeight: 800,
        }}>Apply</button>
      </div>

      {/* Preview */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, overflow: 'hidden',
      }}>
        {url && (isVideo ? (
          <video
            src={url} muted autoPlay loop
            style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', transform, borderRadius: 8 }}
          />
        ) : (
          <img
            src={url} alt=""
            style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', transform, borderRadius: 8 }}
          />
        ))}
      </div>

      {/* Controls */}
      <div style={{ padding: '20px 24px 32px', borderTop: '1px solid #1f1f1f' }}>
        {/* Rotate & Flip */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
          {[
            { label: '↺', title: 'Rotate left', action: () => setRotation(r => (r - 90 + 360) % 360) },
            { label: '↻', title: 'Rotate right', action: () => setRotation(r => (r + 90) % 360) },
            { label: '↔', title: 'Flip horizontal', action: () => setFlipH(f => !f), active: flipH },
            { label: '↕', title: 'Flip vertical', action: () => setFlipV(f => !f), active: flipV },
          ].map(btn => (
            <button key={btn.title} onClick={btn.action} title={btn.title} style={{
              width: 52, height: 52, borderRadius: 12, fontSize: 20,
              border: '1px solid',
              borderColor: btn.active ? '#22c55e' : '#2a2a2a',
              backgroundColor: btn.active ? 'rgba(34,197,94,0.12)' : '#161616',
              color: btn.active ? '#22c55e' : '#ccc',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{btn.label}</button>
          ))}
        </div>

        {/* Aspect ratio (images only) */}
        {!isVideo && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            {ASPECTS.map(a => (
              <button key={a.label} onClick={() => setAspect(a.value)} style={{
                padding: '7px 16px', borderRadius: 9, fontSize: 12, fontWeight: 700,
                border: '1px solid',
                borderColor: aspect === a.value ? '#22c55e' : '#2a2a2a',
                backgroundColor: aspect === a.value ? 'rgba(34,197,94,0.1)' : '#161616',
                color: aspect === a.value ? '#22c55e' : '#666',
                cursor: 'pointer',
              }}>{a.label}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
