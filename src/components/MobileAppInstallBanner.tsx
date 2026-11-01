'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Download,
  X,
  Share,
  PlusSquare,
  Sparkles,
  Smartphone,
  CheckCircle2,
  ExternalLink,
  Compass,
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function MobileAppInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [installed, setInstalled] = useState(false);

  // Synchronize prompt from global window
  const syncPrompt = useCallback(() => {
    if (typeof window !== 'undefined') {
      const globalPrompt = (window as any).__focusCupDeferredPrompt;
      if (globalPrompt) {
        setDeferredPrompt(globalPrompt);
        return globalPrompt;
      }
    }
    return null;
  }, []);

  useEffect(() => {
    // 1. Register Service Worker for PWA functionality
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('Focus Cup ServiceWorker registered:', reg.scope);
          })
          .catch((err) => {
            console.warn('ServiceWorker registration error:', err);
          });
      });
    }

    // 2. Check if already installed as standalone PWA
    const checkStandalone = () => {
      if (typeof window === 'undefined') return false;
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    if (checkStandalone()) {
      return;
    }

    // 3. Device detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isApple = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    const isDroid = /android/.test(userAgent);
    setIsIOS(isApple);
    setIsAndroid(isDroid);

    // 4. Initial check for prompt already captured by head script
    syncPrompt();

    // 5. Catch Android/Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).__focusCupDeferredPrompt = e;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    const handleCustomPromptReady = () => {
      syncPrompt();
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('focuscup-pwa-ready', handleCustomPromptReady);

    // 6. Listen for successful installation
    const handleAppInstalled = () => {
      setInstalled(true);
      setShowBanner(false);
      setShowModal(false);
      setDeferredPrompt(null);
      if (typeof window !== 'undefined') {
        (window as any).__focusCupDeferredPrompt = null;
      }
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // 7. Auto-show install banner on mobile after 1.5 seconds if not dismissed
    const dismissedUntil = localStorage.getItem('focus_pwa_dismissed_until');
    const isDismissed = dismissedUntil && Date.now() < Number(dismissedUntil);

    const timer = setTimeout(() => {
      const isMobile = isApple || isDroid || /mobile/.test(userAgent);
      if (isMobile && !checkStandalone() && !isDismissed) {
        setShowBanner(true);
      }
    }, 1500);

    // 8. Manual trigger listener from navbar / drawer
    const handleManualTrigger = async () => {
      const activePrompt = syncPrompt() || deferredPrompt;
      if (activePrompt) {
        try {
          await activePrompt.prompt();
          const choiceResult = await activePrompt.userChoice;
          if (choiceResult.outcome === 'accepted') {
            setShowBanner(false);
            setDeferredPrompt(null);
            (window as any).__focusCupDeferredPrompt = null;
          }
          return;
        } catch (err) {
          console.warn('Direct prompt failed:', err);
        }
      }
      // If no native prompt is available (e.g. iOS or In-App browser), show modal
      setShowModal(true);
    };

    window.addEventListener('trigger-pwa-install', handleManualTrigger);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('focuscup-pwa-ready', handleCustomPromptReady);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('trigger-pwa-install', handleManualTrigger);
      clearTimeout(timer);
    };
  }, [syncPrompt, deferredPrompt]);

  const handleInstallClick = async () => {
    const activePrompt = syncPrompt() || deferredPrompt;

    if (activePrompt) {
      try {
        await activePrompt.prompt();
        const choiceResult = await activePrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setShowBanner(false);
          setShowModal(false);
          setDeferredPrompt(null);
          (window as any).__focusCupDeferredPrompt = null;
        }
        return;
      } catch (err) {
        console.warn('Direct prompt failed:', err);
      }
    }

    // Fallback: If native prompt isn't supported in current view (In-app browser or iOS)
    setShowModal(true);
  };

  const handleOpenInChrome = () => {
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.href.replace(/^https?:\/\//, '');
      const intentUrl = `intent://${currentUrl}#Intent;scheme=https;package=com.android.chrome;end`;
      window.location.href = intentUrl;
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('focus_pwa_dismissed_until', String(Date.now() + 48 * 60 * 60 * 1000));
  };

  if (isStandalone || installed || (!showBanner && !showModal)) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom Install Banner (Positioned above mobile nav) */}
      {showBanner && !showModal && (
        <div className="fixed bottom-16 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="card-gloss rounded-3xl p-4 border-2 border-emerald-500/50 bg-[#0B132B]/95 backdrop-blur-xl shadow-2xl shadow-emerald-500/20 text-white flex items-center justify-between gap-3 relative overflow-hidden">
            <div className="absolute -top-12 -left-12 w-28 h-28 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>

            {/* App Icon & Details */}
            <div className="flex items-center gap-3 pr-2 min-w-0">
              <div className="relative w-12 h-12 rounded-2xl bg-white p-1 border-2 border-emerald-400/80 shadow-md shrink-0 overflow-hidden flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Focus Football Cup"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
                <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0B132B]" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-black tracking-tight text-white truncate">
                    Focus Football Cup
                  </h4>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-emerald-500 text-slate-950">
                    App
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-tight mt-0.5 truncate">
                  Install on phone for 1-tap app experience
                </p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold mt-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Fixtures, live scores, batches &amp; gallery</span>
                </div>
              </div>
            </div>

            {/* Install Button */}
            <button
              onClick={handleInstallClick}
              className="shrink-0 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
          </div>
        </div>
      )}

      {/* Direct Install & In-App Browser Helper Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
        >
          <div
            className="card-gloss w-full max-w-sm rounded-3xl p-6 border border-emerald-500/40 bg-[#0E162E] text-white shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white p-1 border border-emerald-400 shadow-md overflow-hidden shrink-0 flex items-center justify-center">
                  <Image
                    src="/logo.png"
                    alt="Focus Football Cup"
                    width={40}
                    height={40}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {isIOS ? 'Install on iPhone / iPad' : 'Install Focus Cup App'}
                  </h3>
                  <p className="text-xs text-slate-400">Add to Home Screen in 1 tap</p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Android In-App Browser (e.g. Telegram / WhatsApp / Facebook webview) Helper */}
            {!isIOS && (
              <div className="space-y-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                    <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Direct 1-Tap Installation in Chrome:</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    You are currently viewing this inside an in-app browser. Tap the button below to switch to Google Chrome where installation happens directly with 1 tap:
                  </p>
                  <button
                    onClick={handleOpenInChrome}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open in Chrome &amp; Install Directly</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 text-center font-medium">
                  — OR directly from this screen —
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/80 border border-[#2C3960] flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <p className="text-xs text-slate-200 leading-snug">
                    Tap the menu <span className="font-bold text-white">(⋮)</span> at the top-right corner of your screen.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/80 border border-[#2C3960] flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <p className="text-xs text-slate-200 leading-snug">
                    Tap <span className="font-bold text-emerald-400">Open in Chrome</span> or <span className="font-bold text-emerald-400">Install app</span>.
                  </p>
                </div>
              </div>
            )}

            {/* iOS Safari Guide */}
            {isIOS && (
              <div className="space-y-3 pt-1">
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-[#2C3960] flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <p className="text-xs text-slate-200 leading-snug">
                    Tap the <span className="font-bold text-white inline-flex items-center gap-1 mx-0.5"><Share className="w-3.5 h-3.5 text-blue-400 inline" /> Share</span> button at the bottom of Safari.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/80 border border-[#2C3960] flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <p className="text-xs text-slate-200 leading-snug">
                    Scroll down and tap <span className="font-bold text-white inline-flex items-center gap-1 mx-0.5"><PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline" /> Add to Home Screen</span>.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/80 border border-[#2C3960] flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                    3
                  </span>
                  <p className="text-xs text-slate-200 leading-snug">
                    Tap <span className="font-bold text-emerald-400">Add</span> at the top right. Focus Cup is now installed!
                  </p>
                </div>
              </div>
            )}

            {/* Benefits badge */}
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Full-screen standalone app with instant offline loading!</span>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs tracking-wider uppercase transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
