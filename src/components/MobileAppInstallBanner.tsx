'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Download,
  X,
  Share,
  PlusSquare,
  Sparkles,
  Smartphone,
  CheckCircle2,
  ChevronRight,
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
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker for PWA functionality
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('Focus Cup ServiceWorker registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('ServiceWorker registration failed:', err);
          });
      });
    }

    // 2. Check if already installed as standalone PWA
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    if (checkStandalone()) {
      return; // Already running as native-like installed mobile app!
    }

    // 3. Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(isAppleDevice);

    // 4. Check if dismissed recently (2 days cooldown)
    const dismissedUntil = localStorage.getItem('focus_pwa_dismissed_until');
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
      return;
    }

    // 5. Catch Android/Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 6. Listen for successful installation
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    // 7. On mobile devices (iOS or Android), show banner after brief delay (1.5 seconds)
    const timer = setTimeout(() => {
      const isMobile = /android|iphone|ipad|ipod|mobile/.test(userAgent);
      if (isMobile && !checkStandalone()) {
        setShowBanner(true);
      }
    }, 1500);

    // Listen for manual trigger from navbar or footer
    const handleManualTrigger = () => {
      if (isAppleDevice) {
        setShowIOSModal(true);
      } else if (deferredPrompt) {
        deferredPrompt.prompt();
      } else {
        setShowBanner(true);
      }
    };
    window.addEventListener('trigger-pwa-install', handleManualTrigger);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('trigger-pwa-install', handleManualTrigger);
      clearTimeout(timer);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setShowBanner(false);
        setDeferredPrompt(null);
      }
    } else {
      // Fallback instructions for other Android / mobile browsers
      setShowIOSModal(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Don't show again for 48 hours
    localStorage.setItem('focus_pwa_dismissed_until', String(Date.now() + 48 * 60 * 60 * 1000));
  };

  if (isStandalone || installed || (!showBanner && !showIOSModal)) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom Install Banner (Positioned above mobile nav) */}
      {showBanner && !showIOSModal && (
        <div className="fixed bottom-16 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="card-gloss rounded-3xl p-4 border-2 border-emerald-500/50 bg-[#0B132B]/95 backdrop-blur-xl shadow-2xl shadow-emerald-500/20 text-white flex items-center justify-between gap-3 relative overflow-hidden">
            {/* Subtle emerald glow */}
            <div className="absolute -top-12 -left-12 w-28 h-28 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Left: App Icon & Details */}
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
                  Install on phone for full-screen experience
                </p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold mt-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Instant fixtures, live scores &amp; gallery</span>
                </div>
              </div>
            </div>

            {/* Right: Install Button */}
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

      {/* iOS / General Step-by-Step Install Guide Modal */}
      {showIOSModal && (
        <div
          className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="card-gloss w-full max-w-sm rounded-3xl p-6 border border-emerald-500/40 bg-[#0E162E] text-white shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white p-1 border border-emerald-400 shadow-md overflow-hidden shrink-0">
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
                  <p className="text-xs text-slate-400">Add to Home Screen in 2 taps</p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step-by-step instructions */}
            <div className="space-y-3 pt-2">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-[#2C3960] flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                  1
                </span>
                <p className="text-xs text-slate-200 leading-snug">
                  {isIOS ? (
                    <>
                      Tap the <span className="font-bold text-white inline-flex items-center gap-1 mx-0.5"><Share className="w-3.5 h-3.5 text-blue-400 inline" /> Share</span> button at the bottom of Safari.
                    </>
                  ) : (
                    <>
                      Tap your browser menu <span className="font-bold text-white mx-0.5">(⋮)</span> at the top right.
                    </>
                  )}
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
                  Tap <span className="font-bold text-emerald-400">Add</span> at the top right. Focus Cup is now installed on your phone!
                </p>
              </div>
            </div>

            {/* Benefits badge */}
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Full-screen app with fast loading and zero browser address bars!</span>
            </div>

            {/* Got it button */}
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs tracking-wider uppercase transition-colors cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}
