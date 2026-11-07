import React, { useState, useRef, useEffect, useCallback } from 'react';
import { HudMode, Prediction } from '../types';
import { APP_CONFIG } from '../config';
import { playClickSound, playGenPulseSound, playLockSound, playModeSwitchSound } from '../utils/audio';
import { verifyPassGatePassword, checkPassGateSession, logoutPassGate } from '../services/passGate';

interface ApexHudProps {
  hudMode: HudMode;
  periodText: string;
  prediction: Prediction;
  isGenerating: boolean;
  onGenerate: () => void;
  onNavigateService: (service: 'register' | 'deposit') => void;
  onClose: () => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export const ApexHud: React.FC<ApexHudProps> = ({
  hudMode,
  periodText,
  prediction,
  isGenerating,
  onGenerate,
  onNavigateService,
  onClose,
  containerRef,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // PassGate Password Lock State
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passMessage, setPassMessage] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });
  const localWrapperRef = useRef<HTMLDivElement | null>(null);

  // Check saved PassGate session token on mount
  useEffect(() => {
    checkPassGateSession().then((valid) => {
      if (valid) {
        setIsUnlocked(true);
      }
    });
  }, []);

  // Center HUD on first mount
  useEffect(() => {
    const calculateInitialPosition = () => {
      const width = 310;
      const height = 290;
      const x = Math.max(12, Math.round((window.innerWidth - width) / 2));
      const y = Math.max(70, Math.round((window.innerHeight - height) / 2));
      setPosition({ x, y });
    };

    calculateInitialPosition();
    window.addEventListener('resize', calculateInitialPosition);
    return () => window.removeEventListener('resize', calculateInitialPosition);
  }, []);

  // Clamp position to viewport
  const clampPosition = useCallback((x: number, y: number) => {
    const el = localWrapperRef.current;
    const w = el ? el.offsetWidth : 310;
    const h = el ? el.offsetHeight : 290;
    const margin = 8;
    return {
      x: Math.min(Math.max(margin, x), Math.max(margin, window.innerWidth - w - margin)),
      y: Math.min(Math.max(margin, y), Math.max(margin, window.innerHeight - h - margin)),
    };
  }, []);

  // Drag start
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('a') ||
      (e.target as HTMLElement).closest('input')
    ) {
      return;
    }

    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;
    const newPos = clampPosition(
      dragStartRef.current.initialX + deltaX,
      dragStartRef.current.initialY + deltaY
    );
    setPosition(newPos);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore pointer capture errors
    }
  };

  // Button click ripple
  const triggerRipple = (e: React.PointerEvent<HTMLElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple-circle';
    const size = Math.max(rect.width, rect.height) * 1.5;
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  };

  // Handle PassGate password verification
  const handleUnlock = async () => {
    if (isVerifying) return;
    playClickSound();
    setPassMessage('Checking…');
    setIsVerifying(true);

    const res = await verifyPassGatePassword(passwordInput);
    setIsVerifying(false);

    if (res.success) {
      setPassMessage('Opening Telegram…');

      // 🌟 Take to Telegram before unlocking panel (as requested)
      try {
        const link = document.createElement('a');
        link.href = APP_CONFIG.telegram;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch {
        window.open(APP_CONFIG.telegram, '_blank');
      }

      // Reveal panel after opening Telegram
      setTimeout(() => {
        setPassMessage('');
        setIsUnlocked(true);
        playGenPulseSound();
      }, 750);
    } else {
      setPassMessage(res.message);
      playLockSound();
    }
  };

  // Handle re-locking the panel
  const handleLockPanel = () => {
    playModeSwitchSound();
    logoutPassGate();
    setIsUnlocked(false);
    setPasswordInput('');
    setPassMessage('');
  };

  // Displayed period number (masked when locked as in original HTML)
  const displayPeriod =
    hudMode === 'result'
      ? periodText
      : periodText && periodText.length >= 2
      ? periodText.slice(0, -2) + 'XX'
      : periodText || 'LOADING…';

  return (
    <div
      ref={(el) => {
        localWrapperRef.current = el;
        if (containerRef) {
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }
      }}
      id="mainWrapper"
      className={isDragging ? 'dragging' : ''}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        position: 'fixed',
        zIndex: 50,
        left: 0,
        top: 0,
        display: 'flex',
        alignItems: 'center',
        touchAction: 'none',
        userSelect: 'none',
        willChange: 'transform',
      }}
    >
      <div id="animContainer" className="flex items-center gap-0">
        {/* Chamfer border HUD panel */}
        <div className="chamfer-border-wrap">
          <section id="float" className="relative overflow-hidden cursor-crosshair">
            {/* 🌟 BLURRED BACKGROUND IMAGE (User's CYBER HACK RAHMAN VAI PNG image) */}
            <div
              className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
              aria-hidden="true"
            >
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `url(${APP_CONFIG.panelBgImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center 20%',
                  filter: 'blur(5px) brightness(0.55) contrast(1.2) saturate(1.25)',
                  transform: 'scale(1.22)',
                  opacity: 0.94,
                }}
              />
              {/* Frosted cyber gradient scrim for high-contrast neon text legibility */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#0a0014]/65 via-[#1a0033]/50 to-[#05000a]/80" />
            </div>

            <div className="cyber-scanline relative z-10" />
            <div className="sharp-corner-glow sc-tl relative z-10" />
            <div className="sharp-corner-glow sc-tr relative z-10" />
            <div className="sharp-corner-glow sc-bl relative z-10" />
            <div className="sharp-corner-glow sc-br relative z-10" />

            {/* Draggable Top Bar with Configured Name */}
            <div
              className="top-mini-bar relative z-10"
              id="drag"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <div className="brand-capsule">
                <div className="live-dot" />
                <span className="brand-text">{APP_CONFIG.displayName}</span>
              </div>
            </div>

            {/* Prediction Period Stage */}
            <div className="big-period-stage relative z-10">
              <span className="period-title">
                {isUnlocked ? 'PREDICTION PERIOD' : 'SECURITY GATEWAY'}
              </span>
              <strong className="period-num-big" id="periodText">
                {isUnlocked ? displayPeriod : 'LOCKED ACCESS'}
              </strong>
            </div>

            {/* Central Stage: Collapsible on Minimize */}
            {!isMinimized && (
              <>
                {/* 🔒 1. PASSGATE LOCKED STATE (#pg-gate) */}
                <div
                  id="pg-gate"
                  style={{ display: isUnlocked ? 'none' : 'flex' }}
                  className="full-result-stage relative z-10 flex-col items-center justify-between p-3 space-y-2"
                >
                  <div className="flex flex-col items-center">
                    <div className="css-big-lock" style={{ transform: 'scale(0.8)', marginBottom: '1px' }}>
                      <div className="lock-shackle" />
                      <div className="lock-body">
                        <div className="lock-keyhole">
                          <div className="keyhole-circle" />
                          <div className="keyhole-line" />
                        </div>
                      </div>
                    </div>
                    <span className="text-[9.5px] font-black tracking-widest text-[#e0aaff] uppercase drop-shadow-[0_0_8px_var(--neon-purple)]">
                      VIP ACCESS GATEWAY
                    </span>
                  </div>

                  <div className="w-full space-y-1.5 px-0.5">
                    {/* Direct Telegram Link Button */}
                    <a
                      href={APP_CONFIG.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2 rounded bg-[#0088cc]/30 hover:bg-[#0088cc]/50 border border-[#0088cc]/60 text-cyan-200 text-[9.5px] font-bold tracking-wider uppercase transition-all shadow-[0_0_10px_rgba(0,136,204,0.35)]"
                    >
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .39z" />
                      </svg>
                      JOIN TELEGRAM FOR KEY
                    </a>

                    <input
                      id="pg-pass"
                      type="password"
                      placeholder="Enter VIP Password…"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUnlock();
                      }}
                      autoComplete="off"
                    />

                    <button
                      id="pg-btn"
                      type="button"
                      onClick={handleUnlock}
                      disabled={isVerifying}
                    >
                      {isVerifying ? 'VERIFYING…' : 'UNLOCK PANEL'}
                    </button>

                    <div id="pg-msg">{passMessage}</div>
                  </div>
                </div>

                {/* 🔓 2. UNLOCKED SECRET STAGE (#pg-secret) */}
                <div
                  id="pg-secret"
                  style={{ display: isUnlocked ? 'flex' : 'none' }}
                  className="full-result-stage relative z-10"
                >
                  {/* Result Mode */}
                  {hudMode === 'result' && (
                    <>
                      <div className="hero-reactor">
                        <div className="sub-orbit-1" />
                        <div className="sub-orbit-2" />
                        <div className="sub-orbit-3" />
                        <div className="sub-orbit-4" />
                        <div className="sub-orbit-5" />
                        <div className="ring-gleam" />
                        <div className="ring-outer" />
                        <div className="ring-middle" />
                        <div className="cal-radar" />
                        <div className="giant-orb" id="resultImage">
                          <span className="giant-digit" id="centerDigit">
                            {isGenerating ? '?' : prediction.n}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`stage-badge ${prediction.s === 'BIG' ? 'big' : 'small'}`}
                        id="badgeTarget"
                      >
                        {prediction.s}
                      </div>
                    </>
                  )}

                  {/* Register Locked Mode */}
                  {hudMode === 'register' && (
                    <>
                      <div className="hero-reactor">
                        <div className="sub-orbit-1" />
                        <div className="sub-orbit-2" />
                        <div className="sub-orbit-3" />
                        <div className="sub-orbit-4" />
                        <div className="sub-orbit-5" />
                        <div className="ring-gleam" />
                        <div className="ring-outer" />
                        <div className="ring-middle" />
                        <div className="cal-radar" />
                        <div className="locked-orb">
                          <div className="css-big-lock">
                            <div className="lock-shackle" />
                            <div className="lock-body">
                              <div className="lock-keyhole">
                                <div className="keyhole-circle" />
                                <div className="keyhole-line" />
                              </div>
                            </div>
                          </div>
                          <span className="locked-title-text">RESULT LOCKED</span>
                        </div>
                      </div>
                      <div className="stage-badge-unlock">REGISTER NOW TO UNLOCK RESULT</div>
                    </>
                  )}

                  {/* Deposit Locked Mode */}
                  {hudMode === 'add_balance' && (
                    <>
                      <div className="hero-reactor">
                        <div className="sub-orbit-1" />
                        <div className="sub-orbit-2" />
                        <div className="sub-orbit-3" />
                        <div className="sub-orbit-4" />
                        <div className="sub-orbit-5" />
                        <div className="ring-gleam" />
                        <div className="ring-outer" />
                        <div className="ring-middle" />
                        <div className="cal-radar" />
                        <div className="real-lock-container">
                          <div className="real-lock-shackle" />
                          <div className="real-lock-body">
                            <div className="real-keyhole-circle" />
                            <div className="real-keyhole-stem" />
                          </div>
                          <strong className="big-deposit-alert">DEPOSIT ₹500</strong>
                        </div>
                      </div>
                      <div className="stage-badge-deposit">500 RS DEPOSIT TO UNLOCK RESULT</div>
                    </>
                  )}
                </div>
              </>
            )}
          </section>
        </div>

        {/* Dual Plasma Power Bridge */}
        <div className="bridge-container">
          <div className="plasma-stick" />
          <div className="plasma-stick" />
        </div>

        {/* Right Dock Controls */}
        <div className="right-dock-wrapper">
          {/* Minimize / Expand Toggle */}
          <button
            className="right-circle-btn"
            id="min"
            title={isMinimized ? 'Expand' : 'Minimize'}
            type="button"
            onPointerDown={triggerRipple}
            onClick={() => {
              playClickSound();
              setIsMinimized((prev) => !prev);
            }}
          >
            {isMinimized ? '+' : '−'}
          </button>

          {/* Primary Action Button Based On Locked/Unlocked State */}
          {!isUnlocked ? (
            <button
              className="right-action-btn"
              id="dockUnlockBtn"
              type="button"
              onPointerDown={triggerRipple}
              onClick={handleUnlock}
              title="Unlock PassGate"
            >
              <span style={{ fontSize: '12px' }}>🔑</span>
              <span>KEY</span>
            </button>
          ) : (
            <>
              {hudMode === 'result' && (
                <button
                  className="right-action-btn"
                  id="generateBtn"
                  type="button"
                  onPointerDown={triggerRipple}
                  onClick={() => {
                    playGenPulseSound();
                    onGenerate();
                  }}
                  title="Generate Prediction"
                >
                  <span>⚡</span>
                  <span>GEN</span>
                </button>
              )}

              {hudMode === 'register' && (
                <button
                  className="right-action-btn"
                  id="registerBtn"
                  type="button"
                  onPointerDown={triggerRipple}
                  onClick={() => {
                    playLockSound();
                    onNavigateService('register');
                  }}
                  title="Register to Unlock"
                >
                  <span style={{ fontSize: '12px' }}>📝</span>
                  <span>REGISTER</span>
                </button>
              )}

              {hudMode === 'add_balance' && (
                <button
                  className="right-action-btn"
                  id="addBalanceBtn"
                  type="button"
                  onPointerDown={triggerRipple}
                  onClick={() => {
                    playLockSound();
                    onNavigateService('deposit');
                  }}
                  title="Deposit 500 RS"
                >
                  <span style={{ fontSize: '12px' }}>💳</span>
                  <span>500 RS</span>
                  <span>DEPOSIT</span>
                </button>
              )}
            </>
          )}

          {/* 🌟 TELEGRAM DIRECT BUTTON */}
          <a
            href={APP_CONFIG.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="right-circle-btn flex items-center justify-center text-cyan-300 hover:text-white"
            title="Join Official Telegram"
            onPointerDown={triggerRipple}
            onClick={() => playClickSound()}
          >
            <svg
              className="w-4 h-4 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .39z" />
            </svg>
          </a>

          {/* Re-lock Button (shown when unlocked so user can test locking again) */}
          {isUnlocked && (
            <button
              className="right-circle-btn text-rose-400 hover:text-rose-200"
              id="lockBtn"
              title="Lock Panel"
              type="button"
              onPointerDown={triggerRipple}
              onClick={handleLockPanel}
            >
              🔒
            </button>
          )}

          {/* Close / Hide Button */}
          <button
            className="right-circle-btn"
            id="close"
            title="Close Panel"
            type="button"
            onPointerDown={triggerRipple}
            onClick={() => {
              playClickSound();
              onClose();
            }}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};
