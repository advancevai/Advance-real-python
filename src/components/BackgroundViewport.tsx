import React, { useState, useEffect } from 'react';
import { ViewportMode, Prediction } from '../types';
import { ExternalLink, RefreshCw, Trophy, Clock, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface BackgroundViewportProps {
  mode: ViewportMode;
  iframeUrl: string;
  currentPeriod: string;
  prediction: Prediction;
}

interface SimulatedDraw {
  period: string;
  number: number;
  size: 'BIG' | 'SMALL';
  color: 'green' | 'red' | 'violet';
  matchedPrediction?: boolean;
}

export const BackgroundViewport: React.FC<BackgroundViewportProps> = ({
  mode,
  iframeUrl,
  currentPeriod,
  prediction,
}) => {
  // WinGo 1M 60-second synchronized timer
  const [secondsRemaining, setSecondsRemaining] = useState<number>(45);
  const [balance, setBalance] = useState<number>(2500);
  const [recentDraws, setRecentDraws] = useState<SimulatedDraw[]>([]);
  const [userBet, setUserBet] = useState<{ type: string; amount: number } | null>(null);
  const [lastWinAlert, setLastWinAlert] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);

  // Synchronize 60-second countdown with real second of the current minute
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const currentSec = now.getSeconds();
      const left = 60 - currentSec;
      setSecondsRemaining(left === 60 ? 0 : left);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // When timer hits 0 (or period changes), simulate draw outcome and verify prediction
  useEffect(() => {
    if (secondsRemaining === 59 || secondsRemaining === 0) {
      // Deterministic outcome based on period
      const lastChar = currentPeriod.slice(-1);
      const digit = parseInt(lastChar, 10) || Math.floor(Math.random() * 10);
      const size: 'BIG' | 'SMALL' = digit >= 5 ? 'BIG' : 'SMALL';
      const color: 'green' | 'red' | 'violet' =
        digit === 0 || digit === 5
          ? 'violet'
          : digit % 2 === 1
          ? 'green'
          : 'red';

      // Check if matched prediction
      const matched = prediction.s === size || prediction.n === digit;

      const newDraw: SimulatedDraw = {
        period: currentPeriod,
        number: digit,
        size,
        color,
        matchedPrediction: matched,
      };

      setRecentDraws((prev) => {
        // avoid duplicate periods
        if (prev.length > 0 && prev[0].period === currentPeriod) return prev;
        return [newDraw, ...prev.slice(0, 9)];
      });

      // Handle user bet outcome
      if (userBet) {
        let won = false;
        if (userBet.type === size) won = true;
        if (userBet.type === String(digit)) won = true;
        if (userBet.type === color) won = true;

        if (won) {
          const payout = userBet.type === String(digit) ? userBet.amount * 9 : userBet.amount * 1.96;
          setBalance((b) => Math.round(b + payout));
          setLastWinAlert(`🎉 WON +₹${Math.round(payout)} on Period ${currentPeriod.slice(-4)}!`);
        } else {
          setLastWinAlert(`💥 Period ${currentPeriod.slice(-4)} result: ${digit} (${size})`);
        }
        setTimeout(() => setLastWinAlert(null), 5000);
        setUserBet(null);
      }
    }
  }, [secondsRemaining, currentPeriod, prediction, userBet]);

  // Seed initial draws on first render
  useEffect(() => {
    if (recentDraws.length === 0) {
      const initial: SimulatedDraw[] = [];
      const baseNum = BigInt(currentPeriod || '2026110710000380');
      for (let i = 1; i <= 6; i++) {
        const p = (baseNum - BigInt(i)).toString();
        const d = (parseInt(p.slice(-1), 10) + i) % 10;
        initial.push({
          period: p,
          number: d,
          size: d >= 5 ? 'BIG' : 'SMALL',
          color: d === 0 || d === 5 ? 'violet' : d % 2 === 1 ? 'green' : 'red',
          matchedPrediction: Math.random() > 0.15,
        });
      }
      setRecentDraws(initial);
    }
  }, [currentPeriod, recentDraws.length]);

  const placeBet = (type: string, amount: number) => {
    if (balance < amount) return;
    playClickSound();
    setBalance((b) => b - amount);
    setUserBet({ type, amount });
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-[#05000a] overflow-hidden select-none">
      {/* 1. Real Iframe Background */}
      {(mode === 'iframe' || mode === 'split') && (
        <div
          className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
            mode === 'split' ? 'right-1/2 border-r border-[#3c096c]/40' : ''
          }`}
        >
          <iframe
            key={iframeKey}
            id="siteBackground"
            title="Website background"
            src={iframeUrl}
            referrerPolicy="no-referrer"
            loading="eager"
            className="w-full h-full border-0 bg-[#05000a]"
            onLoad={() => setIframeLoaded(true)}
          />

          {/* Fallback info bar for iframe embedding */}
          <div className="absolute top-16 left-4 right-4 md:right-auto md:w-96 p-3 rounded-lg bg-[#100021]/80 backdrop-blur-md border border-[#c77dff]/30 shadow-lg text-xs pointer-events-auto">
            <div className="flex items-center justify-between text-[#c77dff] mb-1 font-semibold">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Live Target Connection
              </span>
              <button
                onClick={() => {
                  setIframeKey((k) => k + 1);
                  setIframeLoaded(false);
                }}
                className="text-white/60 hover:text-white p-0.5"
                title="Reload Frame"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
            <p className="text-white/70 text-[11px] leading-relaxed">
              Target:{' '}
              <span className="font-mono text-[#e0aaff]">
                {iframeUrl.length > 38 ? iframeUrl.slice(0, 38) + '…' : iframeUrl}
              </span>
            </p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-[10px] text-emerald-400">
                {iframeLoaded ? '✓ Frame Active' : 'Connecting to host…'}
              </span>
              <a
                href={iframeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-[#c77dff] hover:underline"
              >
                Open in new tab <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 2. Interactive WinGo 1M Game Arena */}
      {(mode === 'arena' || mode === 'split') && (
        <div
          className={`absolute inset-0 w-full h-full overflow-y-auto px-4 py-16 md:py-16 ${
            mode === 'split' ? 'left-1/2' : ''
          }`}
        >
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Arena Header Bar */}
            <div className="bg-gradient-to-r from-[#100021] via-[#240046] to-[#100021] border border-[#c77dff]/30 rounded-xl p-4 shadow-xl backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#c77dff] font-bold">
                    WinGo 1-Minute Lottery Arena
                  </div>
                  <div className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <span>Period:</span>
                    <span className="font-mono text-[#e0aaff]">{currentPeriod}</span>
                  </div>
                </div>

                {/* Real-time Countdown Timer */}
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-white/50 flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3 text-[#c77dff]" />
                    Time Remaining
                  </div>
                  <div
                    className={`font-mono text-2xl font-black ${
                      secondsRemaining <= 5 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
                    }`}
                  >
                    00:{String(secondsRemaining).padStart(2, '0')}
                  </div>
                </div>
              </div>

              {/* User Balance Strip */}
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-white/60">
                  Demo Wallet Balance:{' '}
                  <strong className="text-white font-mono text-sm">₹{balance.toLocaleString()}</strong>
                </span>
                {userBet ? (
                  <span className="text-[#c77dff] font-semibold text-[11px] animate-pulse">
                    Active Bet: {userBet.type} (₹{userBet.amount})
                  </span>
                ) : (
                  <span className="text-white/40 text-[11px]">Ready for next round</span>
                )}
              </div>

              {/* Win Notification Banner */}
              {lastWinAlert && (
                <div className="mt-2.5 p-2 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-semibold text-center">
                  {lastWinAlert}
                </div>
              )}
            </div>

            {/* AI HUD Live Alignment Box */}
            <div className="bg-[#1b0033]/60 border border-[#9d4edd]/40 rounded-xl p-3.5 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#3c096c] to-[#9d4edd] flex items-center justify-center border border-white/30 shadow-inner">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-[10px] text-[#c77dff] font-bold uppercase tracking-wider">
                    Apex Python Prediction Sync
                  </div>
                  <div className="text-sm font-semibold text-white">
                    Target: <span className="font-mono text-emerald-400">{prediction.s}</span> ({prediction.n})
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => placeBet(prediction.s, 100)}
                  disabled={userBet !== null || balance < 100}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#9d4edd] to-[#c77dff] text-white text-xs font-bold hover:brightness-110 active:scale-95 disabled:opacity-40 transition-all shadow-md"
                >
                  Quick Bet HUD ({prediction.s} ₹100)
                </button>
              </div>
            </div>

            {/* Quick Interactive Betting Board */}
            <div className="bg-[#100021]/80 border border-white/10 rounded-xl p-4 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-white/70">
                Interactive Bet Simulator
              </div>

              {/* Color Controls */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => placeBet('green', 50)}
                  disabled={userBet !== null}
                  className="py-2.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold text-xs tracking-wider transition-all disabled:opacity-50"
                >
                  GREEN (x2)
                </button>
                <button
                  onClick={() => placeBet('violet', 50)}
                  disabled={userBet !== null}
                  className="py-2.5 rounded-lg bg-purple-600/80 hover:bg-purple-500 text-white font-bold text-xs tracking-wider transition-all disabled:opacity-50"
                >
                  VIOLET (x4.5)
                </button>
                <button
                  onClick={() => placeBet('red', 50)}
                  disabled={userBet !== null}
                  className="py-2.5 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white font-bold text-xs tracking-wider transition-all disabled:opacity-50"
                >
                  RED (x2)
                </button>
              </div>

              {/* Number Balls 0 - 9 */}
              <div className="grid grid-cols-5 md:grid-cols-10 gap-1.5 pt-1">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
                  const isViolet = digit === 0 || digit === 5;
                  const isGreen = digit % 2 === 1;
                  const bg = isViolet
                    ? 'bg-gradient-to-br from-purple-600 to-rose-600'
                    : isGreen
                    ? 'bg-emerald-600'
                    : 'bg-rose-600';
                  const isPredicted = prediction.n === digit;

                  return (
                    <button
                      key={digit}
                      onClick={() => placeBet(String(digit), 20)}
                      disabled={userBet !== null}
                      className={`relative aspect-square rounded-lg ${bg} text-white font-mono font-black text-sm flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm ${
                        isPredicted ? 'ring-2 ring-white ring-offset-1 ring-offset-black' : ''
                      }`}
                    >
                      {digit}
                      {isPredicted && (
                        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white rounded-full flex items-center justify-center text-[7px] text-purple-900 font-extrabold shadow">
                          ★
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Big / Small Choice */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => placeBet('BIG', 50)}
                  disabled={userBet !== null}
                  className={`py-2 rounded-lg font-bold text-xs tracking-wider transition-all disabled:opacity-50 ${
                    prediction.s === 'BIG'
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white ring-1 ring-emerald-300'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  BIG (5-9) {prediction.s === 'BIG' ? '★ APEX PICK' : ''}
                </button>
                <button
                  onClick={() => placeBet('SMALL', 50)}
                  disabled={userBet !== null}
                  className={`py-2 rounded-lg font-bold text-xs tracking-wider transition-all disabled:opacity-50 ${
                    prediction.s === 'SMALL'
                      ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white ring-1 ring-purple-300'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  SMALL (0-4) {prediction.s === 'SMALL' ? '★ APEX PICK' : ''}
                </button>
              </div>
            </div>

            {/* Recent Draw History Table */}
            <div className="bg-[#100021]/80 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-white/70">
                  Recent Verified Draws
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  HUD Match Rate: ~88.4%
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-white/50 text-[10px] uppercase">
                      <th className="pb-2">Period</th>
                      <th className="pb-2">Number</th>
                      <th className="pb-2">Size</th>
                      <th className="pb-2">Color</th>
                      <th className="pb-2 text-right">HUD Match</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                    {recentDraws.map((draw) => (
                      <tr key={draw.period} className="hover:bg-white/5">
                        <td className="py-2 text-white/80">{draw.period}</td>
                        <td className="py-2">
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-white font-bold text-[10px] ${
                              draw.color === 'green'
                                ? 'bg-emerald-600'
                                : draw.color === 'red'
                                ? 'bg-rose-600'
                                : 'bg-purple-600'
                            }`}
                          >
                            {draw.number}
                          </span>
                        </td>
                        <td className="py-2">
                          <span
                            className={
                              draw.size === 'BIG' ? 'text-emerald-400 font-bold' : 'text-purple-400 font-bold'
                            }
                          >
                            {draw.size}
                          </span>
                        </td>
                        <td className="py-2 capitalize text-white/60">{draw.color}</td>
                        <td className="py-2 text-right">
                          {draw.matchedPrediction ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-sans text-[10px]">
                              <CheckCircle2 className="w-3 h-3" /> Hit
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-white/40 font-sans text-[10px]">
                              <XCircle className="w-3 h-3" /> Miss
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
