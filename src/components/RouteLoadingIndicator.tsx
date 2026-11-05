'use client';

import React from 'react';
import Spinner from './Spinner';

export default function RouteLoadingIndicator({ message }: { message?: string }) {
  return (
    <div className="relative w-full">
      {/* Top Gradient Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
        <div className="h-[3px] w-full bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-400 shadow-md shadow-emerald-500/50 animate-pulse" />
      </div>

      {/* Rotating Circular Spinner Loader */}
      <Spinner
        fullPage
        size="xl"
        color="emerald"
        label={message || 'Loading Focus Cup...'}
        sublabel="AASTU Focus Football Cup"
      />
    </div>
  );
}
