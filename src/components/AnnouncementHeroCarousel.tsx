'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Calendar,
  AlertCircle,
  Tag,
  Share2,
} from 'lucide-react';

export interface AnnouncementItem {
  id: number;
  title: string;
  category: string;
  category_display?: string;
  priority: string;
  priority_display?: string;
  content: string;
  image_url?: string;
  photo_url?: string;
  is_pinned: boolean;
  author_name?: string;
  created_at?: string;
}

interface AnnouncementHeroCarouselProps {
  announcements: AnnouncementItem[];
}

export default function AnnouncementHeroCarousel({ announcements }: AnnouncementHeroCarouselProps) {
  // Filter for pinned announcements first; fallback to announcements with images
  const items = announcements.filter((a) => a.is_pinned || a.photo_url || a.image_url);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-transition: Flow right-to-left every 3.5 seconds
  useEffect(() => {
    if (items.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 3500); // 3.5 seconds

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [items.length, isPaused, currentIndex]);

  if (!items || items.length === 0) {
    return null;
  }

  const current = items[currentIndex] || items[0];
  const graphicUrl = current.photo_url || current.image_url;

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe) goToNext();
    if (isRightSwipe) goToPrev();
  };

  return (
    <>
      <div
        className="relative mb-10 w-full overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-[#121B38] via-[#0F172A] to-[#1E293B] shadow-2xl shadow-amber-500/10"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Animated Timer Progress Bar */}
        {items.length > 1 && !isPaused && (
          <div className="absolute top-0 left-0 right-0 h-1 z-30 bg-slate-800/80 overflow-hidden">
            <div
              key={currentIndex}
              className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400 animate-carousel-progress"
              style={{ animationDuration: '3500ms' }}
            />
          </div>
        )}

        {/* Carousel Container (Right-to-Left Sliding Track) */}
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {items.map((item, idx) => {
            const img = item.photo_url || item.image_url;
            return (
              <div key={item.id || idx} className="w-full shrink-0 min-w-full p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                  
                  {/* Left Column: Announcement Details */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* Top Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        PINNED ANNOUNCEMENT
                      </span>

                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {item.category_display || item.category || 'Tournament'}
                      </span>

                      {item.priority === 'URGENT' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                          <AlertCircle className="w-3 h-3" />
                          URGENT ALERT
                        </span>
                      )}

                      {item.created_at && (
                        <span className="text-[11px] text-slate-400 font-medium ml-auto flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {item.created_at.slice(0, 10)}
                        </span>
                      )}
                    </div>

                    {/* Announcement Title */}
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-snug">
                      {item.title}
                    </h2>

                    {/* Announcement Content */}
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl whitespace-pre-line line-clamp-4 lg:line-clamp-6">
                      {item.content}
                    </p>

                    {/* Actions & Author */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      {img && (
                        <button
                          onClick={() => setLightboxImage(img)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          Open Full Graphic Flyer
                        </button>
                      )}

                      <a
                        href="#announcements"
                        className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                      >
                        All Notices &amp; Scripture
                      </a>

                      {item.author_name && (
                        <span className="text-[11px] text-slate-400 italic ml-auto hidden sm:inline-block">
                          Posted by {item.author_name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Graphic Design Photo / Flyer */}
                  <div className="lg:col-span-5 flex justify-center">
                    {img ? (
                      <div
                        onClick={() => setLightboxImage(img)}
                        className="group relative w-full max-w-md aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] rounded-2xl overflow-hidden border-2 border-[#2C3960] hover:border-amber-400/60 shadow-2xl shadow-black/50 cursor-pointer transition-all duration-300 hover:scale-[1.02] bg-slate-950"
                      >
                        <img
                          src={img}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                          <span className="px-3 py-1.5 rounded-lg bg-black/80 text-amber-300 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md">
                            <Maximize2 className="w-3.5 h-3.5" /> Click to enlarge flyer
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full max-w-md aspect-[16/10] rounded-2xl border border-dashed border-[#2C3960] bg-slate-900/40 flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-2">
                        <Sparkles className="w-10 h-10 text-amber-400/50" />
                        <p className="text-xs font-semibold text-slate-400">Official Fellowship Announcement</p>
                        <p className="text-[10px] text-slate-500">“Winning is a bonus; friendship, joy, and fellowship come first!”</p>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel Navigation Arrows */}
        {items.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              aria-label="Previous announcement"
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-950/70 hover:bg-slate-900 border border-slate-700/80 text-white flex items-center justify-center shadow-lg transition-all hover:scale-110 cursor-pointer z-20 backdrop-blur-md"
            >
              <ChevronLeft className="w-5 h-5 text-amber-300" />
            </button>

            <button
              onClick={goToNext}
              aria-label="Next announcement"
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-950/70 hover:bg-slate-900 border border-slate-700/80 text-white flex items-center justify-center shadow-lg transition-all hover:scale-110 cursor-pointer z-20 backdrop-blur-md"
            >
              <ChevronRight className="w-5 h-5 text-amber-300" />
            </button>
          </>
        )}

        {/* Carousel Indicator Dots */}
        {items.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 bg-slate-950/60 px-3 py-1.5 rounded-full border border-slate-700/50 backdrop-blur-md">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`transition-all rounded-full ${
                  i === currentIndex
                    ? 'w-6 h-2 bg-gradient-to-r from-amber-400 to-emerald-400'
                    : 'w-2 h-2 bg-slate-600 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal for Graphic Design Photo */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-6 backdrop-blur-md animate-fadeIn"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] w-full rounded-2xl overflow-hidden border border-[#2C3960] bg-slate-950 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#2C3960]/60 bg-[#161D36]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                  Fellowship Announcement Flyer
                </h4>
              </div>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Image Display */}
            <div className="p-2 sm:p-4 overflow-auto flex items-center justify-center bg-[#080E21]">
              <img
                src={lightboxImage}
                alt="Announcement Graphic Flyer"
                className="max-h-[75vh] w-auto object-contain rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
