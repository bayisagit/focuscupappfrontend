'use client';

import React from 'react';

interface TeamData {
  id?: number | string;
  name?: string | null;
  batch_code?: string | null;
  color_hex?: string | null;
  logo?: string | null;
  logo_url?: string | null;
  team_photo?: string | null;
  team_photo_url?: string | null;
  photo_url?: string | null;
  nickname?: string | null;
}

interface TeamCrestProps {
  team?: TeamData | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  preferBadge?: boolean;
}

export default function TeamCrest({ team, size = 'md', className = '', preferBadge = false }: TeamCrestProps) {
  // Size variations
  const sizeClasses = {
    xs: 'w-6 h-6 rounded-md text-[9px]',
    sm: 'w-8 h-8 rounded-lg text-[11px]',
    md: 'w-10 h-10 rounded-xl text-xs',
    lg: 'w-14 h-14 sm:w-16 sm:h-16 rounded-2xl text-lg',
    xl: 'w-20 h-20 sm:w-24 sm:h-24 rounded-3xl text-2xl sm:text-3xl',
  }[size];

  if (!team) {
    return (
      <div className={`rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs ${sizeClasses} ${className}`}>
        FC
      </div>
    );
  }

  const photo = !preferBadge ? (team.photo_url || team.team_photo_url || team.team_photo || team.logo_url || team.logo) : null;
  if (photo) {
    return (
      <div className={`relative shrink-0 overflow-hidden border border-white/20 shadow-lg ${sizeClasses} ${className}`}>
        <img src={photo} alt={team.name || 'Batch Crest'} className="w-full h-full object-cover" />
      </div>
    );
  }

  // Parse batch number and label informatively
  const code = (team.batch_code || '').toUpperCase();
  const name = team.name || '';

  let mainLabel = 'FC';
  let subLabel = 'BATCH';

  if (code.includes('2ND') || name.includes('2nd') || name.includes('Second')) {
    mainLabel = '2nd';
    subLabel = 'YEAR';
  } else if (code.includes('3RD') || name.includes('3rd') || name.includes('Third')) {
    mainLabel = '3rd';
    subLabel = 'YEAR';
  } else if (code.includes('4TH') || name.includes('4th') || name.includes('Fourth')) {
    mainLabel = '4th';
    subLabel = 'YEAR';
  } else if (code.includes('5TH') || name.includes('5th') || name.includes('Fifth')) {
    mainLabel = '5th';
    subLabel = 'YEAR';
  } else if (code.includes('1ST') || name.includes('1st') || name.includes('First')) {
    mainLabel = '1st';
    subLabel = 'YEAR';
  } else if (name) {
    mainLabel = name.slice(0, 3).toUpperCase();
    subLabel = 'TEAM';
  }

  const bgColor = team.color_hex || '#10B981';

  const subSizeClasses = {
    xs: 'hidden',
    sm: 'hidden',
    md: 'text-[7px]',
    lg: 'text-[9px] mt-0.5',
    xl: 'text-[10px] sm:text-xs mt-1',
  }[size];

  return (
    <div
      className={`relative shrink-0 flex flex-col items-center justify-center font-black text-white shadow-lg border border-white/20 select-none overflow-hidden transition-transform ${sizeClasses} ${className}`}
      style={{
        backgroundColor: bgColor,
        textShadow: '0 1px 2px rgba(0,0,0,0.4)',
      }}
      title={`${team.name || 'Batch Team'}${team.nickname ? ` - "${team.nickname}"` : ''}`}
    >
      {/* Glossy highlight line */}
      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />

      {/* Primary informative batch label */}
      <span className="font-black uppercase tracking-tight leading-none z-10">
        {mainLabel}
      </span>

      {/* Subtitle label for medium and larger */}
      {subSizeClasses !== 'hidden' && (
        <span className={`font-bold uppercase tracking-wider opacity-90 leading-none z-10 ${subSizeClasses}`}>
          {subLabel}
        </span>
      )}
    </div>
  );
}
