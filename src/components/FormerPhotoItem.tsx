'use client';

import React, { useState } from 'react';
import { Camera, Maximize2, Trophy, Heart, Sparkles } from 'lucide-react';
import { FormerPhoto } from '@/data/formerGallery';

interface FormerPhotoItemProps {
  photo: FormerPhoto;
  onClick?: () => void;
  aspect?: 'square' | 'video' | 'tall';
}

export default function FormerPhotoItem({
  photo,
  onClick,
  aspect = 'square',
}: FormerPhotoItemProps) {
  const [imgError, setImgError] = useState(false);
  const [extIndex, setExtIndex] = useState(0);

  // Fallback file extensions: .jpg -> .png -> .jpeg -> .webp
  const extensions = ['.jpg', '.png', '.jpeg', '.webp'];
  const baseName = photo.filename.replace(/\.[^/.]+$/, '');
  const currentSrc = `/former-gallery/${baseName}${extensions[extIndex]}`;

  const handleImageError = () => {
    if (extIndex < extensions.length - 1) {
      setExtIndex(extIndex + 1);
    } else {
      setImgError(true);
    }
  };

  const aspectClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    tall: 'aspect-[4/5]',
  }[aspect];

  return (
    <div
      onClick={onClick}
      className={`group relative card-gloss rounded-2xl overflow-hidden cursor-pointer border border-[#2C3960]/80 hover:border-amber-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 ${aspectClass}`}
    >
      {!imgError ? (
        <img
          src={currentSrc}
          alt={photo.title}
          onError={handleImageError}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#161D36] via-[#1C2541] to-[#0D1326] p-3 sm:p-4 flex flex-col justify-between relative overflow-hidden select-none">
          {/* Subtle background glow */}
          <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between z-10">
            <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              #{photo.id} &bull; Heritage
            </span>
            <Camera className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
          </div>

          <div className="text-center my-auto py-1 z-10">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto mb-1.5 group-hover:scale-110 transition-transform">
              {photo.category.includes('Trophy') ? (
                <Trophy className="w-4 h-4" />
              ) : photo.category.includes('Prayer') ? (
                <Heart className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </div>
            <p className="text-xs font-bold text-white leading-tight line-clamp-2 px-1">
              {photo.title}
            </p>
            <p className="text-[10px] text-amber-400/90 mt-0.5 font-medium">
              {photo.tournamentEdition}
            </p>
          </div>

          <div className="z-10 flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-[#2C3960]/60">
            <span className="truncate">{photo.category}</span>
            <span className="text-amber-400 font-semibold group-hover:underline">View &rarr;</span>
          </div>
        </div>
      )}

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between pointer-events-none">
        <div className="flex items-center justify-between">
          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-500 text-slate-950">
            Heritage #{photo.id}
          </span>
          <span className="p-1 rounded-lg bg-slate-900/80 text-white backdrop-blur-sm">
            <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
          </span>
        </div>

        <div>
          <p className="text-xs font-bold text-white leading-tight line-clamp-1">{photo.title}</p>
          <p className="text-[10px] text-slate-300 line-clamp-2 mt-0.5">{photo.caption}</p>
          <span className="text-[9px] text-amber-400 font-medium block mt-1">{photo.tournamentEdition}</span>
        </div>
      </div>
    </div>
  );
}
