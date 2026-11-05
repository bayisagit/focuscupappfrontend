'use client';

import React from 'react';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerColor = 'emerald' | 'purple' | 'amber' | 'blue' | 'white' | 'slate';

export interface SpinnerProps {
  /** Size preset: xs (16px), sm (20px), md (32px), lg (48px), xl (64px) */
  size?: SpinnerSize;
  /** Color theme palette */
  color?: SpinnerColor;
  /** Primary loading label displayed under the spinner */
  label?: string;
  /** Secondary subtitle (e.g. "Focus Football Cup") */
  sublabel?: string;
  /** If true, centers the spinner within its container with vertical padding */
  centered?: boolean;
  /** If true, renders a spacious full-page or section loading view */
  fullPage?: boolean;
  /** Extra CSS classes on the outermost wrapper */
  className?: string;
}

const colorMap: Record<SpinnerColor, { track: string; arc: string; glow: string; text: string }> = {
  emerald: {
    track: 'text-emerald-500/20',
    arc: 'text-emerald-400',
    glow: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.45)]',
    text: 'text-emerald-300',
  },
  purple: {
    track: 'text-purple-500/20',
    arc: 'text-purple-400',
    glow: 'drop-shadow-[0_0_8px_rgba(168,85,247,0.45)]',
    text: 'text-purple-300',
  },
  amber: {
    track: 'text-amber-500/20',
    arc: 'text-amber-400',
    glow: 'drop-shadow-[0_0_8px_rgba(245,158,11,0.45)]',
    text: 'text-amber-300',
  },
  blue: {
    track: 'text-blue-500/20',
    arc: 'text-blue-400',
    glow: 'drop-shadow-[0_0_8px_rgba(59,130,246,0.45)]',
    text: 'text-blue-300',
  },
  white: {
    track: 'text-white/20',
    arc: 'text-white',
    glow: 'drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]',
    text: 'text-white',
  },
  slate: {
    track: 'text-slate-600/30',
    arc: 'text-slate-300',
    glow: 'drop-shadow-[0_0_6px_rgba(148,163,184,0.3)]',
    text: 'text-slate-300',
  },
};

const sizeMap: Record<SpinnerSize, { stroke: number; classStr: string; labelClass: string }> = {
  xs: { stroke: 3.5, classStr: 'w-4 h-4', labelClass: 'text-[11px]' },
  sm: { stroke: 3.5, classStr: 'w-5 h-5', labelClass: 'text-xs' },
  md: { stroke: 3.8, classStr: 'w-8 h-8', labelClass: 'text-xs' },
  lg: { stroke: 4.0, classStr: 'w-12 h-12', labelClass: 'text-sm' },
  xl: { stroke: 4.2, classStr: 'w-16 h-16', labelClass: 'text-sm sm:text-base' },
};

/**
 * Spinner - A rotating circular animation loader.
 * Renders an ultra-smooth, lightweight SVG circular track and rotating arc
 * that never pixelates and fits buttons, cards, tables, and full pages.
 */
export default function Spinner({
  size = 'md',
  color = 'emerald',
  label,
  sublabel,
  centered = false,
  fullPage = false,
  className = '',
}: SpinnerProps) {
  const c = colorMap[color] || colorMap.emerald;
  const s = sizeMap[size] || sizeMap.md;

  const spinnerSvg = (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg
        className={`animate-spin ${s.classStr} ${c.glow} transition-all`}
        viewBox="0 0 50 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="status"
        aria-label={label || 'Loading'}
      >
        {/* Outer Circular Track */}
        <circle
          className={c.track}
          cx="25"
          cy="25"
          r="20"
          stroke="currentColor"
          strokeWidth={s.stroke}
        />
        {/* Rotating Circular Arc */}
        <circle
          className={c.arc}
          cx="25"
          cy="25"
          r="20"
          stroke="currentColor"
          strokeWidth={s.stroke}
          strokeLinecap="round"
          strokeDasharray="95"
          strokeDashoffset="65"
        />
      </svg>
      {/* Subtle inner pulse for larger sizes */}
      {(size === 'lg' || size === 'xl') && (
        <div
          className={`absolute w-2 h-2 rounded-full ${
            color === 'purple' ? 'bg-purple-400' : color === 'amber' ? 'bg-amber-400' : 'bg-emerald-400'
          } animate-ping opacity-60 pointer-events-none`}
        />
      )}
    </div>
  );

  // Full-page / section container
  if (fullPage) {
    return (
      <div
        className={`relative min-h-[55vh] flex flex-col items-center justify-center p-8 text-center select-none ${className}`}
      >
        {/* Ambient background glow */}
        <div
          className={`absolute w-48 h-48 rounded-full blur-3xl pointer-events-none ${
            color === 'purple'
              ? 'bg-purple-500/10'
              : color === 'amber'
              ? 'bg-amber-500/10'
              : 'bg-emerald-500/10'
          }`}
        />

        <div className="relative z-10 flex flex-col items-center space-y-4 max-w-sm mx-auto">
          {spinnerSvg}
          <div className="space-y-1">
            <p className={`font-bold tracking-tight text-white ${s.labelClass}`}>
              {label || 'Loading Focus Cup...'}
            </p>
            <p className="text-xs text-slate-400 font-medium">
              {sublabel || 'AASTU Focus Fellowship'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Centered block (for tables, cards, grids)
  if (centered || label) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-6 text-center space-y-3 select-none ${className}`}
      >
        {spinnerSvg}
        {label && (
          <div className="space-y-0.5">
            <p className={`font-semibold text-slate-200 ${s.labelClass}`}>{label}</p>
            {sublabel && <p className="text-[11px] text-slate-400">{sublabel}</p>}
          </div>
        )}
      </div>
    );
  }

  // Bare inline spinner (for inside buttons or headers)
  return (
    <span className={`inline-flex items-center justify-center ${className}`}>
      {spinnerSvg}
    </span>
  );
}

