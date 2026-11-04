'use client';

import React, { useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ExternalLink,
  Calendar,
  User,
  Sparkles,
  Camera,
} from 'lucide-react';

export interface TournamentPhoto {
  id: number;
  album?: number;
  image: string;
  image_url?: string;
  caption?: string;
  uploaded_by_name?: string;
  created_at?: string;
}

interface TournamentPhotoLightboxProps {
  photos: TournamentPhoto[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectIndex: (index: number) => void;
  albumTitle?: string;
}

export default function TournamentPhotoLightbox({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onSelectIndex,
  albumTitle = 'Focus Cup Opening Match Highlights',
}: TournamentPhotoLightboxProps) {
  const currentPhoto = photos[currentIndex];

  const handlePrev = useCallback(() => {
    if (photos.length <= 1) return;
    onSelectIndex((currentIndex - 1 + photos.length) % photos.length);
  }, [currentIndex, photos.length, onSelectIndex]);

  const handleNext = useCallback(() => {
    if (photos.length <= 1) return;
    onSelectIndex((currentIndex + 1) % photos.length);
  }, [currentIndex, photos.length, onSelectIndex]);

  // Keyboard navigation: Escape, ArrowLeft, ArrowRight
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, handlePrev, handleNext, onClose]);

  if (!isOpen || !currentPhoto) return null;

  const photoSrc = currentPhoto.image || currentPhoto.image_url;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tournament Match Photo Lightbox"
      className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Header Bar */}
      <div
        className="flex items-center justify-between z-20 pb-3 border-b border-[#2C3960]/60 max-w-6xl w-full mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500 text-slate-950 flex items-center gap-1.5 shadow-md shadow-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            Active Tournament Photo #{currentIndex + 1}
          </span>
          <span className="text-xs text-slate-300 font-semibold hidden sm:inline truncate max-w-md">
            {albumTitle} &bull; ({currentIndex + 1} of {photos.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono sm:hidden">
            {currentIndex + 1} / {photos.length}
          </span>

          {photoSrc && (
            <a
              href={photoSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700 hidden sm:flex items-center gap-1 text-xs"
              title="Open full resolution in new tab"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Full Res</span>
            </a>
          )}

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer border border-slate-700"
            title="Close Lightbox (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Showcase Area with Left/Right Nav */}
      <div
        className="relative flex-1 flex items-center justify-center my-3 max-w-6xl w-full mx-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Arrow Button */}
        {photos.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-2 sm:left-4 z-30 p-3 rounded-2xl bg-slate-900/80 hover:bg-emerald-500 hover:text-slate-950 text-white border border-[#2C3960] transition-all shadow-xl backdrop-blur-sm group cursor-pointer"
            title="Previous photo (Left arrow)"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Center Image Container */}
        <div className="relative max-h-[62vh] sm:max-h-[70vh] w-full max-w-4xl h-full flex flex-col items-center justify-center p-2">
          <div className="relative w-full h-full rounded-3xl overflow-hidden card-gloss border border-[#2C3960] flex items-center justify-center bg-slate-950/80 shadow-2xl">
            {photoSrc ? (
              <img
                src={photoSrc}
                alt={currentPhoto.caption || 'Focus Cup Tournament Photo'}
                className="max-h-[60vh] sm:max-h-[68vh] w-auto max-w-full object-contain mx-auto rounded-2xl transition-all duration-200"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-slate-400 gap-2">
                <Camera className="w-12 h-12 text-emerald-400" />
                <span className="text-xs">No image available</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Arrow Button */}
        {photos.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-2 sm:right-4 z-30 p-3 rounded-2xl bg-slate-900/80 hover:bg-emerald-500 hover:text-slate-950 text-white border border-[#2C3960] transition-all shadow-xl backdrop-blur-sm group cursor-pointer"
            title="Next photo (Right arrow)"
          >
            <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* Caption & Metadata Panel */}
      <div
        className="card-gloss max-w-6xl w-full mx-auto p-4 sm:p-5 rounded-2xl border border-[#2C3960] z-20 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> {albumTitle}
              </span>
              {currentPhoto.uploaded_by_name && (
                <>
                  <span className="text-slate-600">&bull;</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold flex items-center gap-1">
                    <User className="w-3 h-3" /> Photo by {currentPhoto.uploaded_by_name}
                  </span>
                </>
              )}
              {currentPhoto.created_at && (
                <>
                  <span className="text-slate-600">&bull;</span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {(() => {
                      try {
                        const d = new Date(currentPhoto.created_at);
                        return isNaN(d.getTime()) ? null : d.toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        });
                      } catch {
                        return null;
                      }
                    })()}
                  </span>
                </>
              )}
            </div>

            <h4 className="text-base sm:text-lg font-black text-white">
              {currentPhoto.caption || 'Focus Cup Tournament Match Action'}
            </h4>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-medium italic self-start sm:self-auto">
            &ldquo;In all things fellowship, unity, and excellence through Christ.&rdquo;
          </div>
        </div>

        {/* Thumbnail Selector Strip (if more than 1 photo) */}
        {photos.length > 1 && (
          <div className="pt-2 border-t border-[#2C3960]/60 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {photos.map((p, idx) => {
              const thumbSrc = p.image || p.image_url;
              return (
                <button
                  key={p.id || idx}
                  onClick={() => onSelectIndex(idx)}
                  className={`shrink-0 w-12 h-12 rounded-xl overflow-hidden border-2 transition-all relative cursor-pointer ${
                    idx === currentIndex
                      ? 'border-emerald-400 scale-105 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400/40'
                      : 'border-[#2C3960] opacity-60 hover:opacity-100 hover:border-slate-400'
                  }`}
                  title={p.caption || `Photo #${idx + 1}`}
                >
                  {thumbSrc ? (
                    <img
                      src={thumbSrc}
                      alt={p.caption || `Thumbnail #${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#161D36] flex items-center justify-center text-[10px] font-black text-emerald-300">
                      #{idx + 1}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
