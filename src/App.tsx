/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HudMode } from './types';
import { usePredictionEngine, getSecureEndpoint } from './hooks/usePredictionEngine';
import { ElectricCanvas } from './components/ElectricCanvas';
import { ApexHud } from './components/ApexHud';
import { ReopenButton } from './components/ReopenButton';
import { APP_CONFIG } from './config';

export default function App() {
  const [hudMode, setHudMode] = useState<HudMode>('result');
  const [isHudVisible, setIsHudVisible] = useState<boolean>(true);
  const [iframeUrl, setIframeUrl] = useState<string>(APP_CONFIG.defaultRegisterUrl);

  const hudRef = useRef<HTMLDivElement | null>(null);

  const {
    currentPeriod,
    prediction,
    isGenerating,
    fetchPrediction,
  } = usePredictionEngine();

  // Handle service navigation (register / deposit)
  const handleNavigateService = useCallback((service: 'register' | 'deposit') => {
    const bridge = (window as unknown as { AndroidBridge?: { navigateToService?: (s: string) => void } })
      .AndroidBridge;
    if (bridge && typeof bridge.navigateToService === 'function') {
      bridge.navigateToService(service);
      return;
    }

    const targetUrl = getSecureEndpoint(service);
    if (targetUrl) {
      setIframeUrl(targetUrl);
    }
  }, []);

  // Expose bridge hooks for external Android WebView wrapper or console automation
  useEffect(() => {
    (window as unknown as {
      smoothSwitchHud?: (mode: HudMode) => void;
      fetchLatestLotteryResultAndReveal?: () => void;
      currentPrediction?: typeof prediction;
      lastKnownPeriod?: string;
    }).smoothSwitchHud = (mode: HudMode) => {
      setHudMode(mode);
    };

    (window as unknown as { fetchLatestLotteryResultAndReveal?: () => void }).fetchLatestLotteryResultAndReveal = () => {
      fetchPrediction(true);
    };

    (window as unknown as { currentPrediction?: typeof prediction }).currentPrediction = prediction;
    (window as unknown as { lastKnownPeriod?: string }).lastKnownPeriod = currentPeriod;
  }, [fetchPrediction, prediction, currentPeriod]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#05000a] text-white select-none">
      {/* 1. Pure Full-Screen Game Frame (https://dkwin9.com/#/register?invitationCode=737351986511) */}
      <iframe
        id="siteBackground"
        title="Game Frame"
        src={iframeUrl}
        referrerPolicy="no-referrer"
        loading="eager"
        className="fixed inset-0 w-full h-full border-0 bg-[#05000a] pointer-events-auto z-0"
      />

      {/* 2. Interactive Electric Lightning Canvas */}
      <ElectricCanvas hudRef={hudRef} />

      {/* 3. Floating Cyber HUD Panel Box (with blurred background image & configured brand) */}
      {isHudVisible && (
        <ApexHud
          hudMode={hudMode}
          periodText={currentPeriod}
          prediction={prediction}
          isGenerating={isGenerating}
          onGenerate={() => fetchPrediction(true)}
          onNavigateService={handleNavigateService}
          onClose={() => setIsHudVisible(false)}
          containerRef={hudRef}
        />
      )}

      {/* 4. Floating Reopen Button (shown only when HUD panel is closed) */}
      <ReopenButton
        isVisible={!isHudVisible}
        onReopen={() => setIsHudVisible(true)}
      />
    </div>
  );
}
