'use client';

import React, { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar, Camera, Trophy, Heart, Sparkles, Tag } from 'lucide-react';
import { FormerPhoto } from '@/data/formerGallery';

interface GalleryLightboxProps {
  photos: FormerPhoto[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectIndex: (index: number) => void;
}

export default function GalleryLightbox({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onSelectIndex,
}: GalleryLightboxProps) {
  const currentPhoto = photos[currentIndex];

  const handlePrev = useCallback(() => {
    if (photos.length === 0) return;
    onSelectIndex((currentIndex - 1 + photos.length) % photos.length);
  }, [currentIndex, photos.length, onSelectIndex]);

  const handleNext = useCallback(() => {
    if (photos.length === 0) return;
    onSelectIndex((currentIndex + 1) % photos.length);
  }, [currentIndex, photos.length, onSelectIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose]);

  if (!isOpen || !currentPhoto) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div
        className="flex items-center justify-between z-20 pb-3 border-b border-[#2C3960]/60 max-w-6xl w-full mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500 text-slate-950">
            Historical Memory #{currentPhoto.id}
          </span>
          <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
            Former Focus Cup Fellowship Gallery ({currentIndex + 1} of {photos.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono sm:hidden">
            {currentIndex + 1} / {photos.length}
          </span>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title="Close Lightbox (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Showcase Area with Nav Arrows */}
      <div
        className="relative flex-1 flex items-center justify-center my-3 max-w-6xl w-full mx-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Arrow */}
        <button
          onClick={handlePrev}
          className="absolute left-2 sm:left-4 z-30 p-3 rounded-2xl bg-slate-900/80 hover:bg-amber-500 hover:text-slate-950 text-white border border-[#2C3960] transition-all shadow-xl backdrop-blur-sm group"
          title="Previous photo (Left arrow)"
        >
          <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
        </button>

        {/* Right Arrow */}
        <button
          onClick={handleNext}
          className="absolute right-2 sm:right-4 z-30 p-3 rounded-2xl bg-slate-900/80 hover:bg-amber-500 hover:text-slate-950 text-white border border-[#2C3960] transition-all shadow-xl backdrop-blur-sm group"
          title="Next photo (Right arrow)"
        >
          <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* The Photo Container */}
        <div className="relative max-h-[60vh] sm:max-h-[68vh] w-full max-w-4xl h-full flex flex-col items-center justify-center">
          <div className="relative w-full h-full rounded-3xl overflow-hidden card-gloss border border-[#2C3960] flex items-center justify-center bg-slate-950/60 shadow-2xl">
            <img
              src={`/former-gallery/${currentPhoto.filename}`}
              alt={currentPhoto.title}
              onError={(e) => {
                // If not yet uploaded, show styled athletic fallback
                e.currentTarget.style.display = 'none';
                const fallback = document.getElementById(`lightbox-fallback-${currentPhoto.id}`);
                if (fallback) fallback.style.display = 'flex';
              }}
              className="max-h-[60vh] sm:max-h-[68vh] w-auto max-w-full object-contain mx-auto transition-transform"
            />

            {/* Fallback Display if image file is pending insertion */}
            <div
              id={`lightbox-fallback-${currentPhoto.id}`}
              style={{ display: 'none' }}
              className="w-full h-full min-h-[320px] flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[#161D36] via-[#1C2541] to-[#0D1326]"
            >
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
                <Camera className="w-8 h-8" />
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
                Photo #{currentPhoto.id} &bull; {currentPhoto.category}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white max-w-md">
                {currentPhoto.title}
              </h3>
              <p className="text-xs text-slate-400 mt-2 max-w-lg leading-relaxed">
                {currentPhoto.caption}
              </p>
              <div className="mt-5 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-medium italic">
                &ldquo;Winning is a bonus; friendship, joy, and fellowship come first!&rdquo;
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Caption & Metadata Panel */}
      <div
        className="card-gloss max-w-6xl w-full mx-auto p-4 sm:p-5 rounded-2xl border border-[#2C3960] z-20 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-amber-400 text-xs font-bold flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" /> {currentPhoto.tournamentEdition}
              </span>
              <span className="text-slate-500">&bull;</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                {currentPhoto.category}
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-black text-white">
              {currentPhoto.title}
            </h4>
          </div>

          <p className="text-xs text-slate-300 sm:max-w-md sm:text-right leading-relaxed">
            {currentPhoto.caption}
          </p>
        </div>

        {/* Thumbnail Selector Strip (15 photos) */}
        <div className="pt-2 border-t border-[#2C3960]/60 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {photos.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => onSelectIndex(idx)}
              className={`shrink-0 w-12 h-12 rounded-xl overflow-hidden border-2 transition-all relative ${
                idx === currentIndex
                  ? 'border-amber-400 scale-105 shadow-md shadow-amber-500/30'
                  : 'border-[#2C3960] opacity-60 hover:opacity-100 hover:border-slate-400'
              }`}
              title={`#${p.id} - ${p.title}`}
            >
              <div className="w-full h-full bg-[#161D36] flex items-center justify-center text-[10px] font-black text-amber-300">
                #{p.id}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
