import React, { useState, useRef } from 'react';
import { APP_CONFIG } from '../config';
import { playClickSound } from '../utils/audio';

interface ReopenButtonProps {
  isVisible: boolean;
  onReopen: () => void;
}

export const ReopenButton: React.FC<ReopenButtonProps> = ({ isVisible, onReopen }) => {
  const [position, setPosition] = useState<{ x?: number; y?: number }>({});
  const [isDragging, setIsDragging] = useState(false);
  const [imgError, setImgError] = useState(false);

  const dragInfo = useRef({
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    moved: false,
    pointerId: -1,
  });
  const btnRef = useRef<HTMLButtonElement | null>(null);

  if (!isVisible) return null;

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    dragInfo.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: r.left,
      origY: r.top,
      moved: false,
      pointerId: e.pointerId,
    };
    setIsDragging(true);
    try {
      btn.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragInfo.current.startX;
    const dy = e.clientY - dragInfo.current.startY;
    if (Math.abs(dx) + Math.abs(dy) > 4) {
      dragInfo.current.moved = true;
    }
    const btn = btnRef.current;
    const w = btn ? btn.offsetWidth : 90;
    const h = btn ? btn.offsetHeight : 90;
    const margin = 10;
    const newX = Math.min(Math.max(margin, dragInfo.current.origX + dx), window.innerWidth - w - margin);
    const newY = Math.min(Math.max(margin, dragInfo.current.origY + dy), window.innerHeight - h - margin);
    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      if (dragInfo.current.pointerId !== -1) {
        btnRef.current?.releasePointerCapture(dragInfo.current.pointerId);
      }
    } catch {
      // Ignore
    }
    if (!dragInfo.current.moved) {
      playClickSound();
      onReopen();
    }
  };

  const style: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
    width: '90px',
    height: '90px',
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
    userSelect: 'none',
    ...(position.x !== undefined && position.y !== undefined
      ? { left: `${position.x}px`, top: `${position.y}px`, right: 'auto', bottom: 'auto' }
      : { right: '18px', bottom: '24px' }),
  };

  return (
    <button
      ref={btnRef}
      id="reopen"
      className="is-visible"
      style={style}
      aria-label="Reopen prediction HUD panel"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="flex flex-col items-center justify-center">
        {!imgError ? (
          <img
            src={APP_CONFIG.statusIcon}
            alt="Status"
            className="w-12 h-12 object-contain filter drop-shadow-[0_0_12px_rgba(199,125,255,0.9)] pointer-events-none mb-0.5"
            onError={() => setImgError(true)}
            loading="eager"
          />
        ) : (
          <div className="css-big-lock" style={{ transform: 'scale(0.85)', marginBottom: '2px' }}>
            <div className="lock-shackle" />
            <div className="lock-body">
              <div className="lock-keyhole">
                <div className="keyhole-circle" />
                <div className="keyhole-line" />
              </div>
            </div>
          </div>
        )}
        <span className="fab-caption">STATUS</span>
      </div>
    </button>
  );
};
