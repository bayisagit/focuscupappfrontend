'use client';

import React from 'react';

export default function RouteLoadingIndicator() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      {/* Top Gradient Progress Bar */}
      <div className="h-[3px] w-full bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-400 shadow-md shadow-emerald-500/50 animate-pulse" />
    </div>
  );
}
