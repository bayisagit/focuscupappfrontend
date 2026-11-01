'use client';

import React from 'react';
import Image from 'next/image';

interface AastuLogoLoaderProps {
  message?: string;
  subMessage?: string;
  fullScreen?: boolean;
}

export default function AastuLogoLoader({
  message = 'Loading Focus Football Cup...',
  subMessage = 'AASTU Focus Fellowship • Fellowship First',
  fullScreen = false,
}: AastuLogoLoaderProps) {
  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B132B] px-4'
    : 'min-h-[50vh] flex flex-col items-center justify-center p-6';

  return (
    <div className={containerClasses}>
      <div className="relative flex flex-col items-center">
        {/* Ambient Glowing Aura */}
        <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-amber-500/20 to-teal-500/20 rounded-full blur-2xl animate-pulse pointer-events-none" />

        {/* Pulsing Concentric Rings */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-28 h-28 rounded-full border border-emerald-500/30 animate-ping opacity-30" />
          <div className="absolute w-24 h-24 rounded-full border border-amber-400/30 animate-pulse" />

          {/* Official AASTU Focus Logo Card */}
          <div className="relative w-20 h-20 rounded-2xl bg-white p-2.5 shadow-2xl shadow-emerald-500/30 border-2 border-emerald-400/40 flex items-center justify-center transform transition-transform animate-bounce">
            <Image
              src="/logo.png"
              alt="AASTU Focus Fellowship Logo"
              width={70}
              height={70}
              priority
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Brand Text */}
        <div className="mt-6 text-center space-y-1">
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm">
            AASTU FOCUS FELLOWSHIP
          </span>
          <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
            {message}
          </h2>
          <p className="text-xs text-slate-400 italic">
            &ldquo;{subMessage}&rdquo;
          </p>
        </div>

        {/* Smooth Loader Bar */}
        <div className="w-40 sm:w-48 h-1.5 bg-[#1C2541] rounded-full overflow-hidden mt-4 border border-[#2C3960]">
          <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-300 to-amber-400 rounded-full animate-pulse w-3/4" />
        </div>
      </div>
    </div>
  );
}
