import React, { useState } from 'react';
import { HudMode, ViewportMode, PredictionHistoryItem } from '../types';
import { APP_CONFIG } from '../config';
import {
  Volume2,
  VolumeX,
  History,
  RotateCcw,
  Sparkles,
  Link2,
  ExternalLink,
} from 'lucide-react';
import { playClickSound, playModeSwitchSound, setAudioEnabled } from '../utils/audio';

interface ControlToolbarProps {
  hudMode: HudMode;
  onSetHudMode: (mode: HudMode) => void;
  viewportMode: ViewportMode;
  onSetViewportMode: (mode: ViewportMode) => void;
  isAudioOn: boolean;
  onToggleAudio: () => void;
  onResetPosition: () => void;
  history: PredictionHistoryItem[];
  iframeUrl: string;
  onUpdateIframeUrl: (url: string) => void;
}

export const ControlToolbar: React.FC<ControlToolbarProps> = ({
  hudMode,
  onSetHudMode,
  viewportMode,
  onSetViewportMode,
  isAudioOn,
  onToggleAudio,
  onResetPosition,
  history,
  iframeUrl,
  onUpdateIframeUrl,
}) => {
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [tempUrl, setTempUrl] = useState(iframeUrl);

  const handleModeChange = (mode: HudMode) => {
    playModeSwitchSound();
    onSetHudMode(mode);
  };

  return (
    <>
      {/* Top Glass Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-[#05000a]/85 backdrop-blur-md border-b border-[#3c096c]/40 px-3 md:px-6 flex items-center justify-between select-none">
        {/* Brand Zone */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#9d4edd] to-[#c77dff] flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-black tracking-tight text-white text-sm md:text-base text-shadow">
              {APP_CONFIG.displayName}
            </span>
            <span className="hidden sm:inline text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-500/30 text-purple-300">
              V4 APEX
            </span>
          </div>
        </div>

        {/* Center Control Tabs: Viewport & HUD Mode */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* HUD State Selector */}
          <div className="hidden lg:flex items-center p-1 bg-[#100021] border border-white/10 rounded-lg text-xs">
            <span className="px-2 text-[10px] text-white/50 uppercase tracking-wider font-semibold">
              HUD State:
            </span>
            <button
              onClick={() => handleModeChange('result')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                hudMode === 'result'
                  ? 'bg-gradient-to-r from-[#9d4edd] to-[#c77dff] text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Result Mode
            </button>
            <button
              onClick={() => handleModeChange('register')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                hudMode === 'register'
                  ? 'bg-[#3c096c] text-[#e0aaff] border border-purple-400/40 shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Register Lock
            </button>
            <button
              onClick={() => handleModeChange('add_balance')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                hudMode === 'add_balance'
                  ? 'bg-[#3c096c] text-[#e0aaff] border border-purple-400/40 shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Deposit Lock
            </button>
          </div>

          {/* Viewport Selector */}
          <div className="flex items-center p-0.5 sm:p-1 bg-[#100021] border border-white/10 rounded-lg text-xs">
            <button
              onClick={() => {
                playClickSound();
                onSetViewportMode('arena');
              }}
              className={`px-2 sm:px-2.5 py-1 rounded-md font-medium transition-all ${
                viewportMode === 'arena'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
              title="Interactive WinGo Arena"
            >
              Arena
            </button>
            <button
              onClick={() => {
                playClickSound();
                onSetViewportMode('iframe');
              }}
              className={`px-2 sm:px-2.5 py-1 rounded-md font-medium transition-all ${
                viewportMode === 'iframe'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
              title="Live Target Iframe"
            >
              Site
            </button>
            <button
              onClick={() => {
                playClickSound();
                onSetViewportMode('split');
              }}
              className={`hidden md:block px-2 sm:px-2.5 py-1 rounded-md font-medium transition-all ${
                viewportMode === 'split'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
              title="Split View"
            >
              Split
            </button>
          </div>
        </div>

        {/* Action Controls & Telegram Link */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* 🌟 TELEGRAM BADGE BUTTON (Requested in APP_CONFIG) */}
          <a
            href={APP_CONFIG.telegram}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => playClickSound()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0088cc]/20 hover:bg-[#0088cc]/30 border border-[#0088cc]/50 text-cyan-200 text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-sm"
            title="Join Official Telegram Channel"
          >
            <svg
              className="w-3.5 h-3.5 fill-current text-cyan-300"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .39z" />
            </svg>
            <span className="hidden sm:inline">TELEGRAM</span>
          </a>

          {/* Audio FX Toggle */}
          <button
            onClick={() => {
              playClickSound();
              onToggleAudio();
              setAudioEnabled(!isAudioOn);
            }}
            className="p-1.5 sm:p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title={isAudioOn ? 'Mute Cyber Audio FX' : 'Enable Cyber Audio FX'}
          >
            {isAudioOn ? <Volume2 className="w-4 h-4 text-[#c77dff]" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Recenter HUD */}
          <button
            onClick={() => {
              playClickSound();
              onResetPosition();
            }}
            className="p-1.5 sm:p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="Recenter HUD Window"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* History Modal Trigger */}
          <button
            onClick={() => {
              playClickSound();
              setShowHistoryModal(true);
            }}
            className="p-1.5 sm:p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors relative"
            title="Prediction History"
          >
            <History className="w-4 h-4" />
            {history.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#c77dff]" />
            )}
          </button>

          {/* Target URL Config */}
          <button
            onClick={() => {
              playClickSound();
              setTempUrl(iframeUrl);
              setShowUrlModal(true);
            }}
            className="p-1.5 sm:p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="Configure Target URL"
          >
            <Link2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile State Bottom Drawer Strip */}
      <div className="lg:hidden fixed bottom-3 left-3 z-30 flex items-center gap-1 bg-[#100021]/90 backdrop-blur-md border border-[#c77dff]/30 p-1 rounded-lg text-[11px] shadow-lg">
        <button
          onClick={() => handleModeChange('result')}
          className={`px-2 py-1 rounded ${
            hudMode === 'result' ? 'bg-[#9d4edd] text-white font-bold' : 'text-white/60'
          }`}
        >
          Result
        </button>
        <button
          onClick={() => handleModeChange('register')}
          className={`px-2 py-1 rounded ${
            hudMode === 'register' ? 'bg-[#3c096c] text-[#e0aaff] font-bold' : 'text-white/60'
          }`}
        >
          Register
        </button>
        <button
          onClick={() => handleModeChange('add_balance')}
          className={`px-2 py-1 rounded ${
            hudMode === 'add_balance' ? 'bg-[#3c096c] text-[#e0aaff] font-bold' : 'text-white/60'
          }`}
        >
          Deposit
        </button>
        <a
          href={APP_CONFIG.telegram}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2 py-1 rounded bg-[#0088cc]/30 text-cyan-300 font-bold flex items-center gap-1"
        >
          TG
        </a>
      </div>

      {/* History Log Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#100021] border border-[#c77dff]/40 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#c77dff]" />
                <h3 className="font-bold text-white text-base">Prediction Audit Trail</h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-white/60 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
              {history.length === 0 ? (
                <div className="text-center py-8 text-white/40 font-sans">
                  No prediction log yet. Running live engine…
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-white/90 font-bold">{item.period}</div>
                      <div className="text-[10px] text-white/40">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-[#e0aaff]">
                        {item.predictedDigit}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.predictedSize === 'BIG'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                            : 'bg-purple-950 text-purple-300 border border-purple-500/30'
                        }`}
                      >
                        {item.predictedSize}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-lg bg-[#3c096c] hover:bg-[#9d4edd] text-white text-xs font-semibold transition-all"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Target URL Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#100021] border border-[#c77dff]/40 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-[#c77dff]" />
                <h3 className="font-bold text-white text-base">Configuration & Target URL</h3>
              </div>
              <button
                onClick={() => setShowUrlModal(false)}
                className="text-white/60 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/70 block mb-1">Target Website URL:</label>
                <input
                  type="text"
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-[#c77dff]"
                />
              </div>

              {/* Panel Background Image Info */}
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs space-y-1">
                <div className="text-[10px] uppercase font-bold text-[#c77dff]">
                  Panel Blurred Background Image:
                </div>
                <div className="font-mono text-[11px] text-white/70 truncate">
                  {APP_CONFIG.panelBgImage}
                </div>
                <div className="pt-1 flex items-center gap-2">
                  <a
                    href={APP_CONFIG.panelBgImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-cyan-300 hover:underline"
                  >
                    View Original Image <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setTempUrl(APP_CONFIG.defaultRegisterUrl);
                }}
                className="text-[11px] text-[#c77dff] hover:underline"
              >
                Reset Default
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowUrlModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 text-white/80 hover:text-white text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onUpdateIframeUrl(tempUrl);
                    setShowUrlModal(false);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-[#9d4edd] hover:bg-[#c77dff] text-white text-xs font-bold"
                >
                  Save URL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
